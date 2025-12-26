# Authentication System Testing Checklist

This document provides a comprehensive testing checklist for the authentication system.

## Pre-requisites
- [ ] MySQL server is running
- [ ] Database `blog_system` exists with schema loaded
- [ ] Backend .env file is configured
- [ ] Frontend .env file is configured
- [ ] Backend dependencies installed (`npm install` in blog-system-backend)
- [ ] Frontend dependencies installed (`npm install` in blog-system-frontend)

## Backend Tests

### 1. User Registration Tests

#### Test 1.1: Register New User (Success)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "user_type": "user"
  }'
```
**Expected**: 201 status, returns user data with tokens

#### Test 1.2: Register Duplicate Email (Fail)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test456",
    "username": "testuser2",
    "first_name": "Test",
    "last_name": "User2",
    "user_type": "user"
  }'
```
**Expected**: 400 status, "Email already exists"

#### Test 1.3: Register with Weak Password (Fail)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "weak@example.com",
    "password": "test",
    "username": "weakuser",
    "first_name": "Weak",
    "last_name": "User",
    "user_type": "user"
  }'
```
**Expected**: 400 status, password validation error

#### Test 1.4: Register Admin without Secret (Fail)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin1@example.com",
    "password": "Admin123",
    "username": "admin1",
    "first_name": "Admin",
    "last_name": "One",
    "user_type": "admin"
  }'
```
**Expected**: 403 status, "Invalid admin secret key"

#### Test 1.5: Register Admin with Secret (Success)
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin1@example.com",
    "password": "Admin123",
    "username": "admin1",
    "first_name": "Admin",
    "last_name": "One",
    "user_type": "admin",
    "admin_secret": "admin_secret_2024"
  }'
```
**Expected**: 201 status, returns admin user data with tokens

### 2. Login Tests

#### Test 2.1: User Login (Success)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123",
    "user_type": "user"
  }'
```
**Expected**: 200 status, returns user data with tokens

#### Test 2.2: User Login with Wrong Password (Fail)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "WrongPassword",
    "user_type": "user"
  }'
```
**Expected**: 401 status, "Invalid credentials"

#### Test 2.3: Admin Login (Success)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin1@example.com",
    "password": "Admin123",
    "user_type": "admin"
  }'
```
**Expected**: 200 status, returns admin data with tokens

#### Test 2.4: User Tries Admin Login (Fail)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "password": "Test123",
    "user_type": "admin"
  }'
```
**Expected**: 403 status, "Access denied. Admin credentials required."

#### Test 2.5: Admin Tries User Login (Fail)
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin1@example.com",
    "password": "Admin123",
    "user_type": "user"
  }'
```
**Expected**: 403 status, "Access denied. User credentials required."

### 3. Protected Route Tests

#### Test 3.1: Get Profile with Valid Token (Success)
```bash
# First login to get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"Test123","user_type":"user"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')

# Then access profile
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```
**Expected**: 200 status, returns user profile data

#### Test 3.2: Get Profile without Token (Fail)
```bash
curl -X GET http://localhost:5000/api/auth/profile
```
**Expected**: 401 status, "No token provided"

#### Test 3.3: Get Profile with Invalid Token (Fail)
```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer invalid_token_here"
```
**Expected**: 401 status, "Invalid token"

### 4. Token Refresh Tests

#### Test 4.1: Refresh Token (Success)
```bash
# First login to get refresh token
REFRESH_TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"Test123","user_type":"user"}' \
  | grep -o '"refreshToken":"[^"]*' | sed 's/"refreshToken":"//')

# Then refresh
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d "{\"refreshToken\":\"$REFRESH_TOKEN\"}"
```
**Expected**: 200 status, returns new tokens

#### Test 4.2: Refresh with Invalid Token (Fail)
```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{"refreshToken":"invalid_token"}'
```
**Expected**: 401 status, "Invalid or expired refresh token"

### 5. Logout Test

#### Test 5.1: Logout (Success)
```bash
# First login to get token
TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"testuser@example.com","password":"Test123","user_type":"user"}' \
  | grep -o '"token":"[^"]*' | sed 's/"token":"//')

# Then logout
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```
**Expected**: 200 status, "Logout successful"

## Frontend Tests

### 1. User Registration Flow
- [ ] Navigate to http://localhost:3000/register
- [ ] Fill in all fields with valid data
- [ ] Password must have uppercase, lowercase, and number
- [ ] Confirm password must match password
- [ ] Click "Register"
- [ ] Should redirect to home page (/)
- [ ] Header should show user is logged in

### 2. Admin Registration Flow
- [ ] Navigate to http://localhost:3000/admin/register
- [ ] Fill in all fields with valid data
- [ ] Enter admin secret key: `admin_secret_2024`
- [ ] Click "Register as Admin"
- [ ] Should redirect to admin dashboard (/admin/dashboard)
- [ ] Header should show admin is logged in

### 3. User Login Flow
- [ ] Navigate to http://localhost:3000/login
- [ ] Enter user email and password
- [ ] Click "Login"
- [ ] Should redirect to home page (/)
- [ ] User should be authenticated

### 4. Admin Login Flow
- [ ] Navigate to http://localhost:3000/admin/login
- [ ] Enter admin email and password
- [ ] Click "Login"
- [ ] Should redirect to admin dashboard (/admin/dashboard)
- [ ] Admin should be authenticated

### 5. Protected Routes
- [ ] Without login, try to access /profile
- [ ] Should redirect to /login
- [ ] Without admin login, try to access /admin/dashboard
- [ ] Should redirect to /admin/login
- [ ] Login as user, try to access /admin/dashboard
- [ ] Should redirect to home page (/)

### 6. Token Refresh
- [ ] Login and get access token
- [ ] Wait 16 minutes (access token expires in 15m)
- [ ] Try to access protected route
- [ ] Should automatically refresh token
- [ ] Request should succeed without manual re-login

### 7. Logout Flow
- [ ] Login as any user
- [ ] Click logout button
- [ ] Should redirect to login page
- [ ] Tokens should be removed from localStorage
- [ ] Cannot access protected routes anymore

### 8. Persistent Authentication
- [ ] Login to the application
- [ ] Close browser/tab
- [ ] Reopen and navigate to http://localhost:3000
- [ ] Should still be logged in
- [ ] User data should be restored from localStorage

### 9. Password Validation
- [ ] Try registering with password "test"
- [ ] Should show error: "Password must be at least 6 characters"
- [ ] Try password "testtest"
- [ ] Should show error about missing uppercase
- [ ] Try password "TESTTEST"
- [ ] Should show error about missing lowercase
- [ ] Try password "TestTest"
- [ ] Should show error about missing number
- [ ] Try password "Test123"
- [ ] Should succeed

### 10. Form Validation
- [ ] Try submitting registration form with empty fields
- [ ] Should show HTML5 validation errors
- [ ] Try registering with mismatched passwords
- [ ] Should show "Passwords do not match"
- [ ] Try registering with duplicate email
- [ ] Should show "Email already exists"

## Integration Tests

### 1. Full User Flow
1. Register new user account
2. Login with credentials
3. Access user dashboard
4. Create a post
5. View own profile
6. Logout
7. Login again
8. Verify still has access

### 2. Full Admin Flow
1. Register new admin account (with secret)
2. Login with admin credentials
3. Access admin dashboard
4. View all users
5. View all posts
6. View analytics
7. Logout
8. Try accessing admin route (should fail)

### 3. Role-Based Access
1. Login as user
2. Try accessing admin routes (should redirect)
3. Logout
4. Login as admin
5. Access admin routes (should work)
6. Access user routes (should work)

### 4. Token Expiration Handling
1. Login and get token
2. Manually expire token in localStorage (modify timestamp)
3. Make API request
4. Should automatically refresh
5. Request should succeed

## Manual Testing Checklist

### Backend
- [x] Auth controller handles registration
- [x] Auth controller handles login
- [x] Auth controller validates user_type
- [x] Auth middleware verifies tokens
- [x] Admin middleware restricts access
- [x] Password hashing with bcrypt
- [x] JWT token generation
- [x] Token refresh mechanism
- [x] Error handling for invalid credentials
- [x] Error handling for missing fields

### Frontend
- [x] AuthContext manages state
- [x] Login pages pass user_type
- [x] Registration pages created
- [x] Protected routes work
- [x] Auth routes redirect logged-in users
- [x] Token storage in localStorage
- [x] Axios interceptors handle 401
- [x] Automatic token refresh
- [x] Form validation
- [x] Error display

## Performance Tests
- [ ] Login with 100 concurrent users
- [ ] Token refresh with 100 concurrent requests
- [ ] Protected route access with valid tokens
- [ ] Database query performance for user lookup

## Security Tests
- [ ] SQL injection attempts on login
- [ ] XSS attempts in registration fields
- [ ] CSRF protection
- [ ] Password hashing verification
- [ ] Token tampering attempts
- [ ] Expired token rejection
- [ ] Admin secret key validation

## Troubleshooting

### Common Issues

1. **Cannot connect to database**
   - Check MySQL is running
   - Verify .env database credentials
   - Check database exists

2. **CORS errors**
   - Verify CORS_ORIGIN in backend .env
   - Should match frontend URL

3. **Token expired errors**
   - Check system time is correct
   - Verify JWT_SECRET matches between login and verification

4. **Admin secret not working**
   - Check ADMIN_SECRET_KEY in backend .env
   - Default is "admin_secret_2024"

5. **Registration fails silently**
   - Check browser console for errors
   - Check network tab for API response
   - Verify all required fields are sent

## Test Results

Record your test results here:

| Test | Status | Notes |
|------|--------|-------|
| User Registration | ⬜ Pass ⬜ Fail | |
| Admin Registration | ⬜ Pass ⬜ Fail | |
| User Login | ⬜ Pass ⬜ Fail | |
| Admin Login | ⬜ Pass ⬜ Fail | |
| Token Refresh | ⬜ Pass ⬜ Fail | |
| Protected Routes | ⬜ Pass ⬜ Fail | |
| Logout | ⬜ Pass ⬜ Fail | |
| Password Validation | ⬜ Pass ⬜ Fail | |
| Role-Based Access | ⬜ Pass ⬜ Fail | |
| Persistent Auth | ⬜ Pass ⬜ Fail | |

## Conclusion

All tests should pass before considering the authentication system complete and production-ready.
