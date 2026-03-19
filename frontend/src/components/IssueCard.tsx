import Link from "next/link";
import { MessageSquare, MapPin, ArrowUp, ArrowDown } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { timeAgo, getStatusBadge } from "@/lib/utils";
import type { IssueSummary } from "@/types";

interface Props {
  issue: IssueSummary;
}

const statusVariant: Record<string, "default" | "info" | "warning" | "success" | "error"> = {
  open:        "info",
  in_progress: "warning",
  resolved:    "success",
  closed:      "default",
};

export function IssueCard({ issue }: Props) {
  const status = getStatusBadge(issue.status);

  return (
    <Link href={`/issues/${issue.id}`}>
      <Card className="p-5 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex items-start gap-4">
          {/* Vote count */}
          <div className="flex flex-col items-center min-w-[48px]">
            <span className="text-lg font-bold text-gray-900">{issue.score}</span>
            <span className="text-xs text-gray-500">score</span>
            <div className="mt-1 flex gap-1 text-xs text-gray-400">
              <span className="flex items-center gap-0.5">
                <ArrowUp className="h-3 w-3 text-green-500" /> {issue.upvote_count}
              </span>
              <span className="flex items-center gap-0.5">
                <ArrowDown className="h-3 w-3 text-red-500" /> {issue.downvote_count}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <Badge variant={statusVariant[issue.status] ?? "default"}>
                {status.label}
              </Badge>
              <span
                className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                style={{ backgroundColor: issue.category.color + "22", color: issue.category.color }}
              >
                {issue.category.icon} {issue.category.name}
              </span>
              <span className="text-xs text-gray-500 capitalize">
                {issue.jurisdiction.level}
              </span>
            </div>

            <h3 className="text-base font-semibold text-gray-900 truncate">{issue.title}</h3>

            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-gray-500">
              {(issue.city || issue.province) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {[issue.city, issue.province].filter(Boolean).join(", ")}
                </span>
              )}
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {issue.comment_count} comments
              </span>
              <span>{timeAgo(issue.created_at)}</span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
}
