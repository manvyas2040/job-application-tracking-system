from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from .Database import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, index=True)
    name = Column(String(50), nullable=False)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)
    status = Column(String, default="active")
    is_active = Column(Boolean, default=True)
    token_version = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate_profile = relationship("Candidate", back_populates="user", uselist=False)
    interviews = relationship("Interview", back_populates="interviewer")
    feedbacks = relationship("InterviewFeedback", back_populates="interviewer")
    audit_logs = relationship("AuditLog", back_populates="user")


class Candidate(Base):
    __tablename__ = "candidates"

    candidate_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False, unique=True)
    phone = Column(String, nullable=True)
    skills = Column(Text, nullable=True)
    experience_year = Column(Integer, nullable=True)
    resume_path = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="candidate_profile")
    applications = relationship("Application", back_populates="candidate")
    notifications = relationship("CandidateNotification", back_populates="candidate_profile")


class Company(Base):
    __tablename__ = "companies"

    company_id = Column(Integer, primary_key=True, index=True)
    company_name = Column(String, nullable=False)
    industry = Column(String, nullable=True)
    location = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    jobs = relationship("Job", back_populates="company")


class Job(Base):
    __tablename__ = "jobs"

    job_id = Column(Integer, primary_key=True, index=True)
    company_id = Column(Integer, ForeignKey("companies.company_id"), nullable=False)
    owner_hr_id = Column(Integer, ForeignKey("users.user_id"), nullable=True)
    job_titel = Column(String, nullable=False)
    job_description = Column(Text, nullable=False)
    department = Column(String, nullable=True)
    experienc_required = Column(Integer, nullable=True)
    job_status = Column(String, default="draft")
    posted_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    company = relationship("Company", back_populates="jobs")
    applications = relationship("Application", back_populates="job")


class Application(Base):
    __tablename__ = "applications"

    application_id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id"), nullable=False)
    job_id = Column(Integer, ForeignKey("jobs.job_id"), nullable=False)
    application_status = Column(String, default="applied")
    applied_date = Column(DateTime, default=datetime.utcnow)
    last_updated = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    candidate = relationship("Candidate", back_populates="applications")
    job = relationship("Job", back_populates="applications")
    interviews = relationship("Interview", back_populates="application")
    notifications = relationship("CandidateNotification", back_populates="application")


class Interview(Base):
    __tablename__ = "interviews"

    interview_id = Column(Integer, primary_key=True, index=True)
    application_id = Column(Integer, ForeignKey("applications.application_id"), nullable=False)
    interview_date = Column(DateTime, nullable=False)
    interview_type = Column(String, nullable=False)
    interviewer_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    interview_status = Column(String, default="scheduled")
    created_at = Column(DateTime, default=datetime.utcnow)

    application = relationship("Application", back_populates="interviews")
    interviewer = relationship("User", back_populates="interviews")
    feedback = relationship("InterviewFeedback", back_populates="interview", uselist=False)


class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"

    feedback_id = Column(Integer, primary_key=True, index=True)
    interview_id = Column(Integer, ForeignKey("interviews.interview_id"), nullable=False, unique=True)
    interviewer_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    rating = Column(Float, nullable=True)
    comments = Column(Text, nullable=True)
    recommendation = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    interview = relationship("Interview", back_populates="feedback")
    interviewer = relationship("User", back_populates="feedbacks")


class CandidateNotification(Base):
    __tablename__ = "candidate_notifications"

    notification_id = Column(Integer, primary_key=True, index=True)
    candidate_id = Column(Integer, ForeignKey("candidates.candidate_id"), nullable=False)
    notification_type = Column(String, default="info")
    message = Column(Text, nullable=False)
    related_application_id = Column(Integer, ForeignKey("applications.application_id"), nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    candidate_profile = relationship("Candidate", back_populates="notifications")
    application = relationship("Application", back_populates="notifications")


class AuditLog(Base):
    __tablename__ = "audit_logs"

    log_id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.user_id"), nullable=False)
    action = Column(Text, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    ip_address = Column(String, nullable=True)

    user = relationship("User", back_populates="audit_logs")


# Backward-compatibility aliases
Auditlog = AuditLog
Interviewfeedback = InterviewFeedback
