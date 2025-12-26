# Quick Setup Guide

## Prerequisites Check
```bash
# Check Node.js version (should be v14+)
node --version

# Check MySQL version (should be v8+)
mysql --version

# Check npm version
npm --version
```

## Step-by-Step Setup

### 1. Database Setup (5 minutes)

```bash
# Login to MySQL
mysql -u root -p

# Run the schema file
mysql -u root -p < blog-system-backend/database-schema.sql

# Verify database creation
mysql -u root -p -e "USE blog_system; SHOW TABLES;"
```

### 2. Backend Setup (5 minutes)

```bash
# Navigate to backend
cd blog-system-backend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file with your settings
nano .env
# or
vim .env

# Start the server
npm start
```

The backend should now be running on `http://localhost:5000`

Test it: `curl http://localhost:5000/health`

### 3. Frontend Setup (5 minutes)

```bash
# Open new terminal and navigate to frontend
cd blog-system-frontend

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit .env file (usually defaults are fine)
nano .env

# Start the development server
npm start
```

The frontend should now be running on `http://localhost:3000`

## Creating Your First Admin User

Since there's no UI for registration yet, you can use curl or Postman:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!",
    "username": "admin",
    "first_name": "Admin",
    "last_name": "User",
    "role": "admin"
  }'
```

Or create a regular user:

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePassword123!",
    "username": "testuser",
    "first_name": "Test",
    "last_name": "User",
    "role": "user"
  }'
```

## Testing the Setup

### 1. Test Backend Health
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "success": true,
  "message": "Server is running",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 2. Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "SecurePassword123!"
  }'
```

### 3. Test Frontend
Open your browser and navigate to:
- User Portal: `http://localhost:3000`
- Admin Login: `http://localhost:3000/admin/login`
- User Login: `http://localhost:3000/login`

## Common Issues and Solutions

### Issue: Database connection fails
**Solution**: Check your `.env` file in backend has correct credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_password
DB_NAME=blog_system
```

### Issue: CORS errors in browser
**Solution**: Make sure backend `.env` has:
```env
CORS_ORIGIN=http://localhost:3000
```

### Issue: Port already in use
**Solution**: 
```bash
# Find process using port 5000
lsof -i :5000
# or
netstat -ano | findstr :5000

# Kill the process and restart
```

### Issue: JWT token errors
**Solution**: Make sure both JWT secrets are set in backend `.env`:
```env
JWT_SECRET=your_super_secret_key_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_key_min_32_chars
```

## Development Workflow

### Backend Development
```bash
cd blog-system-backend
npm run dev  # Uses nodemon for auto-reload
```

### Frontend Development
```bash
cd blog-system-frontend
npm start  # React dev server with hot reload
```

### Watch Backend Logs
The backend logs all requests with Morgan logger. Watch for:
- API requests: `GET /api/posts 200`
- Database connections: `✓ Database connected successfully`
- Errors: Detailed stack traces in development mode

## Next Steps After Setup

1. **Create Admin User**: Use the curl command above
2. **Login**: Test login at `http://localhost:3000/admin/login`
3. **Create First Post**: Use API or wait for UI implementation
4. **Test Analytics**: Create posts and view dashboard stats

## Environment Variables Reference

### Backend (.env)
```env
# Server
PORT=5000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=blog_system

# JWT
JWT_SECRET=min_32_chars_random_string
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=different_32_chars_random_string
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CORS_ORIGIN=http://localhost:3000
```

### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

## Production Deployment Notes

Before deploying to production:

1. Change `NODE_ENV=production` in backend
2. Generate strong JWT secrets (use `openssl rand -base64 32`)
3. Use environment-specific database credentials
4. Enable HTTPS
5. Set proper CORS_ORIGIN
6. Build frontend: `npm run build`
7. Serve frontend build folder with nginx or similar
8. Use process manager for backend (PM2, systemd)
9. Set up database backups
10. Configure proper logging
