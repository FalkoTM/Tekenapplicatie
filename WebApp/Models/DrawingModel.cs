using System;
using System.ComponentModel.DataAnnotations;

namespace WebApp.Models
{
    public class DrawingModel
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public string DrawingData { get; set; } // Stores the drawing as a base64 string or JSON

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}