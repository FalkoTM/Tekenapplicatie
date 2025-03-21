using Microsoft.AspNetCore.Mvc;

namespace WebApp.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public IActionResult SetUser(string username)
        {
            // Store the username in the session
            HttpContext.Session.SetString("Username", username);

            // Redirect to the Canvas controller's Index action
            return RedirectToAction("Index", "Canvas");
        }
    }
}