# Job Application Tracking System - Frontend

## 🎯 Overview

Complete HTML/CSS/JavaScript frontend for the JATS backend with full role-based functionality. No build tools or npm required!

## 📋 Complete Features

### 🔐 Authentication
- **Login & Register** with role selection
- **JWT Token Management** with auto-refresh
- **Password Protection** with secure storage

### 👤 User Roles & Capabilities

#### **Candidate**
- ✅ **MANDATORY Profile Creation** - Cannot apply without completing profile
- ✅ Browse all jobs
- ✅ View job details
- ✅ Apply for open jobs (profile required)
- ✅ Track applications
- ✅ View notifications (application status, interviews)
- ✅ View/Edit profile (phone, skills, experience, resume)

#### **HR Manager**
- ✅ Create jobs (draft → open → closed → archived)
- ✅ View all applications for their jobs
- ✅ Schedule interviews for shortlisted candidates
- ✅ View full candidate profiles
- ✅ Change application status

#### **Interviewer**
- ✅ View assigned interviews
- ✅ Submit feedback (write-once, rating, comments, recommendation)
- ✅ View candidate details

#### **Admin**
- ✅ Full system access
- ✅ User management (view, change role, deactivate, restore)
- ✅ **Admin Override**: Reopen archived jobs
- ✅ View audit logs (security tracking)
- ✅ View all jobs, applications, interviews


## 📁 Complete File Structure

```
front-end/
├── index.html                  # Login/Register
├── dashboard.html              # Main dashboard (all roles)
├── jobs.html                   # Job listings
├── job-detail.html            # Job details & apply
├── applications.html          # Applications list
├── create-profile.html        # Candidate profile creation (MANDATORY)
├── profile.html               # View/Edit candidate profile
├── notifications.html         # Candidate notifications
├── interviews.html            # Interview management (HR/Interviewer)
├── candidate-profile.html     # Full candidate view (HR/Admin)
├── users.html                 # User management (Admin)
├── audit-logs.html           # Security logs (Admin)
├── style.css                  # All styling
├── app.js                     # API logic & profile checking
└── README.md                  # This file
```

## 🔒 Security Features

1. **Profile Enforcement** - Candidates MUST complete profile before applying
2. **Role-based Navigation** - UI shows only allowed features per role
3. **Token Refresh** - Automatic JWT refresh on 401
4. **Backend Validation** - UI checks are backed by API role enforcement
5. **Audit Logging** - All critical actions tracked (Admin view)

## 🎨 Key Improvements

### Workflow Completeness
- ✅ Real hiring pipeline: Apply → Shortlist → Interview → Hire/Reject
- ✅ Status transitions with business rules
- ✅ Notifications for candidates
- ✅ Interview conflict prevention
- ✅ Admin override for archived jobs

### Production-Like Behavior
- ✅ No fake/bypassed flows
- ✅ Profile completeness enforcement
- ✅ Read-only candidate aggregation (HR/Admin)
- ✅ Write-once interview feedback
- ✅ Proper error handling

## 🚀 How to Run

### Method 1: Using Python HTTP Server (Recommended)

1. Open terminal in the `front-end` folder
2. Run:
   ```bash
   python -m http.server 8080
   ```
3. Open browser and go to: **http://localhost:8080**

### Method 2: Using VS Code Live Server Extension

1. Install the "Live Server" extension in VS Code
2. Right-click on `index.html`
3. Select "Open with Live Server"
4. Browser opens automatically at **http://127.0.0.1:5500**

### Method 3: Direct File Open (May have CORS issues)

1. Simply double-click `index.html`
2. If you get CORS errors, use Method 1 or 2

## ⚙️ Backend Setup

Make sure your backend is running first:

```bash
cd backend
python -m uvicorn main:app --reload --port 8000
```

Backend should be at: **http://localhost:8000**

## 📁 File Structure

```
front-end/
├── index.html           # Login/Register page
├── dashboard.html       # Main dashboard
├── jobs.html           # Jobs listing
├── job-detail.html     # Job details & apply
├── applications.html   # Applications list
├── style.css           # All styles
├── app.js              # API calls & logic
└── README.md           # This file
```

## 🔐 User Roles

- **Candidate**: Can browse jobs and apply
- **HR**: Can create jobs and manage applications
- **Admin**: Full access to all features
- **Interviewer**: Can manage interviews

## 🎨 Design Features

- Gradient backgrounds
- Responsive design (mobile-friendly)
- Modern card layouts
- Color-coded status badges
- Loading spinners
- Modal dialogs
- Smooth animations

## 🔧 Configuration

If your backend is on a different port, edit `app.js`:

```javascript
const API_URL = 'http://localhost:8000';  // Change this
```

## 📱 Browser Support

Works on all modern browsers:
- Chrome (recommended)
- Firefox
- Edge
- Safari

## 🐛 Troubleshooting

**Problem**: Login not working
- Check if backend is running at port 8000
- Check browser console for errors
- Make sure CORS is properly configured

**Problem**: Can't see jobs
- Make sure you're logged in
- Check if there are any jobs in the database
- HR/Admin can create jobs

**Problem**: CORS errors
- Use Python HTTP server (Method 1)
- Make sure backend CORS allows your frontend URL

## 🚀 Quick Start Guide

1. Start backend:
   ```bash
   cd backend
   python -m uvicorn main:app --reload --port 8000
   ```

2. Start frontend:
   ```bash
   cd front-end
   python -m http.server 8080
   ```

3. Open browser: **http://localhost:8080**

4. Register a new account (choose your role)

5. Login and explore!

## 📞 Support

If you encounter any issues, check:
1. Backend is running (http://localhost:8000/docs)
2. Frontend is served properly (not file://)
3. Browser console for error messages
4. Network tab for failed API calls

Happy job tracking! 🎉
