// ── Shared enums ──────────────────────────────────────
export type UserRole = "citizen" | "moderator" | "admin";
export type IssueStatus = "open" | "in_progress" | "resolved" | "closed";
export type JurisdictionLevel = "federal" | "provincial" | "municipal";
export type VoteType = "upvote" | "downvote";
export type EvidenceType = "image" | "link" | "document";

// ── User ──────────────────────────────────────────────
export interface User {
  id: string;
  email: string;
  username: string;
  full_name: string | null;
  role: UserRole;
  is_active: boolean;
  avatar_url: string | null;
  created_at: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

// ── Category ──────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string;
}

// ── Jurisdiction ──────────────────────────────────────
export interface Jurisdiction {
  id: number;
  name: string;
  level: JurisdictionLevel;
  country: string;
  province: string | null;
}

// ── Government Body ───────────────────────────────────
export interface GovernmentBody {
  id: number;
  name: string;
  jurisdiction_id: number;
  website: string | null;
  contact_email: string | null;
}

// ── Evidence ──────────────────────────────────────────
export interface Evidence {
  id: string;
  evidence_type: EvidenceType;
  url: string;
  caption: string | null;
  uploaded_by: string;
  created_at: string;
}

// ── Comment ───────────────────────────────────────────
export interface Comment {
  id: string;
  issue_id: string;
  author_id: string;
  parent_id: string | null;
  body: string;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
  author: User;
}

// ── Status History ────────────────────────────────────
export interface StatusHistory {
  id: string;
  issue_id: string;
  changed_by: string;
  old_status: IssueStatus | null;
  new_status: IssueStatus;
  note: string | null;
  changed_at: string;
}

// ── Issue ─────────────────────────────────────────────
export interface IssueSummary {
  id: string;
  title: string;
  status: IssueStatus;
  category: Category;
  jurisdiction: Jurisdiction;
  author_id: string;
  city: string | null;
  province: string | null;
  upvote_count: number;
  downvote_count: number;
  score: number;
  comment_count: number;
  opened_at: string;
  resolved_at: string | null;
  created_at: string;
}

export interface IssueDetail extends IssueSummary {
  description: string;
  government_body: GovernmentBody | null;
  address: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  is_hidden: boolean;
  duplicate_of: string | null;
  moderator_note: string | null;
  updated_at: string;
  author: User;
  evidence: Evidence[];
  status_history: StatusHistory[];
}

export interface IssueListResponse {
  items: IssueSummary[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ── Dashboard ─────────────────────────────────────────
export interface DashboardStats {
  total_issues: number;
  open_issues: number;
  in_progress_issues: number;
  resolved_issues: number;
  closed_issues: number;
  avg_resolution_hours: number | null;
}

// ── Filters ───────────────────────────────────────────
export interface IssueFilters {
  status?: IssueStatus;
  category_id?: number;
  jurisdiction_id?: number;
  city?: string;
  province?: string;
  sort_by?: "score" | "created_at" | "comment_count";
  page?: number;
  page_size?: number;
}
