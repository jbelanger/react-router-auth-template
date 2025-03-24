using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthBackend.Controllers;

[ApiController]
[Route("api")]
public class ApiController : ControllerBase
{
    private readonly ILogger<ApiController> _logger;

    public ApiController(ILogger<ApiController> logger)
    {
        _logger = logger;
    }

    [HttpGet("protected-data")]
    [Authorize]
    public IActionResult GetProtectedData()
    {
        try
        {
            // Get user information from the claims
            var userId = User.FindFirst("sub")?.Value;
            var userName = User.FindFirst("name")?.Value;
            var userEmail = User.FindFirst("email")?.Value;
            var userRoles = User.FindAll(System.Security.Claims.ClaimTypes.Role).Select(c => c.Value).ToList();
            var userPermissions = User.FindAll("permission").Select(c => c.Value).ToList();
            var tenantId = User.FindFirst("tenantId")?.Value;

            // Return protected data along with user information
            return Ok(new
            {
                message = "This is protected data from the backend API",
                timestamp = DateTime.UtcNow,
                user = new
                {
                    id = userId,
                    name = userName,
                    email = userEmail,
                    roles = userRoles,
                    permissions = userPermissions,
                    tenantId = tenantId
                },
                data = new[]
                {
                    new { id = 1, name = "Item 1", value = "Value 1" },
                    new { id = 2, name = "Item 2", value = "Value 2" },
                    new { id = 3, name = "Item 3", value = "Value 3" }
                }
            });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting protected data");
            return StatusCode(500, "An error occurred while retrieving protected data");
        }
    }
}
