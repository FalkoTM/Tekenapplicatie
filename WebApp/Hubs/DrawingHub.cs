using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

public class DrawingHub : Hub
{
    public async Task SendStroke(string strokeJson, string username)
    {
        await Clients.Others.SendAsync("ReceiveStroke", strokeJson, username);
    }

    public async Task NotifyUndo()
    {
        await Clients.Others.SendAsync("ReceiveUndo");
    }

    public async Task NotifyRedo()
    {
        await Clients.Others.SendAsync("ReceiveRedo");
    }
}