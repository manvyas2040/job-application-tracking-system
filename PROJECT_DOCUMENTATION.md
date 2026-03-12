# Job Application Tracking System (JATS)

## What is this project?

A **full-stack web application** that manages the entire hiring process — from posting jobs to hiring candidates. Built with **FastAPI** (Python) backend and **vanilla HTML/CSS/JavaScript** frontend.

Think of it like a mini version of **LinkedIn Jobs + Workday** where:
- **HR** posts jobs and manages the hiring pipeline
- **Candidates** apply for jobs and track their applications
- **Interviewers** conduct interviews and submit feedback
- **Admin** manages users, roles, and monitors system activity

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Backend | **FastAPI** (Python) | REST API framework |
| Database | **PostgreSQL** | Data storage |
| ORM | **SQLAlchemy** | Database queries |
| Auth | **JWT** (python-jose) + **bcrypt** | Token-based authentication |
| Validation | **Pydantic** | Request/response schemas |
| Frontend | **HTML + CSS + JavaScript** | User interface (no framework) |
| Server | **Uvicorn** | ASGI server |
| Env | **python-dotenv** | Secret management (.env file) |

---

## Project Structure

```
job-application-tracking-system/
├── backend/
│   ├── main.py              → App entry point, CORS, router registration
│   ├── Database.py          → PostgreSQL connection & session management
│   ├── Models.py            → SQLAlchemy ORM models (7 tables)
│   ├── schemas.py           → Pydantic validation schemas
│   ├── authentication.py    → JWT token creation/decoding, bcrypt hashing
│   ├── authorize.py         → Role-based access control helpers
│   └── routers/
│       ├── dependencies.py  → Shared helpers (audit, notify, state machines)
│       ├── auth.py          → Register, Login, Refresh, Change Password
│       ├── users.py         → User management (Admin only)
│       ├── candidates.py    → Candidate profile CRUD + full profile view
│       ├── jobs.py          → Job posting CRUD + state management
│       ├── applications.py  → Apply, list, status change, bulk ops, search
│       ├── interviews.py    → Schedule, reschedule, feedback, hire
│       ├── notifications.py → Candidate notifications
│       └── audit.py         → System audit logs
├── front-end/
│   ├── app.js               → Shared JS utilities (API calls, auth, XSS protection)
│   ├── style.css            → Global styles
│   ├── index.html           → Login / Register page
│   ├── dashboard.html       → Main dashboard with stats
│   ├── jobs.html            → Browse & create jobs
│   ├── job-detail.html      → Single job view with actions
│   ├── applications.html    → Application list
│   ├── application-detail.html → Single application with interview details
│   ├── interviews.html      → Interview management
│   ├── candidate-profile.html → View candidate full profile (HR/Interviewer)
│   ├── profile.html         → Candidate's own profile
│   ├── create-profile.html  → First-time candidate profile creation
│   ├── notifications.html   → Candidate notifications
│   ├── users.html           → User management (Admin)
│   ├── audit-logs.html      → Audit logs (Admin)
│   └── change-password.html → Change password
└── requirements.txt         → Python dependencies
```

---

## Database Schema (7 Tables)

```
┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│      users       │     │    candidates     │     │      jobs        │
├──────────────────┤     ├──────────────────┤     ├──────────────────┤
│ user_id (PK)     │──┐  │ candidate_id (PK)│     │ job_id (PK)      │
│ name             │  └──│ user_id (FK)     │     │ owner_hr_id (FK) │
│ email (unique)   │     │ phone            │     │ job_title        │
│ password (hash)  │     │ skills           │     │ job_description   │
│ role             │     │ experience_years │     │ department        │
│ status           │     │ resume_path      │     │ experience_required│
│ is_active        │     │ created_at       │     │ job_status        │
│ token_version    │     └──────────────────┘     │ posted_date       │
│ created_at       │                              └──────────────────┘
└──────────────────┘
         │
         │     ┌──────────────────────┐     ┌──────────────────────┐
         │     │    applications      │     │     interviews       │
         │     ├──────────────────────┤     ├──────────────────────┤
         │     │ application_id (PK)  │──┐  │ interview_id (PK)    │
         │     │ candidate_id (FK)    │  └──│ application_id (FK)  │
         │     │ job_id (FK)          │     │ interview_date       │
         │     │ application_status   │     │ interview_type       │
         │     │ applied_date         │     │ interviewer_id (FK)  │
         │     │ last_updated         │     │ interview_status     │
         │     └──────────────────────┘     │ created_at           │
         │                                  └──────────────────────┘
         │
         │     ┌──────────────────────┐     ┌───────────────────────────┐
         │     │  interview_feedback  │     │  candidate_notifications  │
         │     ├──────────────────────┤     ├───────────────────────────┤
         │     │ feedback_id (PK)     │     │ notification_id (PK)      │
         └─────│ interviewer_id (FK)  │     │ candidate_id (FK)         │
               │ interview_id (FK)   │     │ notification_type         │
               │ rating (1-5)        │     │ message                   │
               │ comments            │     │ related_application_id    │
               │ recommendation      │     │ is_read                   │
               │ created_at          │     │ created_at                │
               └──────────────────────┘     └───────────────────────────┘

         ┌──────────────────┐
         │   audit_logs     │
         ├──────────────────┤
         │ log_id (PK)      │
         │ user_id (FK)     │
         │ action           │
         │ timestamp        │
         │ ip_address       │
         └──────────────────┘
```

---

## User Roles & Permissions

| Feature | Admin | HR | Interviewer | Candidate |
|---------|-------|----|------------|-----------|
| Register/Login | ✅ | ✅ | ✅ | ✅ |
| Change Password | ✅ | ✅ | ✅ | ✅ |
| Create/Manage Jobs | ✅ | ✅ (own jobs) | ❌ | ❌ |
| View Jobs | ✅ | ✅ | ✅ | ✅ |
| Apply for Jobs | ❌ | ❌ | ❌ | ✅ |
| View Applications | ✅ (all) | ✅ (all) | ✅ (assigned) | ✅ (own) |
| Change App Status | ✅ | ✅ (own jobs) | ❌ | ❌ |
| Schedule Interviews | ✅ | ✅ (own jobs) | ❌ | ❌ |
| Reschedule Interviews | ✅ | ✅ (own jobs) | ✅ (own) | ❌ |
| Submit Feedback | ❌ | ❌ | ✅ (assigned) | ❌ |
| Hire Candidate | ✅ | ✅ (own jobs) | ✅ (assigned) | ❌ |
| View Candidate Profile | ✅ | ✅ | ✅ (assigned) | ❌ |
| Manage Users | ✅ | ❌ | ❌ | ❌ |
| View Audit Logs | ✅ | ❌ | ❌ | ❌ |
| Notifications | ❌ | ❌ | ❌ | ✅ |

---

## State Machine Diagrams

### Job Status Flow
```
  draft ──→ open ──→ closed ──→ archived
    │                              │
    └──────→ archived              │
                                   │
            open ←── (Admin reopen)┘
```

### Application Status Flow
```
  applied ──→ shortlisted ──→ interview_scheduled ──→ hired
     │             │                  │
     └──→ rejected └──→ rejected      └──→ rejected
```

### Interview Status Flow
```
  scheduled ──→ rescheduled ──→ awaiting_feedback ──→ completed
      │              │                │
      │              └──→ cancelled   └──→ completed
      │
      └──→ awaiting_feedback ──→ completed
      │
      └──→ cancelled

  * When interview date passes, status auto-changes to "awaiting_feedback"
  * When interviewer submits feedback, status changes to "completed"
```

---

## All API Endpoints (30 Total)

### 1. Authentication (`/auth`) — 4 Endpoints

| Method | Endpoint | Access | What it does |
|--------|----------|--------|-------------|
| `POST` | `/auth/register` | Public | Register a new user. Validates role. Only one admin allowed via registration. Password is bcrypt-hashed. |
| `POST` | `/auth/login` | Public | Login with email & password (OAuth2 form). Returns JWT access token (30 min) + refresh token (7 days). Blocks inactive/deactivated users. |
| `POST` | `/auth/refresh` | Public | Exchange a valid refresh token for new access + refresh tokens. Checks token_version to invalidate old tokens. |
| `POST` | `/auth/change-password` | All roles | Change password. Verifies old password first. Increments token_version (forces re-login on all devices). Creates audit log. |

**Key Security Features:**
- Passwords hashed with **bcrypt** (72-byte limit enforced)
- JWT tokens contain `token_version` — when password/role changes, all existing tokens become invalid
- SECRET_KEY loaded from `.env` file (never hardcoded)
- Deactivated users cannot login

---

### 2. User Management (`/users`) — 5 Endpoints

| Method | Endpoint | Access | What it does |
|--------|----------|--------|-------------|
| `GET` | `/users` | Admin | List all users with pagination. Filter by role (`?role=hr`) and status (`?status=active`). Returns `{total, items}`. |
| `PATCH` | `/users/{user_id}` | Admin / Self | Update user details (status). Admin can update any user. |
| `POST` | `/users/{user_id}/role` | Admin | Change a user's role (e.g., candidate → hr). Increments token_version to force re-login. |
| `DELETE` | `/users/{user_id}` | Admin | Deactivate a user (soft delete). Sets `is_active=false`, `status=inactive`. User can no longer login. |
| `POST` | `/users/{user_id}/restore` | Admin | Restore a deactivated user. Sets `is_active=true`, `status=active`. |

---

### 3. Candidate Profile (`/candidate`) — 4 Endpoints

| Method | Endpoint | Access | What it does |
|--------|----------|--------|-------------|
| `GET` | `/candidate/profile` | Candidate | Get own profile. Returns 404 if profile not created yet. |
| `POST` | `/candidate/profile` | Candidate | Create profile (phone, skills, experience, resume). One-time only — duplicate blocked. |
| `PATCH` | `/candidate/profile` | Candidate | Update profile fields (partial updates supported). |
| `GET` | `/candidates/{id}/full-profile` | HR / Admin / Interviewer | Get candidate's complete profile including user info, all applications, and all interviews. Interviewers can only view candidates assigned to them. |

---

### 4. Jobs (`/jobs`) — 5 Endpoints

| Method | Endpoint | Access | What it does |
|--------|----------|--------|-------------|
| `GET` | `/jobs` | Public | List all jobs with pagination. Filter by status (`?status=open`). Returns `{total, items}`. |
| `POST` | `/jobs` | HR / Admin | Create a new job posting. Auto-sets `job_status=draft` and `owner_hr_id`. |
| `GET` | `/jobs/{job_id}` | Public | Get single job details. |
| `PATCH` | `/jobs/{job_id}/state` | HR (owner) / Admin | Change job status following the state machine (draft→open→closed→archived). |
| `PATCH` | `/jobs/{job_id}/reopen` | Admin only | Admin override — reopen any archived/closed job back to "open". |
| `GET` | `/jobs/{job_id}/analytics` | HR / Admin | Get job stats: number of applications and interviews. |

---

### 5. Applications (`/applications`) — 5 Endpoints

| Method | Endpoint | Access | What it does |
|--------|----------|--------|-------------|
| `POST` | `/applications` | Candidate | Apply for a job. Checks: job must be open, candidate must have profile, no duplicate applications. Sends notification. |
| `GET` | `/applications` | All roles | List applications with pagination. **Role-based filtering**: Admin/HR see all, Interviewer sees only assigned, Candidate sees only own. Returns `{total, page, page_size, items}`. |
| `PATCH` | `/applications/{id}/state` | HR (owner) / Admin | Change application status following the state machine. Validates transition. Sends notification to candidate. |
| `POST` | `/applications/bulk-shortlist` | HR / Admin | Bulk-move multiple applications to "shortlisted" status at once. |
| `POST` | `/applications/bulk-reject` | HR / Admin | Bulk-reject multiple applications at once. |
| `GET` | `/applications/search` | HR / Admin | Search applications. Filter by `status` and `job_id`. Paginated. |

---

### 6. Interviews (`/interviews`) — 8 Endpoints

| Method | Endpoint | Access | What it does |
|--------|----------|--------|-------------|
| `GET` | `/interviews/my` | Interviewer | Get all interviews assigned to the current interviewer. Returns rich data: interview + application + candidate details + job info + feedback status. Auto-completes overdue interviews. |
| `GET` | `/interviews/candidate` | Candidate | Get all interviews for the current candidate's applications. Shows interview date, type, status, job info. Auto-completes overdue interviews. |
| `GET` | `/interviews/application/{id}` | All roles | Get interviews for a specific application. Candidates can only view their own. Returns interviewer name. |
| `POST` | `/interviews` | HR / Admin | Schedule a new interview. **Validations**: future date only, interviewer must have `interviewer` role, checks calendar conflicts (±1 hour) for both interviewer AND candidate, interviewer cannot be the candidate. |
| `PATCH` | `/interviews/{id}` | HR / Admin | Update interview details (date, type, status). Validates state transitions. |
| `DELETE` | `/interviews/{id}` | HR / Admin | Cancel/delete an interview. Deletes associated feedback. Reverts application status to "shortlisted". Notifies candidate. |
| `POST` | `/interviews/{id}/reschedule` | HR / Admin / Interviewer | Reschedule an interview. Checks calendar conflicts. Interviewers can only reschedule their own. Notifies candidate with new date. |
| `POST` | `/interviews/feedback` | Interviewer | Submit feedback after interview. **Write-once** (cannot edit). Can only submit after interview date passes. Includes rating (1-5), comments, recommendation (strong_hire/hire/maybe/no_hire). |
| `POST` | `/interviews/{id}/hire` | HR / Admin / Interviewer | Mark candidate as hired. Changes interview status to "completed" and application status to "hired". Sends congratulation notification. |

**Smart Feature — Auto-Complete Overdue Interviews:**
When any interview endpoint is called, the system checks all interviews where `interview_date < now` and status is still "scheduled"/"rescheduled", and automatically moves them to "awaiting_feedback". This prevents stale statuses.

---

### 7. Notifications (`/notifications`) — 2 Endpoints

| Method | Endpoint | Access | What it does |
|--------|----------|--------|-------------|
| `GET` | `/notifications` | Candidate | Get all notifications for the current candidate. |
| `PATCH` | `/notifications/{id}/read` | Candidate | Mark a notification as read. Verifies ownership. |

**Auto-generated notifications for:**
- Application submitted
- Application status changed (shortlisted, rejected, etc.)
- Interview scheduled
- Interview rescheduled (with new date)
- Interview cancelled
- Hired

---

### 8. Audit Logs (`/audit-logs`) — 1 Endpoint

| Method | Endpoint | Access | What it does |
|--------|----------|--------|-------------|
| `GET` | `/audit-logs` | Admin only | Get all audit logs ordered by timestamp (newest first). |

**Actions automatically logged:**
- User registration
- Password changes
- Role changes
- User deactivation/restoration
- Job creation, status changes
- Application creation, status changes
- Interview scheduling, rescheduling, cancellation
- Feedback submission

---

## Security Features
                             
| Feature | Implementation |
|---------|---------------|
| **Password Hashing** | bcrypt with 72-byte limit |
| **Authentication** | JWT tokens (access: 30 min, refresh: 7 days) |
| **Token Invalidation** | `token_version` — increments on password/role change, invalidating all existing tokens |
| **Role-Based Access** | `require_roles()` decorator checks user role on every protected endpoint |
| **Ownership Checks** | `enforce_owner_or_admin()` — HR can only manage their own jobs/applications |
| **XSS Protection** | `escapeHtml()` function used on all user-generated content in frontend |
| **Secret Management** | SECRET_KEY and DATABASE_URL stored in `.env` file |
| **CORS** | Whitelisted origins only |
| **Input Validation** | Pydantic schemas validate all request payloads |
| **Duplicate Prevention** | Duplicate email registration and duplicate job applications blocked |
| **Deactivated User Block** | Login is blocked for inactive users |
           
---

## How to Run

```bash
# 1. Clone and navigate
cd job-application-tracking-system

# 2. Create virtual environment
python -m venv venv

# 3. Activate virtual environment
# Windows:
venv\Scripts\Activate.ps1
# Linux/Mac:
source venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Create .env file with:
# DATABASE_URL=postgresql://user:password@localhost:5432/jats_db
# SECRET_KEY=your-secret-key-here

# 6. Run the server
uvicorn backend.main:app --reload

# 7. Open frontend
# Open front-end/index.html in browser (via Live Server on port 5500)
```

**API Docs:** Visit `http://localhost:8000/docs` for interactive Swagger documentation.

---

## Interview Questions You Can Answer

### Q: "What does this project do?"
**A:** It's a Job Application Tracking System that automates the entire hiring pipeline. HR posts jobs, candidates apply, interviewers give feedback, and admins monitor everything. It has role-based access, state machines for status management, and real-time notifications.

### Q: "Why FastAPI?"
**A:** FastAPI is async-capable, auto-generates Swagger docs, has built-in Pydantic validation, and is one of the fastest Python frameworks. It also natively supports OAuth2 for authentication.

### Q: "How does authentication work?"
**A:** JWT-based. On login, the server creates an access token (30 min) and refresh token (7 days). Tokens contain user_id, role, and a token_version. When a user changes their password or an admin changes their role, token_version increments, invalidating all existing tokens — forcing re-login on all devices.

### Q: "What are state machines in your project?"
**A:** I use state machines to control valid status transitions. For example, a job can only go draft→open→closed→archived. An application goes applied→shortlisted→interview_scheduled→hired. Invalid transitions are rejected with a 400 error. This prevents data corruption.

### Q: "How do you handle authorization?"
**A:** Three layers: (1) `require_roles()` checks if the user has the right role, (2) `enforce_owner_or_admin()` checks if HR owns the job they're modifying, (3) Interviewers can only see/modify candidates assigned to them. Admin bypasses ownership checks.

### Q: "How do you prevent XSS?"
**A:** All user-generated content is passed through an `escapeHtml()` function before rendering in the DOM. This converts `<`, `>`, `"`, `'`, `&` to their HTML entities.

### Q: "What happens when an interview date passes?"
**A:** The system auto-detects overdue interviews. When any interview data is fetched, a helper function checks for interviews where the date has passed but status is still "scheduled". It auto-updates them to "awaiting_feedback" and shows candidates an "Awaiting Result" badge so they know their interview happened but results are pending.

### Q: "How do you handle conflicts in interview scheduling?"
**A:** When scheduling, I check a ±1 hour window around the requested time for both the interviewer AND the candidate. If either has an existing scheduled/rescheduled interview in that window, the request is rejected with "calendar conflict".

### Q: "What is the audit log?"
**A:** Every important action (user creation, password change, role change, status update, interview scheduling) is logged to an audit_logs table with the user_id, action description, and timestamp. Only admins can view these logs.
