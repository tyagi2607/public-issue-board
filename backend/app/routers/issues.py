import math
import uuid
from typing import Annotated, Literal, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import get_current_active_user, require_moderator
from app.database import get_db
from app.models.models import Issue, IssueEvidence, IssueStatusHistory, User
from app.schemas.schemas import (
    IssueCreate,
    IssueDetail,
    IssueListResponse,
    IssueSummary,
    ModerationUpdate,
    StatusUpdate,
)

router = APIRouter(prefix="/issues", tags=["issues"])

_EAGER = [
    selectinload(Issue.author),
    selectinload(Issue.category),
    selectinload(Issue.jurisdiction),
    selectinload(Issue.government_body),
    selectinload(Issue.evidence),
    selectinload(Issue.status_history),
]


@router.post("", response_model=IssueDetail, status_code=status.HTTP_201_CREATED)
async def create_issue(
    payload: IssueCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    issue = Issue(
        title=payload.title,
        description=payload.description,
        category_id=payload.category_id,
        jurisdiction_id=payload.jurisdiction_id,
        government_body_id=payload.government_body_id,
        author_id=current_user.id,
        address=payload.address,
        city=payload.city,
        province=payload.province,
        country=payload.country,
        latitude=payload.latitude,
        longitude=payload.longitude,
    )
    db.add(issue)
    await db.flush()  # get the UUID

    for ev in (payload.evidence or []):
        db.add(IssueEvidence(
            issue_id=issue.id,
            uploaded_by=current_user.id,
            evidence_type=ev.evidence_type,
            url=ev.url,
            caption=ev.caption,
        ))

    # initial status history entry
    db.add(IssueStatusHistory(
        issue_id=issue.id,
        changed_by=current_user.id,
        old_status=None,
        new_status="open",
    ))

    await db.flush()
    await db.refresh(issue)

    result = await db.execute(
        select(Issue).where(Issue.id == issue.id).options(*_EAGER)
    )
    return result.scalar_one()


@router.get("", response_model=IssueListResponse)
async def list_issues(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    status: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    jurisdiction_id: Optional[int] = Query(None),
    city: Optional[str] = Query(None),
    province: Optional[str] = Query(None),
    sort_by: Literal["score", "created_at", "comment_count"] = Query("score"),
    db: AsyncSession = Depends(get_db),
):
    q = (
        select(Issue)
        .options(
            selectinload(Issue.author),
            selectinload(Issue.category),
            selectinload(Issue.jurisdiction),
        )
        .where(Issue.is_hidden == False)
    )

    if status:
        q = q.where(Issue.status == status)
    if category_id:
        q = q.where(Issue.category_id == category_id)
    if jurisdiction_id:
        q = q.where(Issue.jurisdiction_id == jurisdiction_id)
    if city:
        q = q.where(Issue.city.ilike(f"%{city}%"))
    if province:
        q = q.where(Issue.province.ilike(f"%{province}%"))

    # count
    count_q = select(func.count()).select_from(q.subquery())
    total = (await db.execute(count_q)).scalar_one()

    # sort
    sort_col = {
        "score": Issue.score.desc(),
        "created_at": Issue.created_at.desc(),
        "comment_count": Issue.comment_count.desc(),
    }[sort_by]

    q = q.order_by(sort_col).offset((page - 1) * page_size).limit(page_size)
    items = (await db.execute(q)).scalars().all()

    return IssueListResponse(
        items=items,
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total else 0,
    )


@router.get("/{issue_id}", response_model=IssueDetail)
async def get_issue(issue_id: uuid.UUID, db: Annotated[AsyncSession, Depends(get_db)]):
    result = await db.execute(
        select(Issue)
        .where(Issue.id == issue_id, Issue.is_hidden == False)
        .options(*_EAGER)
    )
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    return issue


@router.patch("/{issue_id}/status", response_model=IssueDetail)
async def update_status(
    issue_id: uuid.UUID,
    payload: StatusUpdate,
    current_user: Annotated[User, Depends(require_moderator)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Issue).where(Issue.id == issue_id).options(*_EAGER))
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    old_status = issue.status
    issue.status = payload.status
    if payload.status == "resolved" and not issue.resolved_at:
        from datetime import datetime, timezone
        issue.resolved_at = datetime.now(timezone.utc)

    db.add(IssueStatusHistory(
        issue_id=issue.id,
        changed_by=current_user.id,
        old_status=old_status,
        new_status=payload.status,
        note=payload.note,
    ))
    await db.flush()
    await db.refresh(issue)

    result = await db.execute(select(Issue).where(Issue.id == issue.id).options(*_EAGER))
    return result.scalar_one()


@router.patch("/{issue_id}/moderate", response_model=IssueDetail)
async def moderate_issue(
    issue_id: uuid.UUID,
    payload: ModerationUpdate,
    current_user: Annotated[User, Depends(require_moderator)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Issue).where(Issue.id == issue_id).options(*_EAGER))
    issue = result.scalar_one_or_none()
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")

    if payload.is_hidden is not None:
        issue.is_hidden = payload.is_hidden
    if payload.duplicate_of is not None:
        issue.duplicate_of = payload.duplicate_of
    if payload.moderator_note is not None:
        issue.moderator_note = payload.moderator_note

    await db.flush()
    await db.refresh(issue)

    result = await db.execute(select(Issue).where(Issue.id == issue.id).options(*_EAGER))
    return result.scalar_one()
