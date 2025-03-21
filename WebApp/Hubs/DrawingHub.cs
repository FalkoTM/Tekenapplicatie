using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

public class DrawingHub : Hub
{
    public async Task SendStroke(string strokeJson)
    {
        // Broadcast the stroke to all clients except the sender
        await Clients.Others.SendAsync("ReceiveStroke", strokeJson);
    }

    public async Task NotifyUndo()
    {
        // Broadcast the undo notification to all clients
        await Clients.Others.SendAsync("ReceiveUndo");
    }

    public async Task NotifyRedo()
    {
        // Broadcast the redo notification to all clients
        await Clients.Others.SendAsync("ReceiveRedo");
    }
}