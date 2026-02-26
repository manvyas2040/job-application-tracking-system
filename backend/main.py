"""
Job Application Tracking System - Main Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .Database import Base, engine
from .routers import auth, users, candidates, jobs, applications, interviews, notifications, audit

# Create FastAPI app
app = FastAPI(title="Job Application Tracking System")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://localhost:8080",
        "http://127.0.0.1:8080",
        "http://localhost:5500",
        "http://127.0.0.1:5500"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create database tables
Base.metadata.create_all(bind=engine)

# Include routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(candidates.router)
app.include_router(jobs.router)
app.include_router(applications.router)
app.include_router(interviews.router)
app.include_router(notifications.router)
app.include_router(audit.router)


@app.get("/")
def root():
    """API root endpoint"""
    return {
        "message": "Job Application Tracking System API",
        "version": "1.0.0",
        "status": "active"
    }
