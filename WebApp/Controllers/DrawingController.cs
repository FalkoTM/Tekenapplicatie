using Microsoft.AspNetCore.Mvc;
using WebApp.Data;
using WebApp.Models;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;

namespace WebApp.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DrawingController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public DrawingController(ApplicationDbContext context)
        {
            _context = context;
        }

        // Save drawing
        [HttpPost("save")]
        public async Task<IActionResult> SaveDrawing([FromBody] DrawingModel drawing)
        {
            _context.Drawings.Add(drawing);
            await _context.SaveChangesAsync();
            return Ok(new { message = "Drawing saved successfully!" });
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