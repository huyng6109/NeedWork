# 06 — Open Questions & Assumptions

---

## Assumptions (logged, proceeding with best-reasoned choices)

| ID | Assumption | Rationale |
|---|---|---|
| A-01 | Users register as either Candidate or Recruiter (not both simultaneously) | Blueprint treats them as distinct roles with different capabilities |
| A-02 | "Positive review" means rating ≥ 4/5 stars | Reasonable UX default; not specified in blueprint |
| A-03 | A candidate can only apply once per job post | Prevents duplicate applications; standard practice |
| A-04 | "Phản hồi sai sự thật" (false response) is handled via the same report flow | Blueprint doesn't define a separate channel |
| A-05 | Job-seeking posts do not require moderation | Blueprint only mentions moderation for job_offer posts |
| A-06 | Salary range is in VND (Vietnamese Dong) | Target market is Vietnam |
| A-07 | Location picker uses OpenStreetMap + Leaflet (free, no API key) | Blueprint specifies free-tier stack |
| A-08 | AI moderation = OpenAI Moderation API as first pass; Admin confirms final approval | Blueprint mentions "AI hoặc người kiểm duyệt" |
| A-09 | Admin role is assigned manually in DB (not self-registerable) | Security requirement |
| A-10 | Radius options: 5km, 10km, 20km, 50km, 100km | Reasonable UX presets; exact values not specified |
| A-11 | Supabase Auth handles session management; no custom JWT logic needed | Simplifies implementation |
| A-12 | CV files are PDF only, max 5MB; avatars PNG/JPG max 2MB | Standard file upload constraints |
| A-13 | The 7-day warning cron runs at 08:00 Vietnam time (UTC+7) | Reasonable business hours default |
| A-14 | Recruiters can edit post content before it's approved; cannot edit after approval | Moderation integrity |
| A-15 | "Không thể xoá hay ẩn bài viết" applies only to approved posts | Pre-approved posts can be withdrawn |

---

## Open Questions (non-blocking — proceeding with assumptions above)

| ID | Question | Current Assumption |
|---|---|---|
| Q-01 | Can a user be both a Candidate and Recruiter? | No — single role per account (A-01) |
| Q-02 | What happens when warning_count exceeds a threshold? | Log only in MVP; suspension in later phase |
| Q-03 | Can candidates rate recruiters without having applied to their post? | No — only applied candidates can review a recruiter |
| Q-04 | Is there a pagination limit on feed posts? | 20 posts per page (cursor-based) |
| Q-05 | What email provider for warning notifications? | Supabase built-in email (free tier) |
| Q-06 | Does the trust ring restoration reset frame_count to 0? | Yes, resets after restoration |
| Q-07 | Can admin search/filter users by name or email? | Yes — basic search included in admin UI |

---

## Blueprint vs Figma Conflicts

*To be filled after Figma analysis in doc 02.*

| ID | Conflict | Resolution |
|---|---|---|
| C-XX | TBD | TBD |
