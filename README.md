# 🎯 JATS - Job Application Tracking System

A **modern, full-featured web application** for managing job applications, interviews, and hiring workflows. Built with React 19, FastAPI, and PostgreSQL.

[![Status](https://img.shields.io/badge/status-active-brightgreen)](https://github.com)
[![License](https://img.shields.io/badge/license-MIT-blue)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.9+-blue)](https://python.org)
[![React](https://img.shields.io/badge/react-19.0-61dafb)](https://react.dev)

---

## 📸 Project Highlights

### **What is JATS?**

JATS is a comprehensive **Job Application Tracking System** designed to streamline the recruitment process. It connects candidates applying for jobs with HR managers, interviewers, and administrators managing the hiring pipeline.

**Perfect for:**
- 🏢 Companies managing recruitment
- 👥 HR departments organizing job applications
- 📅 Interview scheduling and feedback
- 📊 Tracking candidate progress
- 🔐 Role-based access control

---

## ✨ Key Features

### 🎯 **For Candidates**
- 📋 **Apply for Jobs**: View and apply to open positions
- 📱 **Profile Management**: Create and maintain candidate profile with resume
- 📧 **Notifications**: Real-time updates on application status
- 📅 **Interview Calendar**: View scheduled interviews
- 📍 **Application Tracking**: Track status through hiring pipeline

### 💼 **For HR Managers**
- 📝 **Job Posting**: Create and manage job openings
- 👥 **Application Review**: Review candidate profiles and resumes
- ✅ **Shortlisting**: Shortlist qualified candidates
- 📆 **Interview Scheduling**: Schedule interviews with interviewers
- 📊 **Hiring Dashboard**: Monitor recruitment metrics

### 👔 **For Interviewers**
- 📋 **Interview List**: View assigned interviews
- 📅 **Calendar View**: See interview schedule
- 💬 **Feedback System**: Submit interview feedback and ratings
- ⭐ **Recommendations**: Provide hire/no-hire recommendations

### 🛡️ **For Administrators**
- 👨‍💼 **User Management**: Create and manage system users
- 🔐 **Role Control**: Manage user roles and permissions
- 📊 **Audit Logs**: Track all system activities
- 🔧 **System Settings**: Configure system parameters

---

## 🛠️ Technology Stack

### **Frontend**
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite (⚡ Lightning fast)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Routing**: React Router v7
- **Icons**: Lucide React
- **Date Handling**: date-fns

### **Backend**
- **Framework**: FastAPI (Python 3.9+)
- **ORM**: SQLAlchemy
- **Database**: SQLite / PostgreSQL
- **Authentication**: JWT + Refresh Tokens
- **Validation**: Pydantic

### **DevOps**
- **Package Manager**: npm + pip
- **Environment**: Virtual Environment
- **Web Server**: Uvicorn

---

## 📋 System Requirements

### **Minimum Requirements**
- Python 3.9+
- Node.js 16+
- npm 8+
- 500MB disk space

### **Recommended Requirements**
- Python 3.11+
- Node.js 18+
- npm 9+
- 1GB disk space
- 4GB RAM

---

## 🚀 Quick Start

### **Clone the Repository**
```bash
git clone https://github.com/manvyas2040/job-application-tracking-system.git
cd job-application-tracking-system
```

### **Backend Setup**

#### 1. Create Virtual Environment
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
```

#### 2. Install Dependencies
```bash
pip install -r requirements.txt
```

#### 3. Initialize Database
```bash
# Run migrations (if using Alembic)
alembic upgrade head

# Or create tables directly
python backend/Database.py
```

#### 4. Start Backend Server
```bash
python -m uvicorn backend.main:app --reload
```

**Backend runs on**: `http://localhost:8000`

📚 **API Docs**: `http://localhost:8000/docs`

---

### **Frontend Setup**

#### 1. Navigate to Frontend Directory
```bash
cd front-end
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Start Development Server
```bash
npm run dev
```

**Frontend runs on**: `http://localhost:3000`

---

## 🔐 Test Credentials

Use these accounts to test the application:

### **Admin Account**
```
Email: admin@company.com
Password: Admin@123
Role: Administrator
```

### **HR Accounts**
```
Email: hr1@company.com
Password: Hr@12345
Role: HR Manager

Email: hr2@company.com
Password: Hr@12345
Role: HR Manager
```

### **Interviewer Accounts**
```
Email: interviewer1@company.com
Password: Inter@123
Role: Interviewer

Email: interviewer2@company.com
Password: Inter@123
Role: Interviewer
```

### **Candidate Accounts**
```
Email: rohan@gmail.com
Password: Cand@1234
Role: Candidate

Email: sneha@gmail.com
Password: Cand@1234
Role: Candidate

Email: vikram@gmail.com
Password: Cand@1234
Role: Candidate

Email: pooja@gmail.com
Password: Cand@1234
Role: Candidate

Email: arjun@gmail.com
Password: Cand@1234
Role: Candidate
```

---

## 📁 Project Structure

```
job-application-tracking-system/
├── backend/
│   ├── routers/
│   │   ├── auth.py              # Authentication endpoints
│   │   ├── jobs.py              # Job management
│   │   ├── applications.py       # Application tracking
│   │   ├── interviews.py         # Interview scheduling
│   │   ├── users.py             # User management
│   │   ├── candidates.py         # Candidate profiles
│   │   ├── notifications.py      # Notifications
│   │   ├── audit.py             # Audit logging
│   │   └── pdfs.py              # PDF handling
│   ├── Models.py                 # Database models
│   ├── schemas.py                # Pydantic schemas
│   ├── Database.py               # Database config
│   ├── authentication.py          # Auth utilities
│   ├── authorize.py              # Authorization
│   └── main.py                   # FastAPI app
│
├── front-end/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.tsx         # Login & Register
│   │   │   ├── Dashboard.tsx     # Home dashboard
│   │   │   ├── Jobs.tsx          # Job listings
│   │   │   ├── Applications.tsx  # Applications list
│   │   │   ├── Interviews.tsx    # Interview management
│   │   │   ├── Calendar.tsx      # Calendar view
│   │   │   ├── Users.tsx         # User management
│   │   │   ├── AuditLogs.tsx     # Audit logs
│   │   │   ├── Profile.tsx       # User profile
│   │   │   ├── Notifications.tsx # Notifications
│   │   │   └── ... (more pages)
│   │   ├── components/
│   │   │   └── Navbar.tsx        # Navigation
│   │   ├── api.ts                # API client
│   │   ├── App.tsx               # Main app
│   │   └── index.css             # Styles
│   ├── vite.config.ts
│   ├── tsconfig.json
│   └── package.json
│
├── alembic/                       # Database migrations
├── requirements.txt               # Python dependencies
├── README.md                      # This file
└── see_data.txt                  # Test data
```

---

## 📚 API Documentation

### **Authentication**
```bash
POST /auth/register          # Register as candidate
POST /auth/login             # Login
POST /auth/refresh           # Refresh token
POST /auth/change-password   # Change password
```

### **Jobs**
```bash
GET    /jobs                 # List all jobs
POST   /jobs                 # Create job (HR/Admin)
GET    /jobs/{job_id}        # Get job details
PATCH  /jobs/{job_id}        # Update job (HR/Admin)
DELETE /jobs/{job_id}        # Delete job (HR/Admin)
```

### **Applications**
```bash
GET    /applications         # List applications
POST   /applications         # Create application
GET    /applications/{id}    # Get application details
PATCH  /applications/{id}    # Update application
DELETE /applications/{id}    # Cancel application
```

### **Interviews**
```bash
GET    /interviews           # Calendar view
POST   /interviews           # Schedule interview (HR/Admin)
GET    /interviews/my        # My interviews (Interviewer)
PATCH  /interviews/{id}      # Update interview
POST   /interviews/{id}/reschedule  # Reschedule
POST   /interviews/feedback  # Submit feedback
```

### **Users**
```bash
GET    /users                # List users (Admin)
POST   /users/create         # Create user (Admin)
PATCH  /users/{id}           # Update user
POST   /users/{id}/role      # Change role (Admin)
DELETE /users/{id}           # Deactivate user (Admin)
```

**Full API Documentation**: Visit `http://localhost:8000/docs`

---

## 🔑 Key Workflows

### **Job Application Workflow**
1. **Candidate** applies for a job
2. **HR** receives notification
3. **HR** reviews and shortlists candidate
4. **HR** schedules interview with **Interviewer**
5. **Interviewer** conducts interview
6. **Interviewer** submits feedback
7. **HR** makes hiring decision

### **User Registration Flow**
- **Candidates**: Self-register on login page
- **HR/Interviewer/Admin**: Created by admin through User Management

### **Interview Scheduling**
- **Conflict Detection**: System prevents double booking
- **Availability Check**: Ensures interviewers and candidates are available
- **Auto Status Update**: Past interviews auto-marked as awaiting feedback
- **Notifications**: Automatic notifications to all parties

---

## 🔒 Security Features

✅ **JWT Authentication** with access and refresh tokens
✅ **Role-Based Access Control** (RBAC) - 4 user roles
✅ **Password Hashing** with bcrypt
✅ **CORS Protection** - all configured origins
✅ **Audit Logging** - track all system actions
✅ **Input Validation** - Pydantic schemas
✅ **SQL Injection Prevention** - SQLAlchemy ORM
✅ **Token Expiration** - automatic session management

---

## 📊 Database Models

### **Users**
- user_id (Primary Key)
- name, email, password
- role (admin, hr, interviewer, candidate)
- status, is_active
- created_at, updated_at

### **Jobs**
- job_id (Primary Key)
- job_title, description
- department, experience_required
- owner_hr_id (FK to Users)
- job_status (open, closed)
- posted_date, created_at

### **Applications**
- application_id (Primary Key)
- candidate_id (FK to Candidates)
- job_id (FK to Jobs)
- application_status (applied, shortlisted, interview_scheduled, etc.)
- applied_date, created_at

### **Interviews**
- interview_id (Primary Key)
- application_id (FK to Applications)
- interview_date, interview_type
- interviewer_id (FK to Users)
- interview_status
- created_at, updated_at

### **Candidates**
- candidate_id (Primary Key)
- user_id (FK to Users)
- phone, skills, experience_years
- resume_path, created_at

### **InterviewFeedback**
- feedback_id (Primary Key)
- interview_id (FK to Interviews)
- rating (1-5), comments
- recommendation (hire, no-hire)
- created_at

---

## 🚀 Built-In Features

### **Dashboard**
- 📊 Real-time statistics (jobs, applications, interviews)
- 📈 Recent activity
- 🎯 Quick actions

### **Calendar System**
- 📅 Month and Week views
- 🎯 Interactive event details
- 🔍 Filter by interviewer
- ⏰ Hourly timeline

### **Notifications**
- 🔔 Real-time updates
- 📧 Application status changes
- 🗓️ Interview reminders
- ✉️ Feedback submissions

### **Audit Logs**
- 📋 Track all system actions
- 👤 User attribution
- ⏱️ Timestamps
- 🔍 Searchable

### **User Management**
- 👥 Create and manage users
- 🔐 Role assignment
- 🚫 User deactivation
- 🔄 User restoration

---

## 📦 Building for Production

### **Frontend Build**
```bash
cd front-end
npm run build
npm run preview
```

**Output**: `front-end/dist/`

### **Backend Deployment**
```bash
# Run with production server (Gunicorn)
gunicorn -w 4 -k uvicorn.workers.UvicornWorker backend.main:app
```

---

## 🧪 Testing

### **Frontend Type Check**
```bash
cd front-end
npm run lint
```

### **Python Syntax Check**
```bash
python -m py_compile backend/*.py
```

---

## 📝 Environment Variables

### **Backend** (`.env`)
```env
DATABASE_URL=sqlite:///./test.db
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
```

### **Frontend** (`.env.local`)
```env
VITE_API_URL=http://localhost:8000
```

---

## 🐛 Troubleshooting

### **Backend Won't Start**
```bash
# Clear pycache
find . -type d -name __pycache__ -exec rm -r {} +

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall
```

### **Frontend Won't Start**
```bash
# Clear node_modules
rm -rf node_modules
npm install

# Clear cache
npm cache clean --force
```

### **Database Issues**
```bash
# Reset database
rm test.db

# Recreate tables
python backend/Database.py
```

---

## 🤝 Contributing

We welcome contributions! Here's how:

1. **Fork** the repository
2. **Create** a feature branch (`git checkout -b feature/amazing-feature`)
3. **Commit** changes (`git commit -m 'Add amazing feature'`)
4. **Push** to branch (`git push origin feature/amazing-feature`)
5. **Open** a Pull Request

### **Code Style**
- Python: PEP 8
- JavaScript/TypeScript: ESLint config
- Use meaningful variable names
- Add comments for complex logic

---

## 📄 License

This project is licensed under the **MIT License** - see [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Manvyas** - [GitHub](https://github.com/manvyas2040)

---

## 📞 Support & Contact

- 📧 **Email**: manvyas2040@gmail.com
- 🐛 **Report Issues**: [GitHub Issues](https://github.com/manvyas2040/job-application-tracking-system/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/manvyas2040/job-application-tracking-system/discussions)

---

## 🎓 Learning Resources

This project demonstrates:
- ✅ Full-stack web development
- ✅ React 19 with TypeScript
- ✅ FastAPI for RESTful APIs
- ✅ SQLAlchemy ORM
- ✅ JWT authentication
- ✅ Role-based access control
- ✅ Database design
- ✅ Component-based architecture
- ✅ Modern UI/UX with Tailwind CSS
- ✅ Calendar and scheduling systems

---

## 🙏 Acknowledgments

- **React 19** - JavaScript library for building UIs
- **FastAPI** - Modern Python web framework
- **Tailwind CSS** - Utility-first CSS framework
- **SQLAlchemy** - Python SQL toolkit and ORM
- **Framer Motion** - Animation library for React

---

## 📊 Project Statistics

| Metric | Value |
|--------|-------|
| Frontend Pages | 14+ |
| API Routes | 30+ |
| Database Models | 8+ |
| User Roles | 4 |
| Languages Used | Python, TypeScript, CSS |
| Lines of Code | 5000+ |
| Total Features | 50+ |

---

## 🎯 Roadmap

### **v1.0** (Current) ✅
- ✅ Core recruitment features
- ✅ User authentication
- ✅ Interview scheduling
- ✅ Calendar system
- ✅ Audit logging

### **v2.0** (Planned) 🔄
- 📧 Email notifications
- 📹 Video interview integration
- 📊 Advanced analytics
- 📱 Mobile app
- 🔔 SMS notifications

---

## 💡 Tips for Development

### **Hot Reload**
Both frontend and backend support hot reload:
- Backend: Use `--reload` flag with uvicorn
- Frontend: Vite automatically refreshes

### **Debug Mode**
- Backend: FastAPI docs at `/docs`
- Frontend: React DevTools browser extension

### **Database Exploration**
- SQLite: Use DB Browser or command line
- PostgreSQL: Use pgAdmin or DBeaver

---

## 🚀 Deployment Guides

### **Heroku**
```bash
heroku create your-app-name
git push heroku main
```

### **AWS EC2**
1. Launch EC2 instance (Ubuntu 22.04)
2. Install Python and Node.js
3. Clone repository
4. Run setup scripts
5. Configure domain and SSL

### **Docker**
```dockerfile
# Backend Dockerfile
FROM python:3.11
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0"]
```

---

## 📞 Get in Touch

Have questions or suggestions? Feel free to open an issue or contact the author!

**Happy recruiting! 🎯**

---

**Last Updated**: March 23, 2026
**Version**: 1.0.0
**Status**: ✅ Production Ready
