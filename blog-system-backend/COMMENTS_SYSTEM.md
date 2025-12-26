# Comments System

A complete comments system with REST API endpoints, frontend UI, and admin moderation capabilities.

## Features

### Backend API Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/api/comments/post/:postId` | Get approved comments for a post | Public |
| GET | `/api/comments/:id` | Get single comment | Public/Auth |
| POST | `/api/comments` | Create a new comment | Auth |
| PUT | `/api/comments/:id` | Update own comment | Auth |
| DELETE | `/api/comments/:id` | Delete own comment | Auth |
| POST | `/api/comments/:id/flag` | Flag a comment as spam | Auth |
| GET | `/api/comments` | Get all comments (admin) | Admin |
| PATCH | `/api/comments/:id/approve` | Approve a comment | Admin |
| PATCH | `/api/comments/:id/reject` | Reject a comment | Admin |
| POST | `/api/comments/bulk-moderate` | Bulk moderate comments | Admin |
| GET | `/api/comments/stats` | Get comment statistics | Admin |

### Comment Status Workflow

1. **Pending** - Default status when comment is created
2. **Approved** - Visible to public, counts towards analytics
3. **Rejected** - Not visible, can include rejection reason

### Validation Rules

- Minimum 5 characters
- Maximum 2000 characters
- HTML/script tags are stripped
- Rate limiting: 5 comments per user per hour
- Duplicate detection within 10 minutes

### Spam Detection

The system includes basic spam detection:
- Keyword filtering
- URL detection (max 2 URLs per comment)
- Capitalization checks
- Repetitive character detection

## Installation

### Database Migration

Run the migration script to update your existing database:

```bash
mysql -u root -p < blog-system-backend/migrations/20240101_comments_system.sql
```

Or manually execute the ALTER TABLE statements in your database client.

## API Usage Examples

### Create Comment
```bash
curl -X POST http://localhost:5000/api/comments \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"post_id": 1, "content": "Great article! Very informative."}'
```

### Get Post Comments
```bash
curl http://localhost:5000/api/comments/post/1?page=1&limit=10&sort=newest
```

### Approve Comment (Admin)
```bash
curl -X PATCH http://localhost:5000/api/comments/1/approve \
  -H "Authorization: Bearer <admin_token>"
```

### Reject Comment with Reason (Admin)
```bash
curl -X PATCH http://localhost:5000/api/comments/1/reject \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"reason": "Spam content"}'
```

### Bulk Moderate (Admin)
```bash
curl -X POST http://localhost:5000/api/comments/bulk-moderate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <admin_token>" \
  -d '{"action": "approve", "commentIds": [1, 2, 3]}'
```

## Frontend Components

### User Components

- `CommentForm` - Add comment form with validation
- `CommentList` - Display list of comments with pagination
- `CommentCard` - Individual comment display with actions
- `PendingCommentNotice` - Show pending comment status

### Admin Components

- `Comments.jsx` - Full moderation interface
- `CommentModerationCard` - Detailed comment view for moderation
- `CommentStats` - Statistics dashboard widget
- `RejectCommentModal` - Modal for rejecting comments

## Database Schema

### Comments Table Updates

```sql
ALTER TABLE comments
ADD COLUMN rejection_reason TEXT NULL,
ADD COLUMN flag_count INT DEFAULT 0,
ADD COLUMN flag_reason TEXT NULL,
ADD INDEX idx_comments_created_at (created_at);
```

## Security Features

- JWT authentication for protected routes
- Role-based access control (admin vs user)
- Rate limiting to prevent spam
- Input sanitization to prevent XSS
- Duplicate comment prevention
- Comment ownership validation

## Rate Limiting

- 5 comments per user per hour
- Tracked in-memory (use Redis in production)
- Returns 429 status with retry-after header when exceeded

## Response Codes

- `200` - Success
- `201` - Created
- `400` - Bad Request (validation error)
- `401` - Unauthorized
- `403` - Forbidden (not owner/admin)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error
