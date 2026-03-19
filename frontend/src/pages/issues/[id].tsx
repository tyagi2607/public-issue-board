import { useState } from "react";
import { useRouter } from "next/router";
import { useQuery, useMutation, useQueryClient } from "react-query";
import Head from "next/head";
import Link from "next/link";
import {
  ArrowUp, ArrowDown, MapPin, Clock, MessageSquare,
  ExternalLink, ChevronLeft, Image as ImageIcon, Link2
} from "lucide-react";
import { issuesApi, votesApi, commentsApi } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/FormFields";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { getStatusBadge, timeAgo, formatDateTime } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import type { IssueStatus } from "@/types";

const statusVariant: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
  open:        "info",
  in_progress: "warning",
  resolved:    "success",
  closed:      "default",
};

export default function IssueDetailPage() {
  const router = useRouter();
  const { id } = router.query as { id: string };
  const { user } = useAuth();
  const qc = useQueryClient();
  const [commentBody, setCommentBody] = useState("");

  const { data: issue, isLoading } = useQuery(
    ["issue", id],
    () => issuesApi.get(id).then((r) => r.data),
    { enabled: !!id }
  );

  const { data: comments = [], isLoading: commentsLoading } = useQuery(
    ["comments", id],
    () => commentsApi.list(id).then((r) => r.data),
    { enabled: !!id }
  );

  const voteMutation = useMutation(
    (vote: "upvote" | "downvote") => votesApi.cast(id, vote),
    {
      onSuccess: () => qc.invalidateQueries(["issue", id]),
    }
  );

  const commentMutation = useMutation(
    (body: string) => commentsApi.create(id, body),
    {
      onSuccess: () => {
        setCommentBody("");
        qc.invalidateQueries(["comments", id]);
        qc.invalidateQueries(["issue", id]);
      },
    }
  );

  if (isLoading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 w-3/4 rounded bg-gray-200" />
          <div className="h-4 w-1/2 rounded bg-gray-200" />
          <div className="h-48 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-gray-600">Issue not found.</p>
        <Link href="/" className="mt-4 inline-block text-blue-600 hover:underline">
          ← Back to issues
        </Link>
      </div>
    );
  }

  const statusBadge = getStatusBadge(issue.status as IssueStatus);

  return (
    <>
      <Head>
        <title>{issue.title} | PublicBoard</title>
      </Head>
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* Back */}
        <Link
          href="/"
          className="mb-4 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
        >
          <ChevronLeft className="h-4 w-4" /> Back to issues
        </Link>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title & status */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge variant={statusVariant[issue.status] ?? "default"}>
                    {statusBadge.label}
                  </Badge>
                  <span
                    className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                    style={{
                      backgroundColor: issue.category.color + "22",
                      color: issue.category.color,
                    }}
                  >
                    {issue.category.icon} {issue.category.name}
                  </span>
                </div>
                <h1 className="text-xl font-bold text-gray-900">{issue.title}</h1>
                <p className="mt-1 text-xs text-gray-500">
                  Reported by <strong>{issue.author.username}</strong> {timeAgo(issue.created_at)}
                </p>

                <div className="mt-4 text-sm text-gray-700 whitespace-pre-line leading-relaxed">
                  {issue.description}
                </div>
              </CardContent>
            </Card>

            {/* Voting */}
            <Card>
              <CardContent className="flex items-center gap-4 py-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => voteMutation.mutate("upvote")}
                  disabled={!user}
                  isLoading={voteMutation.isLoading}
                >
                  <ArrowUp className="h-4 w-4 text-green-600" />
                  Upvote ({issue.upvote_count})
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => voteMutation.mutate("downvote")}
                  disabled={!user}
                  isLoading={voteMutation.isLoading}
                >
                  <ArrowDown className="h-4 w-4 text-red-600" />
                  Downvote ({issue.downvote_count})
                </Button>
                <span className="text-sm font-medium text-gray-700">
                  Score: {issue.score}
                </span>
                {!user && (
                  <span className="text-xs text-gray-400">
                    <Link href="/login" className="text-blue-600 hover:underline">
                      Sign in
                    </Link>{" "}
                    to vote
                  </span>
                )}
              </CardContent>
            </Card>

            {/* Evidence */}
            {issue.evidence.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-sm font-semibold text-gray-800">Evidence</h2>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {issue.evidence.map((ev) => (
                      <a
                        key={ev.id}
                        href={ev.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-md border border-gray-200 p-3 text-sm hover:bg-gray-50"
                      >
                        {ev.evidence_type === "image" ? (
                          <ImageIcon className="h-4 w-4 text-blue-500" />
                        ) : (
                          <Link2 className="h-4 w-4 text-blue-500" />
                        )}
                        <span className="truncate">{ev.caption || ev.url}</span>
                        <ExternalLink className="ml-auto h-3 w-3 text-gray-400" />
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Comments */}
            <Card>
              <CardHeader>
                <h2 className="text-sm font-semibold text-gray-800">
                  Comments ({comments.length})
                </h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {commentsLoading ? (
                  <div className="h-20 animate-pulse rounded bg-gray-200" />
                ) : comments.length === 0 ? (
                  <p className="text-sm text-gray-500">
                    No comments yet. Be the first to comment!
                  </p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="border-b border-gray-100 pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-800">
                          {c.author.username}
                        </span>
                        <span className="text-xs text-gray-400">{timeAgo(c.created_at)}</span>
                      </div>
                      <p className="text-sm text-gray-700">{c.body}</p>
                    </div>
                  ))
                )}

                {/* Add comment */}
                {user ? (
                  <div className="mt-4 space-y-3">
                    <Textarea
                      label="Add a comment"
                      placeholder="Share your thoughts…"
                      rows={3}
                      value={commentBody}
                      onChange={(e) => setCommentBody(e.target.value)}
                    />
                    <Button
                      size="sm"
                      onClick={() => commentMutation.mutate(commentBody)}
                      disabled={!commentBody.trim()}
                      isLoading={commentMutation.isLoading}
                    >
                      <MessageSquare className="h-4 w-4" />
                      Post Comment
                    </Button>
                  </div>
                ) : (
                  <p className="mt-4 text-sm text-gray-500">
                    <Link href="/login" className="text-blue-600 hover:underline">
                      Sign in
                    </Link>{" "}
                    to leave a comment.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Meta */}
            <Card>
              <CardContent className="space-y-3 text-sm py-5">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Status</p>
                  <Badge variant={statusVariant[issue.status] ?? "default"}>
                    {statusBadge.label}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Jurisdiction</p>
                  <p className="text-gray-700">{issue.jurisdiction.name}</p>
                  <p className="text-xs text-gray-400 capitalize">{issue.jurisdiction.level}</p>
                </div>
                {issue.government_body && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-400 mb-1">
                      Government Body
                    </p>
                    <p className="text-gray-700">{issue.government_body.name}</p>
                  </div>
                )}
                {(issue.address || issue.city) && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Location</p>
                    <p className="flex items-center gap-1 text-gray-700">
                      <MapPin className="h-3 w-3" />
                      {[issue.address, issue.city, issue.province].filter(Boolean).join(", ")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Opened</p>
                  <p className="flex items-center gap-1 text-gray-700">
                    <Clock className="h-3 w-3" />
                    {formatDateTime(issue.opened_at)}
                  </p>
                </div>
                {issue.resolved_at && (
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-400 mb-1">Resolved</p>
                    <p className="text-gray-700">{formatDateTime(issue.resolved_at)}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status History */}
            {issue.status_history.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="text-xs font-semibold uppercase text-gray-500">Status History</h2>
                </CardHeader>
                <CardContent className="space-y-2 py-3">
                  {issue.status_history.map((h) => (
                    <div key={h.id} className="text-xs">
                      <span className="font-medium text-gray-700 capitalize">
                        {h.new_status.replace("_", " ")}
                      </span>
                      <span className="text-gray-400"> · {timeAgo(h.changed_at)}</span>
                      {h.note && <p className="text-gray-500 mt-0.5">{h.note}</p>}
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
