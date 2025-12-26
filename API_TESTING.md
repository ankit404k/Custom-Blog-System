# API Testing Guide

This guide provides example API calls for testing the Custom Blog System backend.

## Base URL
```
http://localhost:5000/api
```

## Authentication Flow

### 1. Register a New User

**Admin User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!",
    "username": "admin",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }'
```

**Regular User:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@test.com",
    "password": "User123!",
    "username": "testuser",
    "first_name": "John",
    "last_name": "Doe",
    "role": "user"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "userId": 1,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "Admin123!"
  }'
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "userId": 1,
    "username": "admin",
    "email": "admin@test.com",
    "role": "admin",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

Save the token for subsequent requests:
```bash
export TOKEN="your_token_here"
```

### 3. Get Profile

```bash
curl -X GET http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer $TOKEN"
```

### 4. Refresh Token

```bash
curl -X POST http://localhost:5000/api/auth/refresh-token \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "your_refresh_token_here"
  }'
```

### 5. Logout

```bash
curl -X POST http://localhost:5000/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"
```

## Posts API

### 1. Create a Post

```bash
curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "My First Blog Post",
    "content": "This is the content of my first blog post. It can be quite long and include HTML formatting.",
    "slug": "my-first-blog-post",
    "status": "published",
    "featured_image": "https://example.com/image.jpg"
  }'
```

### 2. Get All Posts

```bash
# Get all posts
curl -X GET http://localhost:5000/api/posts

# Get published posts only
curl -X GET "http://localhost:5000/api/posts?status=published"

# Get with pagination
curl -X GET "http://localhost:5000/api/posts?limit=10&offset=0"
```

### 3. Get Post by ID

```bash
curl -X GET http://localhost:5000/api/posts/1
```

### 4. Get Post by Slug

```bash
curl -X GET http://localhost:5000/api/posts/slug/my-first-blog-post
```

### 5. Get Current User's Posts

```bash
curl -X GET http://localhost:5000/api/posts/my-posts \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Update a Post

```bash
curl -X PUT http://localhost:5000/api/posts/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Updated Post Title",
    "content": "Updated content",
    "status": "published"
  }'
```

### 7. Delete a Post

```bash
curl -X DELETE http://localhost:5000/api/posts/1 \
  -H "Authorization: Bearer $TOKEN"
```

## Comments API

### 1. Create a Comment

```bash
curl -X POST http://localhost:5000/api/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "post_id": 1,
    "content": "Great post! Very informative."
  }'
```

### 2. Get Comments for a Post

```bash
curl -X GET http://localhost:5000/api/comments/post/1
```

### 3. Update a Comment

```bash
curl -X PUT http://localhost:5000/api/comments/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Updated comment content"
  }'
```

### 4. Delete a Comment

```bash
curl -X DELETE http://localhost:5000/api/comments/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Approve a Comment (Admin Only)

```bash
curl -X PATCH http://localhost:5000/api/comments/1/approve \
  -H "Authorization: Bearer $TOKEN"
```

### 6. Reject a Comment (Admin Only)

```bash
curl -X PATCH http://localhost:5000/api/comments/1/reject \
  -H "Authorization: Bearer $TOKEN"
```

## Users API

### 1. Get All Users (Admin Only)

```bash
curl -X GET http://localhost:5000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

### 2. Get User by ID

```bash
curl -X GET http://localhost:5000/api/users/1 \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Update User Profile

```bash
curl -X PUT http://localhost:5000/api/users/1 \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Updated",
    "last_name": "Name",
    "bio": "This is my updated bio"
  }'
```

### 4. Update Password

```bash
curl -X PUT http://localhost:5000/api/users/1/password \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPassword123!",
    "newPassword": "NewPassword123!"
  }'
```

### 5. Delete User (Admin Only)

```bash
curl -X DELETE http://localhost:5000/api/users/2 \
  -H "Authorization: Bearer $TOKEN"
```

## Analytics API

### 1. Get Post Analytics

```bash
curl -X GET http://localhost:5000/api/analytics/post/1
```

### 2. Get All Analytics (Admin Only)

```bash
curl -X GET http://localhost:5000/api/analytics/all \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Get Top Posts

```bash
# Default top 10
curl -X GET http://localhost:5000/api/analytics/top-posts

# Custom limit
curl -X GET "http://localhost:5000/api/analytics/top-posts?limit=5"
```

### 4. Get Dashboard Stats (Admin Only)

```bash
curl -X GET http://localhost:5000/api/analytics/dashboard-stats \
  -H "Authorization: Bearer $TOKEN"
```

### 5. Like a Post

```bash
curl -X POST http://localhost:5000/api/analytics/post/1/like \
  -H "Authorization: Bearer $TOKEN"
```

## Complete Testing Workflow

Here's a complete workflow to test the entire system:

```bash
# 1. Register admin user
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!","username":"admin","first_name":"Admin","last_name":"User","role":"admin"}'

# 2. Login and save token
TOKEN=$(curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","password":"Admin123!"}' \
  | jq -r '.data.token')

# 3. Create a post
POST_ID=$(curl -X POST http://localhost:5000/api/posts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Post","content":"Test content","slug":"test-post","status":"published"}' \
  | jq -r '.data.postId')

# 4. Create a comment on the post
curl -X POST http://localhost:5000/api/comments \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"post_id\":$POST_ID,\"content\":\"Great post!\"}"

# 5. Like the post
curl -X POST http://localhost:5000/api/analytics/post/$POST_ID/like \
  -H "Authorization: Bearer $TOKEN"

# 6. Get dashboard stats
curl -X GET http://localhost:5000/api/analytics/dashboard-stats \
  -H "Authorization: Bearer $TOKEN" | jq

# 7. Get top posts
curl -X GET http://localhost:5000/api/analytics/top-posts | jq
```

## Using Postman

Import these requests into Postman:

1. Create a new Collection: "Blog System API"
2. Add a Collection Variable: `baseUrl` = `http://localhost:5000/api`
3. Add a Collection Variable: `token` = (empty, will be set after login)
4. For authenticated requests, add header: `Authorization: Bearer {{token}}`

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "message": "Email already exists"
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "message": "Invalid token"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "message": "Access denied"
}
```

### 404 Not Found
```json
{
  "success": false,
  "message": "Post not found"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Internal Server Error",
  "stack": "Error stack trace (only in development)"
}
```

## Testing Tips

1. **Use jq for JSON formatting**: `curl ... | jq`
2. **Save tokens to variables**: `export TOKEN="..."`
3. **Test error cases**: Try accessing protected routes without tokens
4. **Test permissions**: Try admin routes with user token
5. **Check database**: Verify changes with MySQL queries
6. **Monitor backend logs**: Watch for errors and request logs
7. **Use Postman environments**: Separate dev/staging/prod configs

## Database Verification

After API calls, verify in MySQL:

```sql
-- Check users
SELECT * FROM users;

-- Check posts with analytics
SELECT p.*, a.views, a.likes, a.comments_count 
FROM posts p 
LEFT JOIN analytics a ON p.id = a.post_id;

-- Check comments with status
SELECT c.*, u.username, p.title 
FROM comments c 
JOIN users u ON c.user_id = u.id 
JOIN posts p ON c.post_id = p.id;

-- Check permissions
SELECT u.username, u.role, p.permission_name 
FROM users u 
LEFT JOIN user_permissions up ON u.id = up.user_id 
LEFT JOIN permissions p ON up.permission_id = p.id;
```
