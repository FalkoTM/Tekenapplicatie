using System;
using System.ComponentModel.DataAnnotations;

namespace WebApp.Models
{
    public class DeletedDrawingModel
    {
        [Key]
        public int Id { get; set; }
        [Required]
        public string DrawingData { get; set; }
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime DeletedAt { get; set; } = DateTime.UtcNow; 
    }
}