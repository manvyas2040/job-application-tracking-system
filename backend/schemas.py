from pydantic import BaseModel,EmailStr,Field
from datetime import datetime
from typing import Optional,List

class UserBase(BaseModel):
    name: str
    email: EmailStr
    role: str  
    status: str = "active"

    
class UserCreate(UserBase):
    password: str


class UserResponse(UserBase):
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    role: Optional[str] = None
    status: Optional[str] = None


class CandidateBase(BaseModel):
    phone: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = None
    resume_path: Optional[str] = None


class CandidateCreate(CandidateBase):
    user_id: int


class CandidateResponse(CandidateBase):
    candidate_id: int
    user_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateUpdate(BaseModel):
    phone: Optional[str] = None
    skills: Optional[str] = None
    experience_years: Optional[int] = None
    resume_path: Optional[str] = None


class CompanyBase(BaseModel):
    company_name: str
    industry: Optional[str] = None
    location: Optional[str] = None


class CompanyCreate(CompanyBase):
    pass


class CompanyResponse(CompanyBase):
    company_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CompanyUpdate(BaseModel):
    company_name: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None


class JobBase(BaseModel):
    job_title: str
    job_description: str
    company_id: int
    department: Optional[str] = None
    experience_required: Optional[int] = None
    job_status: str = "open"


class JobCreate(JobBase):
    pass


class JobResponse(JobBase):
    job_id: int
    posted_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True


class JobUpdate(BaseModel):
    job_title: Optional[str] = None
    job_description: Optional[str] = None
    department: Optional[str] = None
    experience_required: Optional[int] = None
    job_status: Optional[str] = None


class ApplicationBase(BaseModel):
    candidate_id: int
    job_id: int
    application_status: str = "applied"


class ApplicationCreate(ApplicationBase):
    pass


class ApplicationResponse(ApplicationBase):
    application_id: int
    applied_date: datetime
    last_updated: datetime

    class Config:
        from_attributes = True


class ApplicationUpdate(BaseModel):
    application_status: str


class ApplicationDetailResponse(ApplicationResponse):
    candidate: Optional["CandidateResponse"] = None
    job: Optional["JobResponse"] = None


class InterviewBase(BaseModel):
    application_id: int
    interview_date: datetime
    interview_type: str
    interviewer_id: int
    interview_status: str = "scheduled"


class InterviewCreate(InterviewBase):
    pass


class InterviewResponse(InterviewBase):
    interview_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewUpdate(BaseModel):
    interview_date: Optional[datetime] = None
    interview_type: Optional[str] = None
    interviewer_id: Optional[int] = None
    interview_status: Optional[str] = None


class InterviewFeedbackBase(BaseModel):
    interview_id: int
    interviewer_id: int
    rating: Optional[float] =Field(gt=0,lt=6,default=None)  
    comments: Optional[str] = None
    recommendation: Optional[str] = None  


class InterviewFeedbackCreate(InterviewFeedbackBase):
    pass


class InterviewFeedbackResponse(InterviewFeedbackBase):
    feedback_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class InterviewFeedbackUpdate(BaseModel):
    rating: Optional[float] = None
    comments: Optional[str] = None
    recommendation: Optional[str] = None


class CandidateNotificationBase(BaseModel):
    candidate_id: int
    message: str
    related_application_id: Optional[int] = None
    is_read: bool = False


class CandidateNotificationCreate(BaseModel):
    message: str
    related_application_id: Optional[int] = None


class CandidateNotificationResponse(CandidateNotificationBase):
    notification_id: int
    created_at: datetime

    class Config:
        from_attributes = True


class CandidateNotificationUpdate(BaseModel):
    is_read: bool



class AuditLogBase(BaseModel):
    user_id: int
    action: str
    ip_address: Optional[str] = None


class AuditLogCreate(BaseModel):
    action: str
    ip_address: Optional[str] = None


class AuditLogResponse(AuditLogBase):
    log_id: int
    timestamp: datetime

    class Config:
        from_attributes = True



class InterviewDetailResponse(InterviewResponse):
    application: Optional["ApplicationResponse"] = None
    interviewer: Optional["UserResponse"] = None
    feedback: Optional[InterviewFeedbackResponse] = None


class ApplicationWithInterviewsResponse(ApplicationDetailResponse):
    interviews: List[InterviewDetailResponse] = []
