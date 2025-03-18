using System.ComponentModel.DataAnnotations;

namespace API.Models;

public class Drawing
{
    [Key]
    public int Id { get; set; }
    public string UserId { get; set; }
    public string Data { get; set; } // JSON opslag voor tekening
}
