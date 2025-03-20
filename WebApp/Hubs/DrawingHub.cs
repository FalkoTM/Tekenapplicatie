using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

public class DrawingHub : Hub
{
    public async Task SendStroke(string strokeJson)
    {
        await Clients.Others.SendAsync("ReceiveStroke", strokeJson);
    }

    public async Task UndoDrawing()
    {
        await Clients.Others.SendAsync("ReceiveUndo");
    }

    public async Task RedoDrawing()
    {
        await Clients.Others.SendAsync("ReceiveRedo");
    }
}