using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace WebApp.Hubs
{
    public class DrawingHub : Hub
    {
        public async Task SendStroke(string strokeJson)
        {
            // Broadcast the stroke to all connected clients
            await Clients.All.SendAsync("ReceiveStroke", strokeJson);
        }
    }
}