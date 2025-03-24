using AuthBackend.Models;
using AuthBackend.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AuthBackend.Controllers;

[ApiController]
[Route("auth")]
public class AuthController : ControllerBase
{
    private readonly TokenService _tokenService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(TokenService tokenService, ILogger<AuthController> logger)
    {
        _tokenService = tokenService;
        _logger = logger;
    }

    [HttpPost("enrich-token")]
    //[Authorize(AuthenticationSchemes = "AzureAd")]
    public IActionResult EnrichToken()
    {
        try
        {
            // Log all claims for debugging
            _logger.LogInformation("Available claims:");
            foreach (var claim in User.Claims)
            {
                _logger.LogInformation("Claim: {Type} = {Value}", claim.Type, claim.Value);
            }

            // Get and validate required claims
            var sub = User.FindFirst("oid")?.Value ?? User.FindFirst("sub")?.Value;
            var name = User.FindFirst("name")?.Value ?? User.FindFirst("preferred_username")?.Value;
            var email = User.FindFirst("upn")?.Value ?? User.FindFirst("preferred_username")?.Value;
            var tenantId = User.FindFirst("tid")?.Value;

            if (string.IsNullOrEmpty(sub) || string.IsNullOrEmpty(tenantId))
            {
                _logger.LogError("Missing required claims. Subject: {Sub}, TenantId: {TenantId}", sub, tenantId);
                return BadRequest("Missing required claims from Azure AD token");
            }

            // Get the validated user claims from the Azure AD token and map to our model
            var userClaims = new UserClaims
            {
                Sub = sub,
                Name = name ?? string.Empty,
                Email = email ?? string.Empty,
                TenantId = tenantId,
                Roles = (User.FindAll("roles").Any()
                    ? User.FindAll("roles")
                    : User.FindAll("http://schemas.microsoft.com/ws/2008/06/identity/claims/role"))
                    .Select(c => c.Value)
                    .ToList(),
                Permissions = User.FindAll("scp").Select(c => c.Value.Split(' ')).SelectMany(x => x).ToList()
            };

            _logger.LogInformation("Mapped user claims: {@UserClaims}", userClaims);

            // Generate an enriched token with additional claims
            var enrichedToken = _tokenService.GenerateEnrichedToken(userClaims);

            // Return the enriched token
            return Ok(new TokenResponse { Token = enrichedToken });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error enriching token");
            return StatusCode(500, "An error occurred while processing the token");
        }
    }
}
