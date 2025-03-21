using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Models;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;
using Microsoft.AspNetCore.SignalR;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DrawingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly IHubContext<DrawingHub> _hubContext;
        private static readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1); // Thread-safe lock

        public DrawingController(ApplicationDbContext context, IHubContext<DrawingHub> hubContext)
        {
            _context = context;
            _hubContext = hubContext;
        }

        // Helper function to ensure no more than 2000 items in the Drawings table
        private async Task EnsureDrawingsLimit(int drawinglimit)
        {
            var totalDrawings = await _context.Drawings.CountAsync();
            if (totalDrawings > drawinglimit)
            {
                var oldestDrawing = await _context.Drawings
                    .OrderBy(d => d.CreatedAt)
                    .FirstOrDefaultAsync();

                if (oldestDrawing != null)
                {
                    _context.Drawings.Remove(oldestDrawing);
                    await _context.SaveChangesAsync();
                }
            }
        }

        // Helper function to ensure no more than 2000 items in the DeletedDrawings table
        private async Task EnsureDeletedDrawingsLimit(int drawingLimit)
        {
            var totalDeletedDrawings = await _context.DeletedDrawings.CountAsync();
            if (totalDeletedDrawings > drawingLimit)
            {
                var oldestDeletedDrawing = await _context.DeletedDrawings
                    .OrderBy(d => d.DeletedAt)
                    .FirstOrDefaultAsync();

                if (oldestDeletedDrawing != null)
                {
                    _context.DeletedDrawings.Remove(oldestDeletedDrawing);
                    await _context.SaveChangesAsync();
                }
            }
        }

        // Save drawing
        [HttpPost("save")]
        public async Task<IActionResult> SaveDrawing([FromBody] DrawingModel drawing)
        {
            await _semaphore.WaitAsync();
            try
            {
                if (string.IsNullOrEmpty(drawing.GeoJSON))
                {
                    return BadRequest("GeoJSON data is required.");
                }

                // Retrieve the username from the session
                var username = HttpContext.Session.GetString("Username");

                if (string.IsNullOrEmpty(username))
                {
                    return Unauthorized("User not authenticated.");
                }

                // Set the UserId from the session
                drawing.UserId = username;

                // Clear all entries in the DeletedDrawings table
                await _context.DeletedDrawings.ExecuteDeleteAsync();

                // Save the new drawing
                _context.Drawings.Add(drawing);
                await _context.SaveChangesAsync();

                await EnsureDrawingsLimit(2000);

                return Ok(new { message = "Drawing saved successfully!" });
            }
            catch (Exception ex)
            {
                // Log the exception
                Console.WriteLine($"Error saving drawing: {ex.Message}");
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
            finally
            {
                _semaphore.Release();
            }
        }
        
        // Undo the most recent drawing
        [HttpPost("undo")]
        public async Task<IActionResult> Undo()
        {
            await _semaphore.WaitAsync();
            try
            {
                // Get the most recent drawing
                var latestDrawing = await _context.Drawings
                    .OrderByDescending(d => d.CreatedAt)
                    .FirstOrDefaultAsync();

                if (latestDrawing == null)
                    return NotFound("No drawings to undo.");

                // Move only the most recent drawing to DeletedDrawings
                var deletedDrawing = new DeletedDrawingModel
                {
                    GeoJSON = latestDrawing.GeoJSON,
                    UserId = latestDrawing.UserId, // Include the UserId
                    CreatedAt = latestDrawing.CreatedAt,
                    DeletedAt = DateTime.UtcNow
                };

                _context.DeletedDrawings.Add(deletedDrawing);
                _context.Drawings.Remove(latestDrawing);
                await _context.SaveChangesAsync();

                await EnsureDeletedDrawingsLimit(2000);

                // Notify all clients to update their canvas
                await _hubContext.Clients.All.SendAsync("ReceiveUndo");

                return Ok(new { message = "Last drawing undone successfully!", drawing = deletedDrawing });
            }
            finally
            {
                _semaphore.Release();
            }
        }

        // Redo the most recent deleted drawing
        [HttpPost("redo")]
        public async Task<IActionResult> Redo()
        {
            await _semaphore.WaitAsync();
            try
            {
                var latestDeletedDrawing = await _context.DeletedDrawings
                    .OrderByDescending(d => d.DeletedAt)
                    .FirstOrDefaultAsync();

                if (latestDeletedDrawing == null)
                    return NotFound("No drawings to redo.");

                // Move only the most recent deleted drawing back to Drawings
                var redoDrawing = new DrawingModel
                {
                    GeoJSON = latestDeletedDrawing.GeoJSON,
                    UserId = latestDeletedDrawing.UserId, // Include the UserId
                    CreatedAt = latestDeletedDrawing.CreatedAt
                };

                _context.Drawings.Add(redoDrawing);
                _context.DeletedDrawings.Remove(latestDeletedDrawing);
                await _context.SaveChangesAsync();

                await EnsureDrawingsLimit(2000);

                // Notify all clients to update their canvas
                await _hubContext.Clients.All.SendAsync("ReceiveRedo");

                return Ok(new { message = "Drawing redone successfully!", drawing = redoDrawing });
            }
            finally
            {
                _semaphore.Release();
            }
        }
        
        // Get latest drawings
        [HttpGet("latest")]
        public async Task<IActionResult> GetLatestDrawings()
        {
            var drawings = await _context.Drawings
                .OrderByDescending(d => d.CreatedAt)
                .Take(2000) // Retrieve the latest 2000 drawings
                .ToListAsync();

            return Ok(drawings);
        }
    }
}