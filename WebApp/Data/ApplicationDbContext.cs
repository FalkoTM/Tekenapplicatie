using Microsoft.EntityFrameworkCore;
using WebApp.Models;

namespace WebApp.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<DrawingModel> Drawings { get; set; }
        public DbSet<DeletedDrawingModel> DeletedDrawings { get; set; } // New table for deleted drawings
    }
}