using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WebApp.Data;
using WebApp.Models;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DrawingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private static readonly SemaphoreSlim _semaphore = new SemaphoreSlim(1, 1); // Thread-safe lock

        public DrawingController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Helper function to ensure no more than 20 items in the Drawings table
        private async Task EnsureDrawingsLimit()
        {
            var totalDrawings = await _context.Drawings.CountAsync();
            if (totalDrawings > 20)
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

        // Helper function to ensure no more than 20 items in the DeletedDrawings table
        private async Task EnsureDeletedDrawingsLimit()
        {
            var totalDeletedDrawings = await _context.DeletedDrawings.CountAsync();
            if (totalDeletedDrawings > 20)
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
            await _semaphore.WaitAsync(); // Lock the semaphore
            try
            {
                // Add the new drawing to the database
                _context.Drawings.Add(drawing);
                await _context.SaveChangesAsync();
                
                await EnsureDrawingsLimit();

                return Ok(new { message = "Drawing saved successfully!" });
            }
            finally
            {
                _semaphore.Release(); // Release the semaphore
            }
        }

        // Undo the most recent drawing
        [HttpPost("undo")]
        public async Task<IActionResult> Undo()
        {
            await _semaphore.WaitAsync(); // Lock the semaphore
            try
            {
                // Get the most recent drawing
                var latestDrawing = await _context.Drawings
                    .OrderByDescending(d => d.CreatedAt)
                    .FirstOrDefaultAsync();

                if (latestDrawing == null)
                    return NotFound("No drawings to undo.");

                // Move the drawing to the DeletedDrawings table
                var deletedDrawing = new DeletedDrawingModel
                {
                    DrawingData = latestDrawing.DrawingData,
                    CreatedAt = latestDrawing.CreatedAt,
                    DeletedAt = DateTime.UtcNow
                };

                _context.DeletedDrawings.Add(deletedDrawing);
                _context.Drawings.Remove(latestDrawing);
                await _context.SaveChangesAsync();
                
                await EnsureDeletedDrawingsLimit();

                return Ok(new { message = "Drawing undone successfully!", drawing = latestDrawing });
            }
            finally
            {
                _semaphore.Release(); // Release the semaphore
            }
        }

        // Redo the most recent deleted drawing
        [HttpPost("redo")]
        public async Task<IActionResult> Redo()
        {
            await _semaphore.WaitAsync(); // Lock the semaphore
            try
            {
                // Get the most recent deleted drawing
                var latestDeletedDrawing = await _context.DeletedDrawings
                    .OrderByDescending(d => d.DeletedAt)
                    .FirstOrDefaultAsync();

                if (latestDeletedDrawing == null)
                    return NotFound("No drawings to redo.");

                // Move the drawing back to the Drawings table
                var redoDrawing = new DrawingModel
                {
                    DrawingData = latestDeletedDrawing.DrawingData,
                    CreatedAt = latestDeletedDrawing.CreatedAt
                };

                _context.Drawings.Add(redoDrawing);
                _context.DeletedDrawings.Remove(latestDeletedDrawing);
                await _context.SaveChangesAsync();
                
                await EnsureDrawingsLimit();

                return Ok(new { message = "Drawing redone successfully!", drawing = redoDrawing });
            }
            finally
            {
                _semaphore.Release(); // Release the semaphore
            }
        }

        // Get latest drawing
        [HttpGet("latest")]
        public async Task<IActionResult> GetLatestDrawing()
        {
            var latestDrawing = await _context.Drawings
                .OrderByDescending(d => d.CreatedAt)
                .FirstOrDefaultAsync();

            if (latestDrawing == null)
                return NotFound("No drawings found.");

            return Ok(latestDrawing);
        }
    }
}