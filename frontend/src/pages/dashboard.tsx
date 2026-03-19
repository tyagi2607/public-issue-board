import { useQuery } from "react-query";
import Head from "next/head";
import Link from "next/link";
import {
  BarChart3, CheckCircle2, Clock, AlertCircle, XCircle, TrendingUp
} from "lucide-react";
import { dashboardApi } from "@/lib/apiClient";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { IssueCard } from "@/components/IssueCard";
import { Badge } from "@/components/ui/Badge";

function StatCard({
  label,
  value,
  icon,
  variant = "default",
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "info" | "error";
}) {
  const colors = {
    default: "text-gray-600 bg-gray-100",
    success: "text-green-600 bg-green-100",
    warning: "text-yellow-600 bg-yellow-100",
    info:    "text-blue-600 bg-blue-100",
    error:   "text-red-600 bg-red-100",
  };
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className={`rounded-full p-3 ${colors[variant]}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery("stats", () =>
    dashboardApi.stats().then((r) => r.data)
  );
  const { data: topIssues, isLoading: issuesLoading } = useQuery("top-issues", () =>
    dashboardApi.topIssues(10).then((r) => r.data)
  );

  return (
    <>
      <Head>
        <title>Dashboard | PublicBoard</title>
      </Head>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Overview of all public issues and their status
          </p>
        </div>

        {/* Stats */}
        {statsLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6 mb-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 mb-8">
            <StatCard
              label="Total Issues"
              value={stats.total_issues}
              icon={<BarChart3 className="h-5 w-5" />}
            />
            <StatCard
              label="Open"
              value={stats.open_issues}
              icon={<AlertCircle className="h-5 w-5" />}
              variant="info"
            />
            <StatCard
              label="In Progress"
              value={stats.in_progress_issues}
              icon={<Clock className="h-5 w-5" />}
              variant="warning"
            />
            <StatCard
              label="Resolved"
              value={stats.resolved_issues}
              icon={<CheckCircle2 className="h-5 w-5" />}
              variant="success"
            />
            <StatCard
              label="Closed"
              value={stats.closed_issues}
              icon={<XCircle className="h-5 w-5" />}
            />
            <StatCard
              label="Avg Resolution"
              value={
                stats.avg_resolution_hours !== null
                  ? `${Math.round(stats.avg_resolution_hours)}h`
                  : "N/A"
              }
              icon={<TrendingUp className="h-5 w-5" />}
              variant="success"
            />
          </div>
        ) : null}

        {/* Resolution rate */}
        {stats && stats.total_issues > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700">Resolution Rate</h2>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex-1 bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-500 h-3 rounded-full transition-all"
                    style={{
                      width: `${Math.round(
                        ((stats.resolved_issues + stats.closed_issues) / stats.total_issues) * 100
                      )}%`,
                    }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700 whitespace-nowrap">
                  {Math.round(
                    ((stats.resolved_issues + stats.closed_issues) / stats.total_issues) * 100
                  )}
                  % resolved
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-blue-400 inline-block" />
                  Open: {stats.open_issues}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-yellow-400 inline-block" />
                  In Progress: {stats.in_progress_issues}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-green-400 inline-block" />
                  Resolved: {stats.resolved_issues}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full bg-gray-400 inline-block" />
                  Closed: {stats.closed_issues}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top issues */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Top Issues by Score
            </h2>
            <Link href="/" className="text-sm text-blue-600 hover:underline">
              View all →
            </Link>
          </div>

          {issuesLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-200" />
              ))}
            </div>
          ) : topIssues?.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              <p>No issues yet. Be the first to report one!</p>
              <Link href="/issues/new" className="mt-4 inline-block text-blue-600 hover:underline">
                Report an issue →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {topIssues?.map((issue) => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
