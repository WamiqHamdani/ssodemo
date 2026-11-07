using System.Security.Claims;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// Validate access tokens issued by Entra ID to the React app (SSO user)
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

// App roles defined in Entra ("App roles") arrive in the token's "roles" claim
builder.Services.AddAuthorizationBuilder()
    .AddPolicy("UserOrAdmin", p => p.RequireAssertion(ctx => HasAnyRole(ctx.User, "User", "Admin")))
    .AddPolicy("Admin", p => p.RequireAssertion(ctx => HasAnyRole(ctx.User, "Admin")));

var app = builder.Build();

app.UseAuthentication();
app.UseAuthorization();

var api = app.MapGroup("/api")
    .RequireAuthorization()
    .RequireScope("access_as_user");

// Returns who the caller is, read from the validated token
// v1 tokens carry "upn"; v2 tokens carry "preferred_username"
api.MapGet("/me", (ClaimsPrincipal user) => new
{
    name = user.FindFirst("name")?.Value,
    username = user.FindFirst("preferred_username")?.Value
        ?? user.FindFirst("upn")?.Value
        ?? user.FindFirst(ClaimTypes.Upn)?.Value,
    objectId = user.GetObjectId(),
    tenantId = user.GetTenantId(),
    roles = GetRoles(user),
});

api.MapGet("/user-area", (ClaimsPrincipal user) => new { message = $"Hello {user.FindFirst("name")?.Value}, your role can access the user area." })
    .RequireAuthorization("UserOrAdmin");

api.MapGet("/admin-area", () => new { message = "Welcome, Admin. Only the Admin role can see this." })
    .RequireAuthorization("Admin");

app.Run();

// "roles" may be mapped to ClaimTypes.Role depending on inbound claim mapping
static string[] GetRoles(ClaimsPrincipal user) =>
    user.FindAll("roles").Concat(user.FindAll(ClaimTypes.Role)).Select(c => c.Value).Distinct().ToArray();

static bool HasAnyRole(ClaimsPrincipal user, params string[] roles) =>
    GetRoles(user).Intersect(roles).Any();
