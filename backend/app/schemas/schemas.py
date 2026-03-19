from __future__ import annotations

import uuid
from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ──────────────────────────────────────────────
# User schemas
# ──────────────────────────────────────────────
class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50, pattern=r"^[a-zA-Z0-9_-]+$")
    full_name: Optional[str] = None
    password: str = Field(..., min_length=8, max_length=128)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: uuid.UUID
    email: EmailStr
    username: str
    full_name: Optional[str]
    role: str
    is_active: bool
    avatar_url: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[str] = None


# ──────────────────────────────────────────────
# Category
# ──────────────────────────────────────────────
class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str]
    icon: Optional[str]
    color: str

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Jurisdiction
# ──────────────────────────────────────────────
class JurisdictionOut(BaseModel):
    id: int
    name: str
    level: str
    country: str
    province: Optional[str]

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Government Body
# ──────────────────────────────────────────────
class GovernmentBodyOut(BaseModel):
    id: int
    name: str
    jurisdiction_id: int
    website: Optional[str]
    contact_email: Optional[str]

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Evidence
# ──────────────────────────────────────────────
class EvidenceCreate(BaseModel):
    evidence_type: Literal["image", "link", "document"]
    url: str = Field(..., max_length=2048)
    caption: Optional[str] = Field(None, max_length=500)


class EvidenceOut(BaseModel):
    id: uuid.UUID
    evidence_type: str
    url: str
    caption: Optional[str]
    uploaded_by: uuid.UUID
    created_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Comment
# ──────────────────────────────────────────────
class CommentCreate(BaseModel):
    body: str = Field(..., min_length=1, max_length=5000)
    parent_id: Optional[uuid.UUID] = None


class CommentOut(BaseModel):
    id: uuid.UUID
    issue_id: uuid.UUID
    author_id: uuid.UUID
    parent_id: Optional[uuid.UUID]
    body: str
    is_hidden: bool
    created_at: datetime
    updated_at: datetime
    author: UserOut

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Status History
# ──────────────────────────────────────────────
class StatusHistoryOut(BaseModel):
    id: uuid.UUID
    issue_id: uuid.UUID
    changed_by: uuid.UUID
    old_status: Optional[str]
    new_status: str
    note: Optional[str]
    changed_at: datetime

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Issue
# ──────────────────────────────────────────────
class IssueCreate(BaseModel):
    title: str = Field(..., min_length=5, max_length=255)
    description: str = Field(..., min_length=10, max_length=10000)
    category_id: int
    jurisdiction_id: int
    government_body_id: Optional[int] = None
    address: Optional[str] = Field(None, max_length=500)
    city: Optional[str] = Field(None, max_length=100)
    province: Optional[str] = Field(None, max_length=100)
    country: Optional[str] = Field("Canada", max_length=100)
    latitude: Optional[float] = Field(None, ge=-90, le=90)
    longitude: Optional[float] = Field(None, ge=-180, le=180)
    evidence: Optional[list[EvidenceCreate]] = []


class IssueSummary(BaseModel):
    id: uuid.UUID
    title: str
    status: str
    category: CategoryOut
    jurisdiction: JurisdictionOut
    author_id: uuid.UUID
    city: Optional[str]
    province: Optional[str]
    upvote_count: int
    downvote_count: int
    score: int
    comment_count: int
    opened_at: datetime
    resolved_at: Optional[datetime]
    created_at: datetime

    model_config = {"from_attributes": True}


class IssueDetail(IssueSummary):
    description: str
    government_body: Optional[GovernmentBodyOut]
    address: Optional[str]
    country: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    is_hidden: bool
    duplicate_of: Optional[uuid.UUID]
    moderator_note: Optional[str]
    updated_at: datetime
    author: UserOut
    evidence: list[EvidenceOut] = []
    status_history: list[StatusHistoryOut] = []

    model_config = {"from_attributes": True}


class IssueListResponse(BaseModel):
    items: list[IssueSummary]
    total: int
    page: int
    page_size: int
    total_pages: int


# ──────────────────────────────────────────────
# Vote
# ──────────────────────────────────────────────
class VoteCreate(BaseModel):
    vote: Literal["upvote", "downvote"]


class VoteOut(BaseModel):
    issue_id: uuid.UUID
    vote: str
    upvote_count: int
    downvote_count: int
    score: int

    model_config = {"from_attributes": True}


# ──────────────────────────────────────────────
# Status update
# ──────────────────────────────────────────────
class StatusUpdate(BaseModel):
    status: Literal["open", "in_progress", "resolved", "closed"]
    note: Optional[str] = Field(None, max_length=1000)


# ──────────────────────────────────────────────
# Moderation
# ──────────────────────────────────────────────
class ModerationUpdate(BaseModel):
    is_hidden: Optional[bool] = None
    duplicate_of: Optional[uuid.UUID] = None
    moderator_note: Optional[str] = Field(None, max_length=1000)


# ──────────────────────────────────────────────
# Dashboard / stats
# ──────────────────────────────────────────────
class DashboardStats(BaseModel):
    total_issues: int
    open_issues: int
    in_progress_issues: int
    resolved_issues: int
    closed_issues: int
    avg_resolution_hours: Optional[float]
