using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace WebApp.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [Authorize] // Only allow authenticated users
        public IActionResult Canvas()
        {
            // Redirect to the CanvasController's Index action
            return RedirectToAction("Index", "Canvas");
        }
    }
}