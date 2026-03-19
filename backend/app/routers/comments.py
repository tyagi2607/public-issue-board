import uuid
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.auth.deps import get_current_active_user, require_moderator
from app.database import get_db
from app.models.models import Comment, Issue, User
from app.schemas.schemas import CommentCreate, CommentOut

router = APIRouter(prefix="/issues", tags=["comments"])


@router.post("/{issue_id}/comments", response_model=CommentOut, status_code=status.HTTP_201_CREATED)
async def add_comment(
    issue_id: uuid.UUID,
    payload: CommentCreate,
    current_user: Annotated[User, Depends(get_current_active_user)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(select(Issue).where(Issue.id == issue_id))
    issue = result.scalar_one_or_none()
    if not issue or issue.is_hidden:
        raise HTTPException(status_code=404, detail="Issue not found")

    if payload.parent_id:
        parent_result = await db.execute(
            select(Comment).where(Comment.id == payload.parent_id, Comment.issue_id == issue_id)
        )
        if not parent_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Parent comment not found")

    comment = Comment(
        issue_id=issue_id,
        author_id=current_user.id,
        parent_id=payload.parent_id,
        body=payload.body,
    )
    db.add(comment)
    await db.flush()

    result = await db.execute(
        select(Comment).where(Comment.id == comment.id).options(selectinload(Comment.author))
    )
    return result.scalar_one()


@router.get("/{issue_id}/comments", response_model=list[CommentOut])
async def list_comments(
    issue_id: uuid.UUID,
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Comment)
        .where(Comment.issue_id == issue_id, Comment.is_hidden == False)
        .options(selectinload(Comment.author))
        .order_by(Comment.created_at)
    )
    return result.scalars().all()


@router.delete("/{issue_id}/comments/{comment_id}", status_code=204)
async def delete_comment(
    issue_id: uuid.UUID,
    comment_id: uuid.UUID,
    current_user: Annotated[User, Depends(require_moderator)],
    db: Annotated[AsyncSession, Depends(get_db)],
):
    result = await db.execute(
        select(Comment).where(Comment.id == comment_id, Comment.issue_id == issue_id)
    )
    comment = result.scalar_one_or_none()
    if not comment:
        raise HTTPException(status_code=404, detail="Comment not found")
    comment.is_hidden = True
    await db.flush()
