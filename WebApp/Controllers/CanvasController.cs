using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Controllers
{
    [Authorize] // Only allow authenticated users
    public class CanvasController : Controller
    {
        public IActionResult Index()
        {
            // Get the current user's username
            var username = User.Identity.Name;
            ViewData["Username"] = username;
            return View();
        }
    }
}