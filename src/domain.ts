import type { Policy, PrivacyRequest, RequestType } from "./types";

export function hasDeletionConflict(
  accessRequest: PrivacyRequest,
  requests: PrivacyRequest[],
): boolean {
  if (accessRequest.request_type !== "access" || !accessRequest.email) return false;
  const email = accessRequest.email.trim().toLocaleLowerCase();
  return requests.some(
    (request) =>
      request.id !== accessRequest.id &&
      request.request_type === "deletion" &&
      (request.status === "pending" || request.status === "in_progress") &&
      request.email?.trim().toLocaleLowerCase() === email,
  );
}

export function getDaysRemaining(
  request: PrivacyRequest,
  policies: Policy[],
  now = new Date(),
): number | null {
  if (!request.submitted_at) return null;
  const submittedAt = new Date(request.submitted_at);
  if (Number.isNaN(submittedAt.getTime())) return null;
  const policy = policies.find((item) => item.id === request.policy_id);
  if (!policy) return null;
  const dueAt = submittedAt.getTime() + policy.deadline_days * 24 * 60 * 60 * 1000;
  return Math.ceil((dueAt - now.getTime()) / (24 * 60 * 60 * 1000));
}

export function getPolicyForType(
  policies: Policy[],
  requestType: RequestType,
): Policy | undefined {
  return policies.find((policy) => policy.request_type === requestType);
}

export function formatDate(date: string | null): string {
  if (!date) return "Not provided";
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return "Invalid date";
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsedDate);
}
