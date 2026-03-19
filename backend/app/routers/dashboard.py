from typing import Annotated, Optional

from fastapi import APIRouter, Depends
from sqlalchemy import func, select, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.models.models import Issue
from app.schemas.schemas import DashboardStats, IssueSummary

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
async def get_stats(db: Annotated[AsyncSession, Depends(get_db)]):
    counts = await db.execute(
        select(
            func.count().label("total"),
            func.count().filter(Issue.status == "open").label("open"),
            func.count().filter(Issue.status == "in_progress").label("in_progress"),
            func.count().filter(Issue.status == "resolved").label("resolved"),
            func.count().filter(Issue.status == "closed").label("closed"),
        ).where(Issue.is_hidden == False)
    )
    row = counts.one()

    # avg resolution time in hours
    avg_res = await db.execute(
        select(
            func.avg(
                func.extract("epoch", Issue.resolved_at - Issue.opened_at) / 3600
            )
        ).where(Issue.resolved_at != None, Issue.is_hidden == False)
    )
    avg_hours = avg_res.scalar_one_or_none()

    return DashboardStats(
        total_issues=row.total,
        open_issues=row.open,
        in_progress_issues=row.in_progress,
        resolved_issues=row.resolved,
        closed_issues=row.closed,
        avg_resolution_hours=round(avg_hours, 2) if avg_hours is not None else None,
    )


@router.get("/top-issues", response_model=list[IssueSummary])
async def top_issues(
    limit: int = 10,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Issue)
        .where(Issue.is_hidden == False)
        .options(
            selectinload(Issue.author),
            selectinload(Issue.category),
            selectinload(Issue.jurisdiction),
        )
        .order_by(Issue.score.desc(), Issue.created_at.desc())
        .limit(limit)
    )
    return result.scalars().all()
