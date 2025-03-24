# Auth Backend API

This is a simple .NET backend API that provides token enrichment for the Remix Auth POC. It demonstrates the backend portion of the secure token-based authentication architecture described in the Remix Auth documentation.

## Features

- Token enrichment endpoint (`/auth/enrich-token`)
- Protected data endpoint (`/api/protected-data`)
- JWT token generation and validation
- CORS configuration for Remix frontend
- Swagger UI for API documentation and testing

## Getting Started

### Prerequisites

- .NET 8.0 SDK or later

### Running the API

1. Navigate to the AuthBackend directory:

```bash
cd backend-api/AuthBackend
```

2. Run the API:

```bash
dotnet run
```

The API will be available at:

- HTTPS: https://localhost:7001
- HTTP: http://localhost:5000

Swagger UI will be available at:

- https://localhost:7001/swagger

## API Endpoints

### Token Enrichment

```
POST /auth/enrich-token
```

This endpoint accepts a Microsoft access token in the Authorization header and returns an enriched JWT token with additional claims like roles and permissions.

**Request:**

```
Authorization: Bearer {microsoft-access-token}
```

**Response:**

```json
{
  "token": "enriched-jwt-token"
}
```

### Protected Data

```
GET /api/protected-data
```

This endpoint requires a valid JWT token in the Authorization header and returns protected data along with user information extracted from the token claims.

**Request:**

```
Authorization: Bearer {enriched-jwt-token}
```

**Response:**

```json
{
  "message": "This is protected data from the backend API",
  "timestamp": "2025-02-26T21:52:23.123Z",
  "user": {
    "id": "user-id",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "roles": ["user", "admin"],
    "permissions": ["read:data", "write:data"],
    "tenantId": "tenant-123"
  },
  "data": [
    { "id": 1, "name": "Item 1", "value": "Value 1" },
    { "id": 2, "name": "Item 2", "value": "Value 2" },
    { "id": 3, "name": "Item 3", "value": "Value 3" }
  ]
}
```

## Configuration

The API configuration is stored in `appsettings.json`. The following settings are available:

- `Jwt:Key`: The secret key used to sign JWT tokens
- `Jwt:Issuer`: The issuer of the JWT tokens
- `Jwt:Audience`: The audience of the JWT tokens
- `AllowedOrigins`: The allowed origins for CORS

For development, the default values are:

```json
{
  "Jwt": {
    "Key": "this-is-a-secret-key-for-development-only",
    "Issuer": "auth-backend",
    "Audience": "remix-app"
  },
  "AllowedOrigins": "http://localhost:3000"
}
```

## Security Considerations

- In a production environment, the JWT key should be stored securely and not in the source code or configuration files
- The Microsoft token validation is simplified in this example and should be implemented properly in a production environment
- HTTPS should be enforced in production
