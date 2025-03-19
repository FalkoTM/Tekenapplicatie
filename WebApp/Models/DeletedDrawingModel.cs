using System;
using System.ComponentModel.DataAnnotations;

namespace WebApp.Models
{
    public class DeletedDrawingModel
    {
        [Key]
        public int Id { get; set; }
        
        [Required]
        public string GeoJSON { get; set; } // GeoJSON object representing the drawing

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow; // Timestamp for when the drawing was created
        public DateTime DeletedAt { get; set; } = DateTime.UtcNow; // Timestamp for when the drawing was deleted
    }
}