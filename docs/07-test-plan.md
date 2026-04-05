# 07 — Test Plan

---

## Strategy

| Layer | Tool | Coverage target |
|---|---|---|
| Unit tests | Vitest | Business logic, utilities |
| Component tests | React Testing Library + Vitest | UI components |
| Integration tests | Vitest + Supabase test DB | API routes, DB queries |
| E2E tests | Playwright | Critical user journeys |

---

## Critical Paths to Test

### Auth
- [ ] Register with email → can login
- [ ] Login with Google redirects correctly
- [ ] Unauthenticated user redirected from protected routes
- [ ] Non-admin redirected from /admin

### Feed
- [ ] Feed loads with job_offer tab by default
- [ ] Switching to job_seeking tab shows different posts
- [ ] Lazy loading fetches next page on scroll
- [ ] Location filter returns only posts within radius

### Post Creation
- [ ] Recruiter can create job_offer post (all required fields)
- [ ] job_offer post goes to pending status
- [ ] Candidate cannot create job_offer post (403)
- [ ] Candidate can create job_seeking post (no moderation)
- [ ] Missing required fields return validation errors

### Apply Flow
- [ ] Candidate can apply to job_offer
- [ ] Auto-comment "Dạ em đã apply. Mong anh/chị hãy xem CV của em, em cám ơn nhiều ạ 🤗" created
- [ ] "Đã nộp CV" badge shown on candidate's comments
- [ ] Applying twice returns 409
- [ ] Recruiter cannot apply to own post

### Recruiter Response
- [ ] Recruiter can respond Approved/Rejected to application comment
- [ ] Responding twice returns 409
- [ ] Non-owner recruiter cannot respond (403)

### Trust Ring
- [ ] New recruiter has frame_color = 'blue'
- [ ] Confirmed report sets frame_color = null
- [ ] 5 positive reviews restore frame_color = 'blue'
- [ ] frame_count increments per review
- [ ] frame_count resets after ring restored

### Report Flow
- [ ] Candidate can report a job_offer post
- [ ] Admin can confirm report → recruiter loses ring
- [ ] Admin can dismiss report → recruiter ring unchanged

### Cron Warning
- [ ] Comment unresponded for >7 days → warning_count increments
- [ ] Already-responded comments are not counted
- [ ] Cron endpoint blocked without CRON_SECRET

### Admin
- [ ] Stats endpoint returns correct counts
- [ ] Admin can approve pending post → post visible on feed
- [ ] Admin can reject post → post not visible on feed
- [ ] Non-admin gets 403 on all /api/admin/* endpoints

---

## Edge Cases

- User with no profile data (null name/avatar) → graceful fallback
- Post with no location → excluded from location-filtered feed
- Upload file > size limit → 413 error with message
- Upload non-PDF for CV → 400 error
- Admin blocks themselves → 400 error
- Recruiter tries to delete post → 405 Method Not Allowed
