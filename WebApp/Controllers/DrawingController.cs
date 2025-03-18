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

                // Get the total number of drawings
                var totalDrawings = await _context.Drawings.CountAsync();

                // If there are more than 20 drawings, delete the oldest one
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
                    CreatedAt = latestDrawing.CreatedAt
                };

                _context.DeletedDrawings.Add(deletedDrawing);
                _context.Drawings.Remove(latestDrawing);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Drawing undone successfully!", drawing = latestDrawing });
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