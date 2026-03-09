from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..authentication import get_current_user
from ..authorize import enforce_owner_or_admin, require_roles
from ..Database import get_db
from ..Models import Application, Candidate, Interview, Job
from ..schemas import ApplicationCreate, ApplicationUpdate, BulkStatusUpdate
from .dependencies import APP_TRANSITIONS, _current_db_user, _notify

router = APIRouter(prefix="/applications", tags=["Applications"])


@router.post("")
def apply_job(
    payload: ApplicationCreate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Apply for a job (Candidate)"""
    user = _current_db_user(current, db)
    require_roles("candidate")(current)

    candidate = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
    if not candidate:
        raise HTTPException(status_code=400, detail="Candidate profile not found")

    job = db.query(Job).filter(Job.job_id == payload.job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    if job.job_status != "open":
        raise HTTPException(status_code=400, detail="Only open jobs accept applications")

    dup = (
        db.query(Application)
        .filter(Application.job_id == payload.job_id, Application.candidate_id == candidate.candidate_id)
        .first()
    )
    if dup:
        raise HTTPException(status_code=400, detail="Duplicate application not allowed")

    app_row = Application(
        candidate_id=candidate.candidate_id,
        job_id=payload.job_id,
        application_status="applied"
    )
    db.add(app_row)
    db.commit()
    db.refresh(app_row)
    
    _notify(db, candidate.candidate_id, "Application submitted", "info", app_row.application_id)
    db.commit()
    db.refresh(app_row)
    return app_row


@router.get("")
def list_applications(
    page: int = 1,
    page_size: int = 20,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List applications based on user role"""
    user = _current_db_user(current, db)

    q = db.query(Application)

    if user.role == "admin" or user.role == "hr":
        pass  # no extra filter
    elif user.role == "interviewer":
        q = (
            q.join(Interview, Interview.application_id == Application.application_id)
            .filter(Interview.interviewer_id == user.user_id)
        )
    elif user.role == "candidate":
        c = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
        if not c:
            return {"total": 0, "page": page, "page_size": page_size, "items": []}
        q = q.filter(Application.candidate_id == c.candidate_id)
    else:
        return {"total": 0, "page": page, "page_size": page_size, "items": []}

    total = q.count()
    items = (
        q.order_by(Application.applied_date.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )
    return {"total": total, "page": page, "page_size": page_size, "items": items}


@router.patch("/{application_id}/state")
def update_application_state(
    application_id: int,
    payload: ApplicationUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update application status (HR/Admin)"""
    _current_db_user(current, db)
    require_roles("hr", "admin")(current)
    
    app_row = db.query(Application).filter(Application.application_id == application_id).first()
    if not app_row:
        raise HTTPException(status_code=404, detail="Application not found")

    job = db.query(Job).filter(Job.job_id == app_row.job_id).first()
    enforce_owner_or_admin(current, job.owner_hr_id)

    if payload.application_status not in APP_TRANSITIONS.get(app_row.application_status, set()):
        raise HTTPException(status_code=400, detail="Invalid application transition")
    
    app_row.application_status = payload.application_status

    _notify(
        db,
        app_row.candidate_id,
        f"Application moved to {payload.application_status}",
        "action_required",
        application_id
    )
    db.commit()
    return app_row


@router.post("/bulk-shortlist")
def bulk_shortlist(
    payload: BulkStatusUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bulk shortlist applications (HR/Admin)"""
    for app_id in payload.application_ids:
        update_application_state(
            app_id,
            ApplicationUpdate(application_status="shortlisted"),
            current,
            db
        )
    return {"updated": len(payload.application_ids)}


@router.post("/bulk-reject")
def bulk_reject(
    payload: BulkStatusUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Bulk reject applications (HR/Admin)"""
    for app_id in payload.application_ids:
        update_application_state(
            app_id,
            ApplicationUpdate(application_status="rejected"),
            current,
            db
        )
    return {"updated": len(payload.application_ids)}


@router.get("/search")
def search_applications(
    status: str | None = None,
    job_id: int | None = None,
    page: int = 1,
    limit: int = 10,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search applications with filters (HR/Admin)"""
    require_roles("hr", "admin")(current)

    query = db.query(Application)

    if status:
        query = query.filter(Application.application_status == status.lower())

    if job_id:
        query = query.filter(Application.job_id == job_id)

    total = query.count()

    results = (
        query
        .order_by(Application.applied_date.desc())
        .offset((page - 1) * limit)
        .limit(limit)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "limit": limit,
        "results": results
    }
