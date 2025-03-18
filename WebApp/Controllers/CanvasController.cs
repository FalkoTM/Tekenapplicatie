using Microsoft.AspNetCore.Mvc;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace WebApp.Controllers;

public class CanvasController : Controller
{
    public IActionResult Index() => View();
}