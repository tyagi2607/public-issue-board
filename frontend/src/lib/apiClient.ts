import api from "./api";
import type {
  Token,
  User,
  IssueListResponse,
  IssueDetail,
  IssueSummary,
  Category,
  Jurisdiction,
  GovernmentBody,
  Comment,
  DashboardStats,
  IssueFilters,
} from "@/types";

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register: (data: { email: string; username: string; full_name?: string; password: string }) =>
    api.post<User>("/auth/register", data),

  login: (email: string, password: string) => {
    const form = new URLSearchParams();
    form.append("username", email);
    form.append("password", password);
    return api.post<Token>("/auth/token", form, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    });
  },

  me: () => api.get<User>("/auth/me"),
};

// ── Issues ────────────────────────────────────────────────────
export const issuesApi = {
  list: (filters: IssueFilters = {}) =>
    api.get<IssueListResponse>("/issues", { params: filters }),

  get: (id: string) => api.get<IssueDetail>(`/issues/${id}`),

  create: (data: {
    title: string;
    description: string;
    category_id: number;
    jurisdiction_id: number;
    government_body_id?: number;
    address?: string;
    city?: string;
    province?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    evidence?: Array<{ evidence_type: string; url: string; caption?: string }>;
  }) => api.post<IssueDetail>("/issues", data),

  updateStatus: (id: string, status: string, note?: string) =>
    api.patch<IssueDetail>(`/issues/${id}/status`, { status, note }),

  moderate: (
    id: string,
    data: { is_hidden?: boolean; duplicate_of?: string; moderator_note?: string }
  ) => api.patch<IssueDetail>(`/issues/${id}/moderate`, data),
};

// ── Votes ─────────────────────────────────────────────────────
export const votesApi = {
  cast: (issueId: string, vote: "upvote" | "downvote") =>
    api.post(`/issues/${issueId}/vote`, { vote }),

  remove: (issueId: string) => api.delete(`/issues/${issueId}/vote`),
};

// ── Comments ──────────────────────────────────────────────────
export const commentsApi = {
  list: (issueId: string) => api.get<Comment[]>(`/issues/${issueId}/comments`),

  create: (issueId: string, body: string, parentId?: string) =>
    api.post<Comment>(`/issues/${issueId}/comments`, { body, parent_id: parentId }),

  delete: (issueId: string, commentId: string) =>
    api.delete(`/issues/${issueId}/comments/${commentId}`),
};

// ── Metadata ──────────────────────────────────────────────────
export const metaApi = {
  categories: () => api.get<Category[]>("/categories"),
  jurisdictions: () => api.get<Jurisdiction[]>("/jurisdictions"),
  governmentBodies: (jurisdictionId?: number) =>
    api.get<GovernmentBody[]>("/government-bodies", {
      params: jurisdictionId ? { jurisdiction_id: jurisdictionId } : {},
    }),
};

// ── Dashboard ─────────────────────────────────────────────────
export const dashboardApi = {
  stats: () => api.get<DashboardStats>("/dashboard/stats"),
  topIssues: (limit = 10) =>
    api.get<IssueSummary[]>("/dashboard/top-issues", { params: { limit } }),
};
