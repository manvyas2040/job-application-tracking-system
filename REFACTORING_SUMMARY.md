# Backend Refactoring - Router Structure

## Overview
The backend has been successfully refactored to improve readability and maintainability by organizing code into separate router modules based on functionality.

## New Directory Structure

```
backend/
├── __init__.py
├── authentication.py
├── authorize.py
├── Database.py
├── main.py (refactored - now only app setup and router includes)
├── Models.py
├── schemas.py
├── routers/
│   ├── __init__.py
│   ├── dependencies.py    # Shared utilities and constants
│   ├── auth.py            # Authentication endpoints
│   ├── users.py           # User management endpoints
│   ├── candidates.py      # Candidate profile endpoints
│   ├── jobs.py            # Job management endpoints
│   ├── applications.py    # Application management endpoints
│   ├── interviews.py      # Interview and feedback endpoints
│   ├── notifications.py   # Notification endpoints
│   └── audit.py           # Audit log endpoints
```

## Router Breakdown

### 1. **auth.py** - Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get tokens
- `POST /auth/refresh` - Refresh access token
- `POST /auth/change-password` - Change user password

### 2. **users.py** - User Management
- `GET /users` - List all users (admin only)
- `PATCH /users/{user_id}` - Update user details
- `POST /users/{user_id}/role` - Change user role (admin only)
- `DELETE /users/{user_id}` - Deactivate user (admin only)
- `POST /users/{user_id}/restore` - Restore deactivated user (admin only)

### 3. **candidates.py** - Candidate Profiles
- `GET /candidate/profile` - Get current candidate's profile
- `POST /candidate/profile` - Create candidate profile
- `PATCH /candidate/profile` - Update candidate profile
- `GET /candidates/{candidate_id}/full-profile` - Get full candidate details (HR/Admin)
- `GET /candidates/search` - Search candidates by skill and experience

### 4. **jobs.py** - Job Management
- `GET /jobs` - List all jobs with filters
- `POST /jobs` - Create new job posting (HR/Admin)
- `GET /jobs/{job_id}` - Get job details
- `PATCH /jobs/{job_id}/state` - Update job status (HR/Admin)
- `PATCH /jobs/{job_id}/reopen` - Reopen archived job (Admin only)
- `GET /jobs/{job_id}/analytics` - Get job analytics (HR/Admin)

### 5. **applications.py** - Application Management
- `POST /applications` - Apply for a job (Candidate)
- `GET /applications` - List applications (filtered by role)
- `PATCH /applications/{application_id}/state` - Update application status (HR/Admin)
- `POST /applications/bulk-shortlist` - Bulk shortlist applications (HR/Admin)
- `POST /applications/bulk-reject` - Bulk reject applications (HR/Admin)
- `GET /applications/search` - Search applications with filters (HR/Admin)

### 6. **interviews.py** - Interview Management
- `GET /interviews/my` - Get assigned interviews (Interviewer)
- `POST /interviews` - Schedule new interview (HR/Admin)
- `PATCH /interviews/{interview_id}` - Update interview details
- `DELETE /interviews/{interview_id}` - Cancel interview (HR/Admin)
- `POST /interviews/{interview_id}/reschedule` - Reschedule interview
- `POST /feedback` - Submit interview feedback (Interviewer)

### 7. **notifications.py** - Notifications
- `GET /notifications` - Get all notifications (Candidate)
- `PATCH /notifications/{notification_id}/read` - Mark notification as read

### 8. **audit.py** - Audit Logs
- `GET /audit-logs` - Get all audit logs (Admin only)

## Shared Dependencies (dependencies.py)

Contains reusable utilities and constants:
- **Constants**: `JOB_TRANSITIONS`, `APP_TRANSITIONS`, `INTERVIEW_TRANSITIONS`, `ALLOWED_ROLES`
- **Helper Functions**:
  - `_normalize_role()` - Validate and normalize role strings
  - `_get_user()` - Get user by ID or raise 404
  - `_current_db_user()` - Get current user from DB and verify token
  - `_audit()` - Log audit entries
  - `_notify()` - Create candidate notifications

## Updated main.py

The main.py file is now much cleaner and focused on:
- FastAPI app initialization
- CORS middleware configuration
- Database table creation
- Router registration
- Root endpoint

## Benefits of This Refactoring

### ✅ **Improved Readability**
- Each router file focuses on a single domain
- Code is easier to navigate and understand
- Clear separation of concerns

### ✅ **Better Maintainability**
- Changes to one domain don't affect others
- Easier to locate and fix bugs
- Simpler to add new endpoints

### ✅ **Enhanced Scalability**
- Easy to add new routers
- Team members can work on different routers simultaneously
- Reduced merge conflicts

### ✅ **Code Reusability**
- Shared utilities in dependencies.py
- Constants defined in one place
- DRY (Don't Repeat Yourself) principle followed

### ✅ **Backward Compatibility**
- All existing API endpoints remain the same
- Frontend integration is not affected
- No breaking changes

## Testing

The backend has been tested and is running successfully:
- Server starts without errors
- All routes are properly registered
- Frontend integration remains intact

## Running the Application

From the project root directory:
```bash
uvicorn backend.main:app --reload --port 8000
```

All endpoints are accessible at `http://localhost:8000`

API documentation available at:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
