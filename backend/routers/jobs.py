from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from ..authentication import get_current_user
from ..authorize import enforce_owner_or_admin, require_roles
from ..Database import get_db
from ..Models import Application, Interview, Job
from ..schemas import JobCreate, JobStateUpdate
from .dependencies import JOB_TRANSITIONS, _audit, _current_db_user

router = APIRouter(prefix="/jobs", tags=["Jobs"])


@router.get("")
def list_jobs(
    status: str | None = Query(default=None),
    page: int = 1,
    page_size: int = 20,
    db: Session = Depends(get_db)
):
    """List all jobs with optional status filter"""
    q = db.query(Job)
    if status:
        q = q.filter(Job.job_status == status)
    total = q.count()
    items = q.order_by(Job.posted_date.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return {"total": total, "items": items}


@router.post("")
def create_job(
    payload: JobCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new job posting (HR/Admin)"""
    actor = _current_db_user(current, db)
    require_roles("hr", "admin")(current)
    
    row = Job(
        owner_hr_id=actor.user_id,
        job_title=payload.job_title,
        job_description=payload.job_description,
        department=payload.department,
        experience_required=payload.experience_required,
        job_status="draft",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    _audit(db, actor.user_id, f"job_created:{row.job_id}")
    db.commit()
    return row


@router.get("/{job_id}")
def get_job(job_id: int, db: Session = Depends(get_db)):
    """Get job details by ID"""
    row = db.query(Job).filter(Job.job_id == job_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    return row


@router.patch("/{job_id}/state")
def update_job_state(
    job_id: int,
    payload: JobStateUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update job status (HR/Admin)"""
    _current_db_user(current, db)
    row = db.query(Job).filter(Job.job_id == job_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    enforce_owner_or_admin(current, row.owner_hr_id)

    if payload.job_status not in JOB_TRANSITIONS.get(row.job_status, set()):
        raise HTTPException(status_code=400, detail="Invalid job state transition")
    
    old_status = row.job_status
    row.job_status = payload.job_status
    _audit(db, current["user_id"], f"job_status_changed:{job_id}:{old_status}->{payload.job_status}")
    db.commit()
    return row


@router.patch("/{job_id}/reopen")
def reopen_job(
    job_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reopen an archived job (Admin only)"""
    _current_db_user(current, db)
    require_roles("admin")(current)
    
    row = db.query(Job).filter(Job.job_id == job_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Job not found")
    
    # Admin override - can reopen any job
    row.job_status = "open"
    db.commit()
    return row


@router.get("/{job_id}/analytics")
def job_analytics(
    job_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get job analytics (HR/Admin)"""
    _current_db_user(current, db)
    require_roles("hr", "admin")(current)

    app_count = db.query(Application).filter(Application.job_id == job_id).count()
    interview_count = (
        db.query(Interview)
        .join(Application, Interview.application_id == Application.application_id)
        .filter(Application.job_id == job_id)
        .count()
    )
    return {"job_id": job_id, "applications": app_count, "interviews": interview_count}
