# 01 — Product Summary

> Source: NeedWork_Blueprint.docx + NeedWork.txt (original requirements)

---

## Overview

**NeedWork** is a social-style recruitment platform where job seekers and recruiters can discover each other, interact publicly, and hold each other accountable through a transparent two-way rating and reporting system. The core differentiator is **fairness**: no paid promotion, no pay-to-rank — every post competes equally.

---

## Target Audience

| Persona | Description |
|---|---|
| Candidate | Gen Z or mid-career professionals actively seeking work |
| Recruiter | HR managers, founders, hiring managers posting open roles |
| Admin | Internal moderator managing content, reports, and platform health |

---

## Goals

1. Fair job discovery — no money buys visibility
2. Two-way accountability — candidates and recruiters can rate/report each other
3. Reduce recruitment fraud — public history, warning system, trust indicators
4. Social-first UX — feels like a social feed, not a job board

---

## Feature Inventory

### FT-01: Homepage Feed
- Thread-style infinite scroll with lazy loading
- Two tabs: **Tuyển dụng** (Recruiting) and **Tìm việc** (Job Seeking)
- Location-aware filtering (candidate enables GPS → sees posts within chosen radius)
- Default sort: newest first

### FT-02: User Profile
- Customizable: name, title (e.g. "Frontend Dev"), avatar (image upload), CV (PDF upload)
- Avatar frame indicator: blue ring = trusted recruiter
- Displays user's posts

### FT-03: Post — Recruiting (`job_offer`)
Required fields:
- Contact email
- Company location (map picker)
- Salary range (min–max, VND)
- Job type: Full-time / Part-time
- Full JD (job description)

Behavior:
- Goes to `pending` state → moderation (AI + Admin) → `approved` → visible on feed
- Recruiter **cannot** delete or hide the post (temporary constraint, MVP)
- Recruiter must respond to every applicant comment (Approved / Rejected) within **7 days**; failure = warning
- If recruiter responds dishonestly → candidate can report → admin reviews

### FT-04: Post — Job Seeking (`job_seeking`)
- Candidate posts about themselves: skills, experience, desired role
- No moderation required
- Visible immediately on feed

### FT-05: CV Application Flow
- Candidate clicks Apply on a `job_offer` post
- System auto-creates a comment: *"Dạ em đã apply. Mong anh/chị hãy xem CV của em, em cám ơn nhiều ạ 🤗"*
- Badge **"Đã nộp CV"** shown next to candidate's name in comment thread
- Creates an `Application` record

### FT-06: Recruiter Trust Ring (Avatar Frame)
| State | Frame | Trigger |
|---|---|---|
| New recruiter | Blue ring | Default on registration as recruiter |
| Reported + admin confirmed | No ring | Automatic |
| Receives 5+ positive reviews | Blue ring restored | Automatic |

### FT-07: Report System
- Candidate reports a `job_offer` post for dishonesty
- Admin reviews report → confirms (recruiter loses ring) or dismisses
- Separate flow from regular comment moderation

### FT-08: Recruiter Warning System
- Cron job runs daily
- Any recruiter with comments unresponded > 7 days → `warning_count++` + email notification
- Recruiter who responds falsely → candidate can report separately

### FT-09: Admin Panel
- Dashboard: daily login count, post stats, report stats
- Post management: approve / reject pending posts
- Report management: confirm / dismiss pending reports
- User management: view warnings, block users

### FT-10: Location-Based Matching
- Recruiter sets company lat/lng when creating post
- Candidate enables GPS → selects radius (km)
- Feed filters posts within radius using Haversine formula on PostgreSQL

---

## MVP Scope (Month 1)

| Feature | MVP | Later |
|---|---|---|
| Homepage feed + tabs | ✅ | |
| Auth (Email + Google) | ✅ | |
| Candidate profile | ✅ | |
| Recruiter profile + frame | ✅ | |
| Recruiting post + moderation | ✅ | |
| Job-seeking post | ✅ | |
| CV upload | ✅ | |
| Apply flow + auto-comment | ✅ | |
| Location filter | ✅ | |
| Report system | ✅ | |
| Trust ring logic | ✅ | |
| 7-day warning cron | ✅ | |
| Admin panel | ✅ | |
| Payment / promoted posts | | ❌ |
| Real-time notifications | | ❌ |
| Direct messaging | | ❌ |
| Mobile app | | ❌ |

---

## Acceptance Criteria Summary

- A new recruiter always starts with a blue trust ring
- A recruiter post cannot go live without passing moderation
- Applying to a job always creates the "Dạ em đã apply. Mong anh/chị hãy xem CV của em, em cám ơn nhiều ạ 🤗" comment with badge
- Recruiter cannot delete/hide posts in MVP
- 7-day unresponded comments trigger a warning (automated, daily)
- A confirmed report removes the recruiter's trust ring
- 5 positive reviews restore the ring
- Location filter only activates when candidate grants GPS permission
- Admin can see all pending posts/reports and act on them
