# 05 — API Specification

---

## Base URL
`/api`

## Auth
All protected endpoints require a valid Supabase session cookie (set automatically by SSR).
Admin endpoints additionally require `users.role = 'admin'`.

---

## Posts

### `GET /api/posts`
List posts (feed).

Query params:
| Param | Type | Required | Description |
|---|---|---|---|
| type | `job_offer` \| `job_seeking` | Yes | Feed tab |
| cursor | string | No | Cursor for pagination (post id) |
| limit | number | No | Default 20 |
| lat | number | No | Candidate latitude |
| lng | number | No | Candidate longitude |
| radius | number | No | Radius in km |

Response:
```json
{
  "posts": [...],
  "next_cursor": "uuid-or-null"
}
```

---

### `POST /api/posts`
Create a new post.

Auth: Required (Candidate for job_seeking, Recruiter for job_offer)

Body:
```json
{
  "type": "job_offer",
  "title": "Senior Frontend Developer",
  "content": "Full JD here...",
  "email": "hr@company.com",
  "location_name": "Hà Nội, Vietnam",
  "lat": 21.0278,
  "lng": 105.8342,
  "salary_min": 20000000,
  "salary_max": 40000000,
  "job_type": "full_time"
}
```

Response: `201 Created` with post object

---

### `GET /api/posts/:id`
Get post detail.

Response: post + author + comment count

---

### `POST /api/posts/:id/apply`
Apply to a job post.

Auth: Required (Candidate only)

Response:
```json
{
  "application_id": "uuid",
  "comment_id": "uuid",
  "message": "Dạ em đã apply. Mong anh/chị hãy xem CV của em, em cám ơn nhiều ạ 🤗"
}
```

Errors:
- `409` if already applied
- `403` if post type is not job_offer or user is not candidate

---

### `GET /api/posts/:id/comments`
Get comments for a post.

Query: `cursor`, `limit`

Response:
```json
{
  "comments": [
    {
      "id": "uuid",
      "content": "Dạ em đã apply. Mong anh/chị hãy xem CV của em, em cám ơn nhiều ạ 🤗",
      "type": "applied",
      "status": null,
      "author": {
        "id": "uuid",
        "name": "Nguyen Van A",
        "avatar_url": "...",
        "has_applied": true
      },
      "created_at": "..."
    }
  ],
  "next_cursor": null
}
```

---

## Comments

### `PATCH /api/comments/:id`
Recruiter responds to an application comment.

Auth: Required (Recruiter who owns the post)

Body:
```json
{ "status": "approved" }
```
or
```json
{ "status": "rejected" }
```

Response: `200` with updated comment

Errors:
- `403` if user is not the post author
- `409` if already responded

---

## Reports

### `POST /api/reports`
Report a job post.

Auth: Required (Candidate only)

Body:
```json
{
  "post_id": "uuid",
  "reason": "Thông tin lương không khớp với thực tế"
}
```

Response: `201 Created`

---

## Reviews

### `POST /api/reviews`
Candidate rates a recruiter.

Auth: Required (Candidate who applied to recruiter's post)

Body:
```json
{
  "target_id": "recruiter-uuid",
  "post_id": "uuid",
  "rating": 5,
  "comment": "Nhà tuyển dụng rất chuyên nghiệp"
}
```

Response: `201 Created`

Side effect: if `target.frame_count >= 5` after this review → set `frame_color = 'blue'`, reset `frame_count = 0`

Errors:
- `403` if reviewer has not applied to a post by this recruiter
- `409` if already reviewed for this post

---

## Profile

### `GET /api/profile/:id`
Get any user's public profile.

Response: user (no sensitive fields) + their posts

---

### `PATCH /api/profile`
Update own profile.

Auth: Required

Body (all optional):
```json
{
  "name": "Nguyen Van A",
  "title": "Frontend Developer",
  "avatar_url": "...",
  "cv_url": "..."
}
```

---

### `POST /api/profile/avatar`
Upload avatar image.

Auth: Required
Content-Type: `multipart/form-data`
Field: `file` (PNG/JPG, max 2MB)

Response: `{ "url": "public-cdn-url" }`

---

### `POST /api/profile/cv`
Upload CV PDF.

Auth: Required
Content-Type: `multipart/form-data`
Field: `file` (PDF, max 5MB)

Response: `{ "url": "public-cdn-url" }`

---

## Admin

### `GET /api/admin/stats`
Dashboard metrics.

Auth: Admin only

Response:
```json
{
  "total_users": 1000,
  "new_users_today": 12,
  "pending_posts": 5,
  "pending_reports": 3,
  "total_posts": 234
}
```

---

### `GET /api/admin/posts`
List posts by status.

Query: `status=pending|approved|rejected`, `cursor`, `limit`

---

### `PATCH /api/admin/posts/:id`
Approve or reject a post.

Auth: Admin only

Body:
```json
{ "status": "approved" }
```

---

### `GET /api/admin/reports`
List reports by status.

Query: `status=pending|confirmed|dismissed`

---

### `PATCH /api/admin/reports/:id`
Confirm or dismiss a report.

Auth: Admin only

Body:
```json
{ "status": "confirmed" }
```

Side effect: if confirmed → set `recruiter.frame_color = null`

---

### `GET /api/admin/users`
List users with search.

Query: `search`, `role`, `cursor`

---

### `PATCH /api/admin/users/:id`
Block/unblock a user or reset warnings.

Auth: Admin only

Body:
```json
{ "blocked": true }
```

---

## Cron

### `GET /api/cron/warning-check`
Triggered daily by Vercel Cron.

Auth: `Authorization: Bearer CRON_SECRET` header

Logic:
1. Find all `comments` where `type='applied'`, `status IS NULL`, `created_at < NOW() - INTERVAL '7 days'`
2. Group by `post.author_id` (recruiter)
3. Increment `users.warning_count`
4. Send email notification

Response: `{ "processed": 12 }`
