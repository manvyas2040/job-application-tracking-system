# PDF Storage & Viewing Functionality - Implementation Plan

## Overview
This document outlines how to implement PDF storage and viewing functionality in the Job Application Tracking System. This will allow candidates to upload resumes (PDFs) and HR/Interviewers to view them.

---

## 1. What PDFs Will We Store?

- **Candidate Resumes**: PDF files uploaded by candidates when creating their profile
- **Interview Documents**: Supporting documents uploaded during the interview process
- **Feedback Reports**: Generated feedback documents from interviews

---

## 2. Storage Architecture

We'll use **Local Filesystem Storage** (simple and secure for this project):

```
job-application-tracking-system/
├── backend/
│   ├── pdfs/                    ← NEW: PDF storage folder
│   │   ├── resumes/             ← Candidate resumes
│   │   │   ├── candidate_1_resume.pdf
│   │   │   ├── candidate_2_resume.pdf
│   │   │   └── ...
│   │   └── interviews/          ← Interview documents
│   │       ├── interview_1_feedback.pdf
│   │       └── ...
│   ├── main.py
│   ├── Models.py
│   └── ... (existing files)
```

---

## 3. Database Changes

### Update `Candidate` Model in Models.py:

**Current Structure:**
```python
class Candidate(Base):
    resume_path = Column(String, nullable=True)  # Already exists
```

**What we'll do:**
- Keep `resume_path` as is
- Add validation to store the filename only (not full path)

### Update `Application` Model in Models.py:

Add optional PDF field:
```python
class Application(Base):
    # ... existing fields ...
    supporting_documents = Column(String, nullable=True)  # JSON array of PDF filenames
```

---

## 4. Backend API Endpoints

### New Endpoints to Create:

#### **1. Upload Resume PDF**
```
POST /candidates/upload-resume
Content-Type: multipart/form-data
Body: file (PDF)
Response: { "filename": "candidate_1_resume.pdf", "url": "/files/resume/candidate_1_resume.pdf" }
```

#### **2. View/Download Resume PDF**
```
GET /files/resume/{filename}
Response: PDF file (application/pdf)
```

#### **3. Upload Interview Document**
```
POST /applications/{application_id}/upload-document
Content-Type: multipart/form-data
Body: file (PDF)
Response: { "filename": "...", "url": "..." }
```

#### **4. View/Download Interview Document**
```
GET /files/interview/{filename}
Response: PDF file (application/pdf)
```

#### **5. List PDFs for Application**
```
GET /applications/{application_id}/documents
Response: [ { "filename": "...", "uploaded_at": "...", "uploaded_by": "..." } ]
```

---

## 5. Backend Implementation Steps

### Step 1: Create PDF Router
**File:** `backend/routers/pdfs.py`
- File upload handler (validates PDF, saves to folder)
- File download handler (serves PDF with security checks)
- Error handling for missing/unauthorized files

### Step 2: Update Models
**File:** `backend/Models.py`
- Update `Candidate` model to ensure `resume_path` stores filename only
- Update `Application` model to add `supporting_documents` field

### Step 3: Update Schemas
**File:** `backend/schemas.py`
- Add `UpdateResume` schema
- Add `DocumentUploadResponse` schema
- Add `PdfInfo` schema for listing files

### Step 4: Register Router
**File:** `backend/main.py`
- Import and register the new `pdfs` router
- Mount static file server for PDF directory (optional)

### Step 5: Add File Utilities
**File:** `backend/file_utils.py` (NEW)
- `validate_pdf()` - Check file is valid PDF
- `save_pdf()` - Save PDF to appropriate folder
- `get_file_path()` - Get secure file path (prevent directory traversal)
- `delete_pdf()` - Delete PDF file safely

---

## 6. Frontend Implementation Steps

### Step 1: Update Candidate Profile Page
**File:** `front-end/profile.html`
- Add file input for resume upload
- Show uploaded resume with download/view button
- Display upload status (success/error)

### Step 2: Update Application Detail Page
**File:** `front-end/application-detail.html`
- Add file input to upload supporting documents
- Show list of uploaded documents with download/view buttons
- HR/Interviewer can view and download candidate resumes

### Step 3: Update Application List Page
**File:** `front-end/applications.html`
- Add "Resume" column with view/download links for each candidate

### Step 4: Add JavaScript Functions
**File:** `front-end/app.js`
- `uploadPDF(file, endpoint)` - Upload file to server
- `viewPDF(url)` - Open PDF in new tab/modal
- `downloadPDF(url, filename)` - Download PDF to user's computer
- `handleFileUpload(event)` - Validate and upload file

### Step 5: Add Styling
**File:** `front-end/style.css`
- Style file upload input
- Style document list/table
- Style view/download buttons
- Add spinner/loader for upload

---

## 7. Security Considerations

✅ **Permissions:**
- Only candidates can upload their own resumes
- Only HR/Interviewers can view resumes in applications
- Admin can view all PDFs

✅ **File Validation:**
- Accept only PDF files (check MIME type and extension)
- Limit file size (e.g., 5MB max)
- Rename files to prevent conflicts (e.g., `candidate_1_resume.pdf`)

✅ **Path Traversal Prevention:**
- Never use user-provided filename directly
- Always validate and sanitize paths
- Store only filename in database, construct full path securely

✅ **Access Control:**
- Check user authentication and role before serving files
- Verify user has permission to access specific PDF

---

## 8. File Upload Flow (Detailed)

### Candidate Uploads Resume:
```
1. Candidate clicks "Upload Resume" button
2. Selects PDF file from computer
3. Frontend validates: size < 5MB, type = PDF
4. Frontend sends to POST /candidates/upload-resume
5. Backend:
   - Validates JWT token (candidate must be logged in)
   - Validates file (PDF, ≤5MB)
   - Generates safe filename: candidate_{user_id}_resume.pdf
   - Saves to backend/pdfs/resumes/
   - Updates Candidate.resume_path = "candidate_1_resume.pdf"
   - Returns { filename, url }
6. Frontend shows success message
7. Shows download/view button with the URL
```

---

## 9. Example Implementation Outline

### Backend Structure:
```python
# backend/routers/pdfs.py
from fastapi import APIRouter, File, UploadFile, Depends, HTTPException
from fastapi.responses import FileResponse
import os
import shutil

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload/resume")
async def upload_resume(file: UploadFile = File(...), current_user = Depends(get_current_user)):
    # Validate user is candidate
    # Validate PDF file
    # Save to pdfs/resumes/
    # Update database
    pass

@router.get("/resume/{filename}")
async def get_resume(filename: str, current_user = Depends(get_current_user)):
    # Validate filename (prevent directory traversal)
    # Check user has permission
    # Return PDF file
    pass
```

### Frontend Structure:
```html
<!-- front-end/profile.html -->
<div id="resume-section">
    <h3>Resume</h3>
    <input type="file" id="resumeInput" accept=".pdf" />
    <button onclick="uploadResume()">Upload Resume</button>
    <div id="resumeStatus"></div>
    <div id="resumePreview"></div>
</div>

<script>
async function uploadResume() {
    const file = document.getElementById('resumeInput').files[0];
    if (!file.type === 'application/pdf') {
        alert('Only PDF files allowed');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiCall('/files/upload/resume', 'POST', formData);
    if (response.ok) {
        showResume(response.filename);
    }
}
</script>
```

---

## 10. Quick Summary of Changes

| Component | Change |
|-----------|--------|
| **Models** | Add `supporting_documents` to Application; validate `resume_path` in Candidate |
| **Backend Routes** | Create new `pdfs.py` router with upload/download endpoints |
| **Utilities** | Create `file_utils.py` for PDF validation and storage |
| **Frontend Pages** | Update `profile.html`, `application-detail.html`, `applications.html` |
| **Frontend JS** | Add PDF upload/view/download functions to `app.js` |
| **Folder** | Create `backend/pdfs/resumes/` and `backend/pdfs/interviews/` folders |
| **Security** | Implement role-based access, file validation, path safety |

---

## 11. Next Steps

When you say **"implement"**, I will:

1. ✅ Create `backend/pdfs/` folder structure
2. ✅ Update `Models.py` with supporting_documents field
3. ✅ Update `schemas.py` with PDF schemas
4. ✅ Create `backend/routers/pdfs.py` with upload/download endpoints
5. ✅ Create `backend/file_utils.py` with validation functions
6. ✅ Update `backend/main.py` to register PDF router
7. ✅ Update `front-end/profile.html` with resume upload
8. ✅ Update `front-end/application-detail.html` with document upload
9. ✅ Update `front-end/app.js` with PDF functions
10. ✅ Update `front-end/style.css` with upload styling

---

**Status:** ⏳ **Waiting for your confirmation to implement**

Reply with: **"implement"** or **"yes"** to proceed with the implementation.
