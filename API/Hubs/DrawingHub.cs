using Microsoft.AspNetCore.SignalR;

public class DrawingHub : Hub
{
    public async Task SendDrawing(int x, int y)
    {
        await Clients.Others.SendAsync("ReceiveDrawing", x, y);
    }
}