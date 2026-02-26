from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..authentication import get_current_user
from ..authorize import require_roles
from ..Database import get_db
from ..Models import Application, Candidate, Interview, User
from ..schemas import CandidateUpdate
from .dependencies import _current_db_user

router = APIRouter(tags=["Candidates"])


def _build_full_candidate_payload(db: Session, candidate: Candidate) -> dict:
    user = db.query(User).filter(User.user_id == candidate.user_id).first()
    applications = db.query(Application).filter(Application.candidate_id == candidate.candidate_id).all()
    interviews = (
        db.query(Interview)
        .join(Application, Interview.application_id == Application.application_id)
        .filter(Application.candidate_id == candidate.candidate_id)
        .all()
    )

    return {
        "candidate_id": candidate.candidate_id,
        "user": {
            "user_id": user.user_id,
            "name": user.name,
            "email": user.email,
            "status": user.status,
            "is_active": user.is_active,
        },
        "profile": {
            "phone": candidate.phone,
            "skills": candidate.skills,
            "experience_years": candidate.experience_year,
            "resume_path": candidate.resume_path,
        },
        "applications": applications,
        "interviews": interviews,
    }


@router.get("/candidate/profile")
def get_candidate_profile(
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current candidate's profile"""
    current_user = _current_db_user(current, db)
    require_roles("candidate")(current)
    
    profile = db.query(Candidate).filter(Candidate.user_id == current_user.user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")
    return profile


@router.post("/candidate/profile")
def create_candidate_profile(
    payload: CandidateUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create candidate profile"""
    user = _current_db_user(current, db)
    require_roles("candidate")(current)

    profile = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
    if profile:
        raise HTTPException(status_code=400, detail="Candidate profile already exists")

    profile = Candidate(
        user_id=user.user_id,
        phone=payload.phone,
        skills=payload.skills,
        experience_year=payload.experience_years,
        resume_path=payload.resume_path,
    )
    db.add(profile)
    db.commit()
    db.refresh(profile)
    return profile


@router.patch("/candidate/profile")
def update_candidate_profile(
    payload: CandidateUpdate,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update candidate profile"""
    user = _current_db_user(current, db)
    require_roles("candidate")(current)

    profile = db.query(Candidate).filter(Candidate.user_id == user.user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Candidate profile not found")

    if payload.phone is not None:
        profile.phone = payload.phone
    if payload.skills is not None:
        profile.skills = payload.skills
    if payload.experience_years is not None:
        profile.experience_year = payload.experience_years
    if payload.resume_path is not None:
        profile.resume_path = payload.resume_path

    db.commit()
    db.refresh(profile)
    return profile


@router.get("/candidates/{candidate_id}/full-profile")
def get_full_candidate_profile(
    candidate_id: int,
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get full candidate profile with applications and interviews"""
    user = _current_db_user(current, db)
    require_roles("hr", "admin", "interviewer")(current)

    if current["role"] == "interviewer":
        interviewer_has_access = (
            db.query(Interview)
            .join(Application, Interview.application_id == Application.application_id)
            .filter(
                Interview.interviewer_id == user.user_id,
                Application.candidate_id == candidate_id
            )
            .first()
        )
        if not interviewer_has_access:
            raise HTTPException(status_code=403, detail="Interviewer not assigned to this candidate")
    
    candidate = db.query(Candidate).filter(Candidate.candidate_id == candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    
    return _build_full_candidate_payload(db, candidate)


@router.get("/candidates/dashboard")
def candidates_dashboard(
    current=Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get candidates with full data for dashboard view"""
    user = _current_db_user(current, db)
    require_roles("hr", "admin", "interviewer")(current)

    if current["role"] in ["hr", "admin"]:
        candidates = db.query(Candidate).all()
    else:
        candidate_ids = (
            db.query(Application.candidate_id)
            .join(Interview, Interview.application_id == Application.application_id)
            .filter(Interview.interviewer_id == user.user_id)
            .distinct()
            .all()
        )
        ids = [row[0] for row in candidate_ids]
        candidates = db.query(Candidate).filter(Candidate.candidate_id.in_(ids)).all() if ids else []

    return [_build_full_candidate_payload(db, candidate) for candidate in candidates]


@router.get("/candidates/search")
def search_candidates(
    skill: str | None = None,
    min_exp: int | None = None,
    page: int = 1,
    limit: int = 10,
    current=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Search candidates by skill and experience (HR/Admin)"""
    require_roles("hr", "admin")(current)

    query = db.query(Candidate)

    if skill:
        query = query.filter(Candidate.skills.ilike(f"%{skill}%"))

    if min_exp is not None:
        query = query.filter(Candidate.experience_year >= min_exp)

    total = query.count()

    results = (
        query
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
