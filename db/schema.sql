-- ============================================================
-- Public Issue Board – Database Schema
-- PostgreSQL
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- Enums
-- ============================================================
CREATE TYPE user_role AS ENUM ('citizen', 'moderator', 'admin');
CREATE TYPE issue_status AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE jurisdiction_level AS ENUM ('federal', 'provincial', 'municipal');
CREATE TYPE vote_type AS ENUM ('upvote', 'downvote');

-- ============================================================
-- users
-- ============================================================
CREATE TABLE users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email       TEXT UNIQUE NOT NULL,
    username    TEXT UNIQUE NOT NULL,
    full_name   TEXT,
    password_hash TEXT,          -- NULL for OAuth-only accounts
    role        user_role NOT NULL DEFAULT 'citizen',
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_url  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);

-- ============================================================
-- jurisdictions
-- ============================================================
CREATE TABLE jurisdictions (
    id          SERIAL PRIMARY KEY,
    name        TEXT NOT NULL,
    level       jurisdiction_level NOT NULL,
    country     TEXT NOT NULL DEFAULT 'Canada',
    province    TEXT,            -- populated for provincial/municipal
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_jurisdictions_level ON jurisdictions(level);

-- ============================================================
-- government_bodies
-- ============================================================
CREATE TABLE government_bodies (
    id              SERIAL PRIMARY KEY,
    name            TEXT NOT NULL,
    jurisdiction_id INTEGER NOT NULL REFERENCES jurisdictions(id) ON DELETE RESTRICT,
    website         TEXT,
    contact_email   TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_gov_bodies_jurisdiction ON government_bodies(jurisdiction_id);

-- ============================================================
-- categories
-- ============================================================
CREATE TABLE categories (
    id          SERIAL PRIMARY KEY,
    name        TEXT UNIQUE NOT NULL,
    slug        TEXT UNIQUE NOT NULL,
    description TEXT,
    icon        TEXT,
    color       TEXT DEFAULT '#6B7280',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- issues
-- ============================================================
CREATE TABLE issues (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title               TEXT NOT NULL,
    description         TEXT NOT NULL,
    category_id         INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    jurisdiction_id     INTEGER NOT NULL REFERENCES jurisdictions(id) ON DELETE RESTRICT,
    government_body_id  INTEGER REFERENCES government_bodies(id) ON DELETE SET NULL,
    author_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Location
    address             TEXT,
    city                TEXT,
    province            TEXT,
    country             TEXT DEFAULT 'Canada',
    latitude            DECIMAL(10, 7),
    longitude           DECIMAL(10, 7),

    -- Status
    status              issue_status NOT NULL DEFAULT 'open',
    opened_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at         TIMESTAMPTZ,

    -- Voting (denormalised for fast reads)
    upvote_count        INTEGER NOT NULL DEFAULT 0,
    downvote_count      INTEGER NOT NULL DEFAULT 0,
    score               INTEGER NOT NULL DEFAULT 0,   -- upvotes - downvotes
    comment_count       INTEGER NOT NULL DEFAULT 0,

    -- Moderation
    is_hidden           BOOLEAN NOT NULL DEFAULT FALSE,
    duplicate_of        UUID REFERENCES issues(id) ON DELETE SET NULL,
    moderator_note      TEXT,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_issues_category ON issues(category_id);
CREATE INDEX idx_issues_jurisdiction ON issues(jurisdiction_id);
CREATE INDEX idx_issues_author ON issues(author_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_score ON issues(score DESC);
CREATE INDEX idx_issues_created ON issues(created_at DESC);
CREATE INDEX idx_issues_location ON issues(latitude, longitude) WHERE latitude IS NOT NULL;

-- ============================================================
-- votes
-- ============================================================
CREATE TABLE votes (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id    UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vote        vote_type NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_vote_per_user_per_issue UNIQUE (issue_id, user_id)
);

CREATE INDEX idx_votes_issue ON votes(issue_id);
CREATE INDEX idx_votes_user ON votes(user_id);

-- ============================================================
-- comments
-- ============================================================
CREATE TABLE comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id    UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    author_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    parent_id   UUID REFERENCES comments(id) ON DELETE CASCADE,  -- for nested replies
    body        TEXT NOT NULL,
    is_hidden   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_issue ON comments(issue_id);
CREATE INDEX idx_comments_parent ON comments(parent_id) WHERE parent_id IS NOT NULL;

-- ============================================================
-- issue_status_history
-- ============================================================
CREATE TABLE issue_status_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id    UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    changed_by  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    old_status  issue_status,
    new_status  issue_status NOT NULL,
    note        TEXT,
    changed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_status_history_issue ON issue_status_history(issue_id);

-- ============================================================
-- issue_evidence
-- ============================================================
CREATE TABLE issue_evidence (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    issue_id    UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    evidence_type TEXT NOT NULL CHECK (evidence_type IN ('image', 'link', 'document')),
    url         TEXT NOT NULL,
    caption     TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_evidence_issue ON issue_evidence(issue_id);

-- ============================================================
-- Triggers – keep updated_at current
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_issues_updated_at
    BEFORE UPDATE ON issues FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_votes_updated_at
    BEFORE UPDATE ON votes FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_comments_updated_at
    BEFORE UPDATE ON comments FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- Trigger – maintain denormalised vote counts on issues
-- ============================================================
CREATE OR REPLACE FUNCTION sync_issue_vote_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_issue_id UUID;
BEGIN
    v_issue_id := COALESCE(NEW.issue_id, OLD.issue_id);
    UPDATE issues
    SET
        upvote_count   = (SELECT COUNT(*) FROM votes WHERE issue_id = v_issue_id AND vote = 'upvote'),
        downvote_count = (SELECT COUNT(*) FROM votes WHERE issue_id = v_issue_id AND vote = 'downvote'),
        score          = (SELECT COUNT(*) FILTER (WHERE vote = 'upvote')
                                - COUNT(*) FILTER (WHERE vote = 'downvote')
                          FROM votes WHERE issue_id = v_issue_id),
        updated_at     = NOW()
    WHERE id = v_issue_id;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_votes_sync_counts
    AFTER INSERT OR UPDATE OR DELETE ON votes
    FOR EACH ROW EXECUTE FUNCTION sync_issue_vote_counts();

-- ============================================================
-- Trigger – maintain comment_count on issues
-- ============================================================
CREATE OR REPLACE FUNCTION sync_issue_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
    v_issue_id UUID;
BEGIN
    v_issue_id := COALESCE(NEW.issue_id, OLD.issue_id);
    UPDATE issues
    SET comment_count = (SELECT COUNT(*) FROM comments WHERE issue_id = v_issue_id AND is_hidden = FALSE),
        updated_at = NOW()
    WHERE id = v_issue_id;
    RETURN NULL;
END;
$$;

CREATE TRIGGER trg_comments_sync_count
    AFTER INSERT OR UPDATE OR DELETE ON comments
    FOR EACH ROW EXECUTE FUNCTION sync_issue_comment_count();
