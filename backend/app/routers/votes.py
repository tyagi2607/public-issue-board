import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.auth.deps import get_current_active_user
from app.database import get_db
from app.models.models import Issue, Vote, User
from app.schemas.schemas import VoteCreate, VoteOut

router = APIRouter(prefix="/issues", tags=["votes"])


@router.post("/{issue_id}/vote", response_model=VoteOut)
async def cast_vote(
    issue_id: uuid.UUID,
    payload: VoteCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    # Verify issue exists
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if not issue or issue.is_hidden:
        raise HTTPException(status_code=404, detail="Issue not found")

    # Upsert vote (update if user already voted)
    existing = await db.execute(
        select(Vote).where(Vote.issue_id == issue_id, Vote.user_id == current_user.id)
    )
    vote_row = existing.scalar_one_or_none()

    if vote_row:
        vote_row.vote = payload.vote
    else:
        vote_row = Vote(issue_id=issue_id, user_id=current_user.id, vote=payload.vote)
        db.add(vote_row)

    await db.flush()

    # Sync counts on issue manually (trigger handles it in production DB,
    # but we also update in-memory for the response)
    up = await db.execute(
        select(Vote).where(Vote.issue_id == issue_id, Vote.vote == "upvote")
    )
    down = await db.execute(
        select(Vote).where(Vote.issue_id == issue_id, Vote.vote == "downvote")
    )
    upvotes = len(up.scalars().all())
    downvotes = len(down.scalars().all())

    issue.upvote_count = upvotes
    issue.downvote_count = downvotes
    issue.score = upvotes - downvotes
    await db.flush()
    await db.refresh(issue)

    return VoteOut(
        issue_id=issue.id,
        vote=payload.vote,
        upvote_count=issue.upvote_count,
        downvote_count=issue.downvote_count,
        score=issue.score,
    )


@router.delete("/{issue_id}/vote", status_code=204)
async def remove_vote(
    issue_id: uuid.UUID,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Vote).where(Vote.issue_id == issue_id, Vote.user_id == current_user.id)
    )
    vote_row = result.scalar_one_or_none()
    if not vote_row:
        raise HTTPException(status_code=404, detail="Vote not found")

    await db.delete(vote_row)
    await db.flush()

    # Sync counts
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if issue:
        up = await db.execute(
            select(Vote).where(Vote.issue_id == issue_id, Vote.vote == "upvote")
        )
        down = await db.execute(
            select(Vote).where(Vote.issue_id == issue_id, Vote.vote == "downvote")
        )
        issue.upvote_count = len(up.scalars().all())
        issue.downvote_count = len(down.scalars().all())
        issue.score = issue.upvote_count - issue.downvote_count
