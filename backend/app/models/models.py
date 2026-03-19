import uuid
from datetime import datetime
from typing import Optional

from sqlalchemy import (
    Boolean, Column, DateTime, ForeignKey, Integer, Numeric,
    String, Text, UniqueConstraint, func,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.database import Base


# ──────────────────────────────────────────────
# User
# ──────────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email         = Column(String, unique=True, nullable=False, index=True)
    username      = Column(String, unique=True, nullable=False, index=True)
    full_name     = Column(String)
    password_hash = Column(String)
    role          = Column(String, nullable=False, default="citizen")
    is_active     = Column(Boolean, nullable=False, default=True)
    avatar_url    = Column(String)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at    = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    issues           = relationship("Issue", back_populates="author", foreign_keys="[Issue.author_id]")
    votes            = relationship("Vote", back_populates="user")
    comments         = relationship("Comment", back_populates="author")
    status_changes   = relationship("IssueStatusHistory", back_populates="changed_by_user")
    evidence_uploads = relationship("IssueEvidence", back_populates="uploader")


# ──────────────────────────────────────────────
# Jurisdiction
# ──────────────────────────────────────────────
class Jurisdiction(Base):
    __tablename__ = "jurisdictions"

    id         = Column(Integer, primary_key=True, autoincrement=True)
    name       = Column(String, nullable=False)
    level      = Column(String, nullable=False)  # federal | provincial | municipal
    country    = Column(String, nullable=False, default="Canada")
    province   = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    issues           = relationship("Issue", back_populates="jurisdiction")
    government_bodies = relationship("GovernmentBody", back_populates="jurisdiction")


# ──────────────────────────────────────────────
# GovernmentBody
# ──────────────────────────────────────────────
class GovernmentBody(Base):
    __tablename__ = "government_bodies"

    id              = Column(Integer, primary_key=True, autoincrement=True)
    name            = Column(String, nullable=False)
    jurisdiction_id = Column(Integer, ForeignKey("jurisdictions.id", ondelete="RESTRICT"), nullable=False)
    website         = Column(String)
    contact_email   = Column(String)
    created_at      = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    jurisdiction = relationship("Jurisdiction", back_populates="government_bodies")
    issues       = relationship("Issue", back_populates="government_body")


# ──────────────────────────────────────────────
# Category
# ──────────────────────────────────────────────
class Category(Base):
    __tablename__ = "categories"

    id          = Column(Integer, primary_key=True, autoincrement=True)
    name        = Column(String, unique=True, nullable=False)
    slug        = Column(String, unique=True, nullable=False)
    description = Column(Text)
    icon        = Column(String)
    color       = Column(String, default="#6B7280")
    created_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    issues = relationship("Issue", back_populates="category")


# ──────────────────────────────────────────────
# Issue
# ──────────────────────────────────────────────
class Issue(Base):
    __tablename__ = "issues"

    id                 = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title              = Column(String, nullable=False)
    description        = Column(Text, nullable=False)
    category_id        = Column(Integer, ForeignKey("categories.id", ondelete="RESTRICT"), nullable=False)
    jurisdiction_id    = Column(Integer, ForeignKey("jurisdictions.id", ondelete="RESTRICT"), nullable=False)
    government_body_id = Column(Integer, ForeignKey("government_bodies.id", ondelete="SET NULL"), nullable=True)
    author_id          = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)

    address  = Column(String)
    city     = Column(String)
    province = Column(String)
    country  = Column(String, default="Canada")
    latitude  = Column(Numeric(10, 7))
    longitude = Column(Numeric(10, 7))

    status      = Column(String, nullable=False, default="open")
    opened_at   = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    resolved_at = Column(DateTime(timezone=True))

    upvote_count   = Column(Integer, nullable=False, default=0)
    downvote_count = Column(Integer, nullable=False, default=0)
    score          = Column(Integer, nullable=False, default=0)
    comment_count  = Column(Integer, nullable=False, default=0)

    is_hidden      = Column(Boolean, nullable=False, default=False)
    duplicate_of   = Column(UUID(as_uuid=True), ForeignKey("issues.id", ondelete="SET NULL"), nullable=True)
    moderator_note = Column(Text)

    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    author          = relationship("User", back_populates="issues", foreign_keys=[author_id])
    category        = relationship("Category", back_populates="issues")
    jurisdiction    = relationship("Jurisdiction", back_populates="issues")
    government_body = relationship("GovernmentBody", back_populates="issues")
    votes           = relationship("Vote", back_populates="issue", cascade="all, delete-orphan")
    comments        = relationship("Comment", back_populates="issue", cascade="all, delete-orphan")
    status_history  = relationship("IssueStatusHistory", back_populates="issue", cascade="all, delete-orphan")
    evidence        = relationship("IssueEvidence", back_populates="issue", cascade="all, delete-orphan")


# ──────────────────────────────────────────────
# Vote
# ──────────────────────────────────────────────
class Vote(Base):
    __tablename__ = "votes"
    __table_args__ = (
        UniqueConstraint("issue_id", "user_id", name="uq_vote_per_user_per_issue"),
    )

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    issue_id   = Column(UUID(as_uuid=True), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    user_id    = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    vote       = Column(String, nullable=False)  # upvote | downvote
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    issue = relationship("Issue", back_populates="votes")
    user  = relationship("User", back_populates="votes")


# ──────────────────────────────────────────────
# Comment
# ──────────────────────────────────────────────
class Comment(Base):
    __tablename__ = "comments"

    id         = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    issue_id   = Column(UUID(as_uuid=True), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    author_id  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    parent_id  = Column(UUID(as_uuid=True), ForeignKey("comments.id", ondelete="CASCADE"), nullable=True)
    body       = Column(Text, nullable=False)
    is_hidden  = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    issue    = relationship("Issue", back_populates="comments")
    author   = relationship("User", back_populates="comments")
    replies  = relationship("Comment", backref="parent", remote_side="Comment.id")


# ──────────────────────────────────────────────
# IssueStatusHistory
# ──────────────────────────────────────────────
class IssueStatusHistory(Base):
    __tablename__ = "issue_status_history"

    id          = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    issue_id    = Column(UUID(as_uuid=True), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    changed_by  = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    old_status  = Column(String)
    new_status  = Column(String, nullable=False)
    note        = Column(Text)
    changed_at  = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    issue           = relationship("Issue", back_populates="status_history")
    changed_by_user = relationship("User", back_populates="status_changes")


# ──────────────────────────────────────────────
# IssueEvidence
# ──────────────────────────────────────────────
class IssueEvidence(Base):
    __tablename__ = "issue_evidence"

    id            = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    issue_id      = Column(UUID(as_uuid=True), ForeignKey("issues.id", ondelete="CASCADE"), nullable=False)
    uploaded_by   = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    evidence_type = Column(String, nullable=False)  # image | link | document
    url           = Column(Text, nullable=False)
    caption       = Column(Text)
    created_at    = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    issue    = relationship("Issue", back_populates="evidence")
    uploader = relationship("User", back_populates="evidence_uploads")
