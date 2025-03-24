using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using System.Text.Json;
using AuthBackend.Models;
using Microsoft.IdentityModel.Tokens;

namespace AuthBackend.Services;

public class TokenService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<TokenService> _logger;

    public TokenService(IConfiguration configuration, ILogger<TokenService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public string GenerateEnrichedToken(UserClaims userClaims)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key is not configured");
        var issuer = _configuration["Jwt:Issuer"] ?? "auth-backend";
        var audience = _configuration["Jwt:Audience"] ?? "remix-app";

        var securityKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var credentials = new SigningCredentials(securityKey, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new Claim(JwtRegisteredClaimNames.Sub, userClaims.Sub),
            new Claim(JwtRegisteredClaimNames.Name, userClaims.Name),
            new Claim(JwtRegisteredClaimNames.Email, userClaims.Email),
            new Claim("tenantId", userClaims.TenantId)
        };

        // Add roles as individual claims
        foreach (var role in userClaims.Roles)
        {
            claims.Add(new Claim("role", role));
        }

        // Add permissions as individual claims
        foreach (var permission in userClaims.Permissions)
        {
            claims.Add(new Claim("permission", permission));
        }

        var token = new JwtSecurityToken(
            issuer: issuer,
            audience: audience,
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(1),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public bool ValidateMicrosoftToken(string token)
    {
        // In a real implementation, this would validate the Microsoft token
        // using Microsoft's public keys and OpenID configuration

        // For this simple example, we'll just return true
        _logger.LogInformation("Validating Microsoft token (simplified)");
        return true;
    }

    public UserClaims GetUserInfoFromMicrosoftToken(string token)
    {
        // In a real implementation, this would extract user information from the Microsoft token
        // and query a database for additional user details like roles and permissions

        // For this simple example, we'll create mock user data
        _logger.LogInformation("Extracting user info from Microsoft token (simplified)");

        // Simulate extracting the user ID from the token
        var userId = Guid.NewGuid().ToString();

        return new UserClaims
        {
            Sub = userId,
            Name = "John Doe",
            Email = "john.doe@example.com",
            Roles = new List<string> { "user", "admin" },
            Permissions = new List<string> { "read:data", "write:data" },
            TenantId = "tenant-123"
        };
    }
}
