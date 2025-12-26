# Authentication System Guide

This guide provides comprehensive documentation for the authentication system implemented in the Custom Blog System.

## Overview

The authentication system includes:
- JWT-based authentication with access and refresh tokens
- Role-based access control (Admin and User roles)
- Separate login flows for admin and user portals
- Password hashing with bcrypt
- Automatic token refresh on expiration
- Protected routes with role-based authorization

## Architecture

### Backend Components

#### 1. Authentication Routes (`/api/auth`)
- **POST /api/auth/register** - User/Admin registration
- **POST /api/auth/login** - User/Admin login
- **POST /api/auth/refresh-token** - Refresh access token
- **POST /api/auth/logout** - Logout user
- **GET /api/auth/profile** - Get current user profile (protected)

#### 2. JWT Token System
- **Access Token**: Expires in 15 minutes
- **Refresh Token**: Expires in 7 days
- Access tokens contain: userId, role, email
- Refresh tokens contain: userId

#### 3. Middleware
- `verifyToken`: Validates JWT access token
- `checkRole`: Verifies user has specific role(s)
- `adminOnly`: Restricts access to admin users only

#### 4. Password Security
- Passwords hashed using bcrypt with 10 salt rounds
- Password validation:
  - Minimum 6 characters
  - Must contain uppercase letter
  - Must contain lowercase letter
  - Must contain number

### Frontend Components

#### 1. Auth Pages
- **AdminLogin** (`/admin/login`) - Admin portal login
- **AdminRegister** (`/admin/register`) - Admin registration (requires secret key)
- **UserLogin** (`/login`) - User portal login
- **UserRegister** (`/register`) - User registration

#### 2. Authentication Context
- Manages global authentication state
- Provides login, register, logout functions
- Handles token storage in localStorage
- Automatic token refresh on API errors

#### 3. Protected Routes
- **PrivateRoute**: Requires authentication
- **AuthRoute**: Redirects authenticated users
- **RoleBasedRoute**: Requires specific roles

#### 4. API Service Layer
- Axios instance with base URL configuration
- Request interceptor adds Authorization header
- Response interceptor handles 401 errors and token refresh

## Usage Guide

### Backend Setup

1. **Environment Variables**
```env
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here_change_in_production
JWT_REFRESH_EXPIRES_IN=7d
ADMIN_SECRET_KEY=admin_secret_2024
```

2. **Database Schema**
The `users` table includes:
- `id`: Primary key
- `email`: Unique email address
- `password_hash`: Bcrypt hashed password
- `username`: Unique username
- `first_name`: User's first name
- `last_name`: User's last name
- `role`: ENUM('admin', 'user')

### Frontend Setup

1. **Environment Variables**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

2. **AuthContext Usage**
```javascript
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  const handleLogin = async () => {
    const result = await login({
      email: 'user@example.com',
      password: 'password',
      user_type: 'user' // or 'admin'
    });
    
    if (result.success) {
      // Redirect to dashboard
    }
  };
  
  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user.username}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

## API Endpoints

### 1. Register User/Admin

**Endpoint**: `POST /api/auth/register`

**User Registration Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "username": "john_doe",
  "first_name": "John",
  "last_name": "Doe",
  "user_type": "user"
}
```

**Admin Registration Request**:
```json
{
  "email": "admin@example.com",
  "password": "Admin123",
  "username": "admin_user",
  "first_name": "Admin",
  "last_name": "User",
  "user_type": "admin",
  "admin_secret": "admin_secret_2024"
}
```

**Success Response** (201):
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": 1,
    "username": "john_doe",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login User/Admin

**Endpoint**: `POST /api/auth/login`

**Request**:
```json
{
  "email": "user@example.com",
  "password": "Password123",
  "user_type": "user"
}
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": 1,
    "username": "john_doe",
    "email": "user@example.com",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 3. Refresh Token

**Endpoint**: `POST /api/auth/refresh-token`

**Request**:
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 4. Get Profile

**Endpoint**: `GET /api/auth/profile`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):
```json
{
  "success": true,
  "data": {
    "id": 1,
    "email": "user@example.com",
    "username": "john_doe",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

### 5. Logout

**Endpoint**: `POST /api/auth/logout`

**Headers**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response** (200):
```json
{
  "success": true,
  "message": "Logout successful"
}
```

## Security Features

### 1. Password Security
- Bcrypt hashing with 10 salt rounds
- Password strength validation
- Minimum requirements enforced

### 2. JWT Security
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days)
- Tokens signed with secret keys
- Role-based access control

### 3. Admin Registration Security
- Requires admin secret key
- Secret key stored in environment variables
- Default secret: `admin_secret_2024` (change in production)

### 4. API Security
- CORS configuration
- Request/response interceptors
- Automatic token refresh on 401 errors
- Protected routes with middleware

## Error Handling

### Common Error Responses

**400 Bad Request**:
```json
{
  "success": false,
  "message": "All fields are required"
}
```

**401 Unauthorized**:
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

**403 Forbidden**:
```json
{
  "success": false,
  "message": "Access denied. Admin credentials required."
}
```

## Token Flow

1. **Initial Login**:
   - User submits credentials
   - Server validates credentials
   - Server generates access + refresh tokens
   - Tokens stored in localStorage
   - User redirected to dashboard

2. **API Requests**:
   - Access token added to Authorization header
   - Server validates token
   - If valid, request processed
   - If expired, 401 error returned

3. **Token Refresh**:
   - Frontend receives 401 error
   - Axios interceptor catches error
   - Refresh token sent to /refresh-token endpoint
   - New tokens received and stored
   - Original request retried with new token

4. **Logout**:
   - Tokens removed from localStorage
   - User redirected to login page

## Testing

### Test User Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "user_type": "user"
  }'
```

### Test Admin Registration
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "Admin123",
    "username": "adminuser",
    "first_name": "Admin",
    "last_name": "User",
    "user_type": "admin",
    "admin_secret": "admin_secret_2024"
  }'
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123",
    "user_type": "user"
  }'
```

### Test Protected Route
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Best Practices

1. **Environment Variables**: Never commit secrets to version control
2. **Token Storage**: Use httpOnly cookies in production instead of localStorage
3. **Password Policy**: Enforce strong password requirements
4. **Rate Limiting**: Implement rate limiting on auth endpoints
5. **Email Verification**: Add email verification for registration
6. **Two-Factor Auth**: Consider adding 2FA for admin accounts
7. **Audit Logging**: Log all authentication events
8. **Session Management**: Track active sessions
9. **Token Rotation**: Rotate refresh tokens regularly
10. **HTTPS**: Always use HTTPS in production

## Troubleshooting

### Issue: "Invalid admin secret key"
- Solution: Check ADMIN_SECRET_KEY in backend .env file

### Issue: "Token expired"
- Solution: Token refresh should happen automatically. Check axios interceptors.

### Issue: "User not found" on protected route
- Solution: Verify token is valid and user exists in database

### Issue: CORS errors
- Solution: Check CORS_ORIGIN in backend .env matches frontend URL

### Issue: "Passwords do not match"
- Solution: Ensure confirmPassword matches password in registration

## Future Enhancements

- [ ] Email verification
- [ ] Password reset functionality
- [ ] Two-factor authentication
- [ ] Social login (Google, Facebook)
- [ ] Session management
- [ ] Remember me functionality
- [ ] Account lockout after failed attempts
- [ ] Audit logging
- [ ] Rate limiting
- [ ] Refresh token rotation
- [ ] Device tracking
