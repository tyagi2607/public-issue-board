import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { formatDistanceToNow, format } from "date-fns";
import type { IssueStatus } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function timeAgo(date: string) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDate(date: string) {
  return format(new Date(date), "MMM d, yyyy");
}

export function formatDateTime(date: string) {
  return format(new Date(date), "MMM d, yyyy 'at' h:mm a");
}

export const statusConfig: Record<
  IssueStatus,
  { label: string; color: string; bg: string }
> = {
  open:        { label: "Open",        color: "text-blue-700",   bg: "bg-blue-100" },
  in_progress: { label: "In Progress", color: "text-yellow-700", bg: "bg-yellow-100" },
  resolved:    { label: "Resolved",    color: "text-green-700",  bg: "bg-green-100" },
  closed:      { label: "Closed",      color: "text-gray-700",   bg: "bg-gray-100" },
};

export function getStatusBadge(status: IssueStatus) {
  return statusConfig[status] ?? { label: status, color: "text-gray-700", bg: "bg-gray-100" };
}
