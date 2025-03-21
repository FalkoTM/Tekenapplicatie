using Microsoft.AspNetCore.Mvc;

namespace WebApp.Controllers
{
    public class CanvasController : Controller
    {
        public IActionResult Index()
        {
            // Retrieve the username from the session
            var username = HttpContext.Session.GetString("Username");

            if (string.IsNullOrEmpty(username))
            {
                // If no username is set, redirect to the home page
                return RedirectToAction("Index", "Home");
            }

            // Pass the username to the view
            ViewData["Username"] = username;
            return View();
        }
    }
}