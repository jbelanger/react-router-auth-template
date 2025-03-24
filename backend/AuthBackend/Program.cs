using System.Text;
using AuthBackend.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure authentication with multiple schemes
builder.Services.AddAuthentication()
    // Configure Azure AD authentication for validating incoming Microsoft tokens
    //.AddJwtBearer("AzureAd", options =>
    //{
    //    var tenantId = builder.Configuration["AzureAd:TenantId"];
    //    var clientId = builder.Configuration["AzureAd:ClientId"];

    //    options.MetadataAddress = $"https://login.microsoftonline.com/{tenantId}/v2.0/.well-known/openid-configuration";
    //    options.Authority = $"https://login.microsoftonline.com/{tenantId}/v2.0";
    //    options.RequireHttpsMetadata = true;
    //    options.SaveToken = true;
    //    options.TokenValidationParameters = new TokenValidationParameters
    //    {
    //        ValidateIssuerSigningKey = true,
    //        ValidateIssuer = true,
    //        ValidateAudience = true,
    //        ValidateLifetime = true,
    //        ValidIssuers = new[] {
    //            $"https://login.microsoftonline.com/{tenantId}/v2.0",
    //            $"https://sts.windows.net/{tenantId}/"
    //        },
    //        ValidAudiences = new[] {
    //            clientId,                   // Application ID URI
    //            $"api://{clientId}",        // API URL format
    //            $"https://{clientId}"       // Alternative format
    //        }
    //    };

    //    // Add event handlers for debugging token validation
    //    options.Events = new JwtBearerEvents
    //    {
    //        OnAuthenticationFailed = context =>
    //        {
    //            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
    //            logger.LogError("Authentication failed: {Error}", context.Exception);
    //            return Task.CompletedTask;
    //        },
    //        OnTokenValidated = context =>
    //        {
    //            var logger = context.HttpContext.RequestServices.GetRequiredService<ILogger<Program>>();
    //            logger.LogInformation("Token validated successfully");
    //            return Task.CompletedTask;
    //        }
    //    };
    //})
    // Configure our own JWT authentication for enriched tokens
    .AddJwtBearer("JWT", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"] ?? "auth-backend",
            ValidAudience = builder.Configuration["Jwt:Audience"] ?? "remix-app",
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"] ?? "this-is-a-secret-key-for-development-only"))
        };
    });

// Add authorization
builder.Services.AddAuthorization();

// Register the TokenService
builder.Services.AddScoped<TokenService>();

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins(builder.Configuration["AllowedOrigins"] ?? "http://localhost:3000")
            .AllowAnyMethod()
            .AllowAnyHeader();
    });
});

// Add Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Auth Backend API", Version = "v1" });

    // Add JWT authentication to Swagger
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token}\"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
