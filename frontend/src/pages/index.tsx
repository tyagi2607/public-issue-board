import { useState } from "react";
import { useQuery } from "react-query";
import Head from "next/head";
import Link from "next/link";
import { Plus, Filter } from "lucide-react";
import { issuesApi, metaApi } from "@/lib/apiClient";
import { IssueCard } from "@/components/IssueCard";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/FormFields";
import { Input } from "@/components/ui/FormFields";
import type { IssueFilters, IssueStatus } from "@/types";

export default function IssuesPage() {
  const [filters, setFilters] = useState<IssueFilters>({
    page: 1,
    page_size: 20,
    sort_by: "score",
  });

  const { data, isLoading } = useQuery(
    ["issues", filters],
    () => issuesApi.list(filters).then((r) => r.data),
    { keepPreviousData: true }
  );

  const { data: categories } = useQuery("categories", () =>
    metaApi.categories().then((r) => r.data)
  );

  const { data: jurisdictions } = useQuery("jurisdictions", () =>
    metaApi.jurisdictions().then((r) => r.data)
  );

  const update = (patch: Partial<IssueFilters>) =>
    setFilters((f) => ({ ...f, ...patch, page: 1 }));

  return (
    <>
      <Head>
        <title>Public Issues | PublicBoard</title>
      </Head>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Public Issues</h1>
            <p className="mt-1 text-sm text-gray-500">
              {data ? `${data.total} issues reported` : "Loading issues…"}
            </p>
          </div>
          <Link href="/issues/new">
            <Button>
              <Plus className="h-4 w-4" />
              Report Issue
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 mb-3 text-sm font-medium text-gray-700">
            <Filter className="h-4 w-4" />
            Filters
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Select
              label="Status"
              options={[
                { value: "open", label: "Open" },
                { value: "in_progress", label: "In Progress" },
                { value: "resolved", label: "Resolved" },
                { value: "closed", label: "Closed" },
              ]}
              placeholder="All statuses"
              value={filters.status ?? ""}
              onChange={(e) =>
                update({ status: (e.target.value as IssueStatus) || undefined })
              }
            />
            <Select
              label="Category"
              options={(categories ?? []).map((c) => ({ value: c.id, label: c.name }))}
              placeholder="All categories"
              value={filters.category_id ?? ""}
              onChange={(e) =>
                update({ category_id: e.target.value ? Number(e.target.value) : undefined })
              }
            />
            <Select
              label="Jurisdiction"
              options={(jurisdictions ?? []).map((j) => ({ value: j.id, label: j.name }))}
              placeholder="All jurisdictions"
              value={filters.jurisdiction_id ?? ""}
              onChange={(e) =>
                update({ jurisdiction_id: e.target.value ? Number(e.target.value) : undefined })
              }
            />
            <Select
              label="Sort by"
              options={[
                { value: "score", label: "Top Score" },
                { value: "created_at", label: "Newest" },
                { value: "comment_count", label: "Most Discussed" },
              ]}
              value={filters.sort_by ?? "score"}
              onChange={(e) =>
                update({ sort_by: e.target.value as IssueFilters["sort_by"] })
              }
            />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Input
              label="City"
              placeholder="Filter by city…"
              value={filters.city ?? ""}
              onChange={(e) => update({ city: e.target.value || undefined })}
            />
            <Input
              label="Province"
              placeholder="Filter by province…"
              value={filters.province ?? ""}
              onChange={(e) => update({ province: e.target.value || undefined })}
            />
          </div>
        </div>

        {/* Issue list */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-lg bg-gray-200" />
            ))}
          </div>
        ) : data?.items.length === 0 ? (
          <div className="py-20 text-center text-gray-500">
            <p className="text-lg font-medium">No issues found</p>
            <p className="mt-1 text-sm">Try adjusting your filters or be the first to report one!</p>
            <Link href="/issues/new" className="mt-4 inline-block">
              <Button>Report an issue</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {data?.items.map((issue) => (
              <IssueCard key={issue.id} issue={issue} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data && data.total_pages > 1 && (
          <div className="mt-6 flex items-center justify-between">
            <Button
              variant="outline"
              disabled={filters.page === 1}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) - 1 }))}
            >
              Previous
            </Button>
            <span className="text-sm text-gray-600">
              Page {data.page} of {data.total_pages}
            </span>
            <Button
              variant="outline"
              disabled={filters.page === data.total_pages}
              onClick={() => setFilters((f) => ({ ...f, page: (f.page ?? 1) + 1 }))}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
