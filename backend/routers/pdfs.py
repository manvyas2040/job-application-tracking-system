"""
PDF Management Routes
Handles PDF upload, download, and management for resumes and documents
"""
from fastapi import APIRouter, UploadFile, File, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
import json
from datetime import datetime

from ..Database import get_db
from ..authentication import get_current_user
from ..Models import Candidate, Application , User
from ..schemas import PDFUploadResponse, PDFDocumentInfo, PDFDocumentListResponse
from ..file_utils import (
    save_resume_pdf,
    save_interview_document,
    get_resume_file_path,
    get_interview_file_path,
    delete_resume_file,
    delete_interview_file,
    get_file_size_mb,
)

router = APIRouter(prefix="/files", tags=["files"])


@router.post("/upload/resume", response_model=PDFUploadResponse)
async def upload_resume(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Upload a resume PDF for the current user (must be a candidate)
    
    - Only candidates can upload their own resume
    - File must be PDF, max 10MB
    """
    # Get candidate profile
    candidate = db.query(Candidate).filter(
        Candidate.user_id == current_user["user_id"]
    ).first()
    
    if not candidate:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only candidates can upload resumes"
        )
    
    # Read file content
    content = await file.read()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty"
        )
    
    # Validate and save
    try:
        filename, size_mb = save_resume_pdf(
            content,
           current_user["user_id"],
            file.filename or "resume.pdf"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    # Update candidate record
    candidate.resume_path = filename
    db.commit()
    
    return PDFUploadResponse(
        filename=filename,
        url=f"/files/resume/{filename}",
        size_mb=size_mb,
        uploaded_at=datetime.utcnow()
    )


@router.get("/resume/{filename}", response_class=FileResponse)
async def get_resume(
    filename: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Download a resume PDF
    
    - Candidates can download their own resume
    - HR/Interviewers can download resumes of candidates in applications they access
    - Admin can download all resumes
    """
    file_path = get_resume_file_path(filename)
    
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resume not found"
        )
    
    # Extract user_id from filename (format: resume_userid_timestamp.pdf)
    try:
        parts = filename.split('_')
        if len(parts) >= 2:
            candidate_user_id = int(parts[1])
        else:
            raise ValueError("Invalid filename format")
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename format"
        )
    
    # Authorization check
    is_own_resume = candidate_user_id == current_user["user_id"]
    
    if not is_own_resume and current_user["role"] not in ["admin", "hr", "interviewer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to download this resume"
        )
    
    # For HR/Interviewers, verify they have access to the candidate's application
    if not is_own_resume and current_user["role"] in ["hr", "interviewer"] and current_user["role"] != "admin":
        candidate = db.query(Candidate).filter(
            Candidate.user_id == candidate_user_id
        ).first()
        
        if not candidate:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Candidate not found"
            )
        
        # Check if user has access to any applications from this candidate
        has_access = db.query(Application).filter(
            Application.candidate_id == candidate.candidate_id
        ).first() is not None
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to download this resume"
            )
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/pdf"
    )

@router.post("/upload/document/{application_id}", response_model=PDFUploadResponse)
async def upload_interview_document(
    application_id: int,
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check permissions
    if current_user["role"] not in ["admin", "hr", "interviewer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only HR and Interviewers can upload documents"
        )
    
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    content = await file.read()
    
    if not content:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty"
        )
    
    try:
        filename, size_mb = save_interview_document(
            content,
            application_id,
            file.filename or "document.pdf"
        )
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    
    if application.supporting_documents:
        docs = json.loads(application.supporting_documents)
    else:
        docs = []
    
    docs.append({
        "filename": filename,
        "uploaded_at": datetime.utcnow().isoformat(),
        "uploaded_by": current_user["user_id"]
    })
    
    application.supporting_documents = json.dumps(docs)
    db.commit()
    
    return PDFUploadResponse(
        filename=filename,
        url=f"/files/interview/{filename}",
        size_mb=size_mb,
        uploaded_at=datetime.utcnow()
    )


@router.get("/interview/{filename}", response_class=FileResponse)
async def get_interview_document(
    filename: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] not in ["admin", "hr", "interviewer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to download this document"
        )
    
    file_path = get_interview_file_path(filename)
    
    if not file_path:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Document not found"
        )
    
    return FileResponse(
        path=file_path,
        filename=filename,
        media_type="application/pdf"
    )


@router.get("/application/{application_id}/documents", response_model=PDFDocumentListResponse)
async def get_application_documents(
    application_id: int,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    application = db.query(Application).filter(
        Application.application_id == application_id
    ).first()
    
    if not application:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    
    is_own_application = application.candidate.user_id == current_user["user_id"]
    
    if not is_own_application and current_user["role"] not in ["admin", "hr", "interviewer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to view these documents"
        )
    
    documents = []
    if application.supporting_documents:
        try:
            docs_data = json.loads(application.supporting_documents)
            for doc in docs_data:
                size_mb = get_file_size_mb(doc.get("filename", ""), "interview")
                documents.append(PDFDocumentInfo(
                    filename=doc.get("filename", ""),
                    url=f"/files/interview/{doc.get('filename', '')}",
                    size_mb=size_mb or 0.0,
                    uploaded_at=datetime.fromisoformat(
                        doc.get("uploaded_at", datetime.utcnow().isoformat())
                    ),
                    document_type="supporting"
                ))
        except (json.JSONDecodeError, ValueError):
            documents = []
    
    return PDFDocumentListResponse(
        documents=documents,
        total_count=len(documents)
    )


@router.delete("/resume/{filename}")
async def delete_resume(
    filename: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    try:
        parts = filename.split('_')
        if len(parts) >= 2:
            candidate_user_id = int(parts[1])
        else:
            raise ValueError("Invalid filename format")
    except (ValueError, IndexError):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename format"
        )
    
    if candidate_user_id != current_user["user_id"] and current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this file"
        )
    
    if delete_resume_file(filename):
        candidate = db.query(Candidate).filter(
            Candidate.user_id == candidate_user_id
        ).first()
        
        if candidate and candidate.resume_path == filename:
            candidate.resume_path = None
            db.commit()
        
        return {"message": "Resume deleted successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or could not be deleted"
        )


@router.delete("/interview/{filename}")
async def delete_interview_document(
    filename: str,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    if current_user["role"] not in ["admin", "hr", "interviewer"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete documents"
        )
    
    if delete_interview_file(filename):
        return {"message": "Document deleted successfully"}
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found or could not be deleted"
        )