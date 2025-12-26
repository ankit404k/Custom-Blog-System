# Custom Blog System

A full-stack blog system with separate admin and user portals built with React, Node.js/Express, and MySQL.

## Project Structure

This repository contains two main applications:

### 1. Backend (`blog-system-backend/`)
Node.js/Express REST API with MySQL database

### 2. Frontend (`blog-system-frontend/`)
React application with Tailwind CSS

## Features

- **User Authentication**: JWT-based authentication with token refresh
- **Admin Portal**: Dashboard, user management, post management, analytics
- **User Portal**: Browse posts, comment, like, user profiles
- **Role-Based Access Control**: Admin and user roles with different permissions
- **Analytics**: Track views, likes, and comments on posts
- **Comment Moderation**: Admin approval system for comments

## Prerequisites

- Node.js (v14 or higher)
- MySQL (v8 or higher)
- npm or yarn

## Setup Instructions

### Database Setup

1. Create MySQL database:
```bash
mysql -u root -p
```

2. Run the database schema:
```bash
mysql -u root -p < blog-system-backend/database-schema.sql
```

### Backend Setup

1. Navigate to backend directory:
```bash
cd blog-system-backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Update `.env` with your database credentials and JWT secrets:
```env
PORT=5000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=blog_system

JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your_jwt_refresh_secret_key_here
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=http://localhost:3000
```

5. Start the server:
```bash
npm start
# or for development with auto-reload
npm run dev
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd blog-system-frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from example:
```bash
cp .env.example .env
```

4. Update `.env` with API URL:
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_ENV=development
```

5. Start the development server:
```bash
npm start
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `POST /api/auth/refresh-token` - Refresh access token
- `GET /api/auth/profile` - Get user profile

### Posts
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get post by ID
- `GET /api/posts/slug/:slug` - Get post by slug
- `GET /api/posts/my-posts` - Get current user's posts
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post

### Comments
- `GET /api/comments/post/:postId` - Get comments by post
- `POST /api/comments` - Create comment
- `PUT /api/comments/:id` - Update comment
- `DELETE /api/comments/:id` - Delete comment
- `PATCH /api/comments/:id/approve` - Approve comment (admin)
- `PATCH /api/comments/:id/reject` - Reject comment (admin)

### Users
- `GET /api/users` - Get all users (admin)
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user
- `PUT /api/users/:id/password` - Update password
- `DELETE /api/users/:id` - Delete user (admin)

### Analytics
- `GET /api/analytics/post/:postId` - Get post analytics
- `GET /api/analytics/all` - Get all analytics (admin)
- `GET /api/analytics/top-posts` - Get top posts
- `GET /api/analytics/dashboard-stats` - Get dashboard stats (admin)
- `POST /api/analytics/post/:postId/like` - Like a post

## Database Schema

### Tables
- **users** - User accounts and profiles
- **posts** - Blog posts
- **comments** - Post comments
- **analytics** - Post analytics (views, likes, comments count)
- **permissions** - Role-based permissions
- **user_permissions** - User-specific permissions

## Default Permissions

### Admin
- manage_users
- manage_posts
- manage_comments
- view_analytics
- delete_posts
- delete_comments

### User
- create_posts
- edit_own_posts
- delete_own_posts
- create_comments
- edit_own_comments
- delete_own_comments

## Technology Stack

### Backend
- Node.js
- Express.js
- MySQL2
- JWT (jsonwebtoken)
- bcrypt
- Joi (validation)
- CORS
- Morgan (logging)

### Frontend
- React 18
- React Router DOM 6
- Axios
- Tailwind CSS
- Context API (state management)

## Development Status

✅ Backend project structure
✅ Database schema
✅ Authentication system (JWT)
✅ Core API endpoints
✅ Frontend project structure
✅ Authentication context
✅ Basic components and pages
✅ API service layer

## Next Steps

- Implement full CRUD operations in UI
- Add rich text editor for posts
- Implement file upload for images
- Add search and filtering
- Implement pagination
- Add email notifications
- Add social sharing features
- Implement post categories and tags

## License

MIT
