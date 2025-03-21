public class DeletedDrawingModel
{
    public int Id { get; set; }
    public string GeoJSON { get; set; }
    public string UserId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime DeletedAt { get; set; }
}