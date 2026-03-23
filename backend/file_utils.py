"""
File utilities for PDF handling and validation
"""
import os
import shutil
import mimetypes
from pathlib import Path
from typing import Optional, Tuple
from datetime import datetime


# PDF storage paths
PDF_BASE_DIR = Path(__file__).parent / "pdfs"
RESUME_DIR = PDF_BASE_DIR / "resumes"
INTERVIEW_DIR = PDF_BASE_DIR / "interviews"

# Ensure directories exist
RESUME_DIR.mkdir(parents=True, exist_ok=True)
INTERVIEW_DIR.mkdir(parents=True, exist_ok=True)

# Configuration
MAX_PDF_SIZE_MB = 10  # 10 MB max file size
ALLOWED_EXTENSIONS = {'.pdf'}
ALLOWED_MIMETYPES = {'application/pdf'}


def validate_pdf_file(file_content: bytes, filename: str) -> Tuple[bool, Optional[str]]:
    """
    Validate if file is a valid PDF
    
    Returns: (is_valid, error_message)
    """
    # Check file extension
    file_ext = Path(filename).suffix.lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        return False, f"Invalid file extension. Only .pdf files allowed."
    
    # Check file size
    size_mb = len(file_content) / (1024 * 1024)
    if size_mb > MAX_PDF_SIZE_MB:
        return False, f"File too large. Maximum size is {MAX_PDF_SIZE_MB}MB, got {size_mb:.2f}MB"
    
    # Check if file starts with PDF magic number
    if not file_content.startswith(b'%PDF'):
        return False, "File is not a valid PDF (invalid file header)"
    
    return True, None


def generate_safe_filename(original_filename: str, file_type: str, identifier: int) -> str:
    """
    Generate a safe filename to prevent directory traversal and conflicts
    
    Args:
        original_filename: Original filename from user
        file_type: Type of file ('resume', 'interview', 'feedback')
        identifier: User/Application ID
    
    Returns:
        Safe filename
    """
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    return f"{file_type}_{identifier}_{timestamp}.pdf"


def save_resume_pdf(file_content: bytes, user_id: int, original_filename: str) -> Tuple[str, float]:
    """
    Save resume PDF to storage
    
    Returns: (filename, size_in_mb)
    """
    # Validate
    is_valid, error = validate_pdf_file(file_content, original_filename)
    if not is_valid:
        raise ValueError(error)
    
    # Generate safe filename
    filename = generate_safe_filename(original_filename, "resume", user_id)
    file_path = RESUME_DIR / filename
    
    # Save file
    with open(file_path, 'wb') as f:
        f.write(file_content)
    
    size_mb = len(file_content) / (1024 * 1024)
    return filename, size_mb


def save_interview_document(file_content: bytes, application_id: int, original_filename: str) -> Tuple[str, float]:
    """
    Save interview document PDF to storage
    
    Returns: (filename, size_in_mb)
    """
    # Validate
    is_valid, error = validate_pdf_file(file_content, original_filename)
    if not is_valid:
        raise ValueError(error)
    
    # Generate safe filename
    filename = generate_safe_filename(original_filename, "interview", application_id)
    file_path = INTERVIEW_DIR / filename
    
    # Save file
    with open(file_path, 'wb') as f:
        f.write(file_content)
    
    size_mb = len(file_content) / (1024 * 1024)
    return filename, size_mb


def get_resume_file_path(filename: str) -> Optional[Path]:
    """
    Get safe file path for resume, with validation to prevent directory traversal
    """
    # Prevent directory traversal
    if ".." in filename or filename.startswith("/"):
        return None
    
    file_path = RESUME_DIR / filename
    
    # Ensure file is actually in the correct directory
    try:
        file_path = file_path.resolve()
        RESUME_DIR_RESOLVED = RESUME_DIR.resolve()
        if not str(file_path).startswith(str(RESUME_DIR_RESOLVED)):
            return None
    except:
        return None
    
    if file_path.exists() and file_path.is_file():
        return file_path
    
    return None


def get_interview_file_path(filename: str) -> Optional[Path]:
    """
    Get safe file path for interview document, with validation to prevent directory traversal
    """
    # Prevent directory traversal
    if ".." in filename or filename.startswith("/"):
        return None
    
    file_path = INTERVIEW_DIR / filename
    
    # Ensure file is actually in the correct directory
    try:
        file_path = file_path.resolve()
        INTERVIEW_DIR_RESOLVED = INTERVIEW_DIR.resolve()
        if not str(file_path).startswith(str(INTERVIEW_DIR_RESOLVED)):
            return None
    except:
        return None
    
    if file_path.exists() and file_path.is_file():
        return file_path
    
    return None


def delete_resume_file(filename: str) -> bool:
    """
    Delete a resume file safely
    """
    file_path = get_resume_file_path(filename)
    if file_path:
        try:
            os.remove(file_path)
            return True
        except Exception as e:
            print(f"Error deleting file {filename}: {e}")
            return False
    return False


def delete_interview_file(filename: str) -> bool:
    """
    Delete an interview document file safely
    """
    file_path = get_interview_file_path(filename)
    if file_path:
        try:
            os.remove(file_path)
            return True
        except Exception as e:
            print(f"Error deleting file {filename}: {e}")
            return False
    return False


def get_file_size_mb(filename: str, file_type: str = "resume") -> Optional[float]:
    """
    Get file size in MB
    """
    if file_type == "resume":
        file_path = get_resume_file_path(filename)
    elif file_type == "interview":
        file_path = get_interview_file_path(filename)
    else:
        return None
    
    if file_path:
        size_bytes = os.path.getsize(file_path)
        return size_bytes / (1024 * 1024)
    
    return None
