import { describe, expect, it } from "vitest";
import { formatDate, getDaysRemaining, hasDeletionConflict } from "./domain";
import type { Policy, PrivacyRequest } from "./types";

const accessRequest: PrivacyRequest = {
  id: "access-1",
  name: "Alex",
  email: "Alex@example.com",
  request_type: "access",
  status: "pending",
  submitted_at: "2025-01-01T00:00:00.000Z",
  assigned_to: null,
  policy_id: "policy-1",
};

function deletion(status: PrivacyRequest["status"], email = "alex@example.com"): PrivacyRequest {
  return {
    ...accessRequest,
    id: `deletion-${status}`,
    email,
    request_type: "deletion",
    status,
  };
}

describe("hasDeletionConflict", () => {
  it("blocks access approval for a case-insensitive email with an active deletion", () => {
    expect(hasDeletionConflict(accessRequest, [accessRequest, deletion("in_progress")])).toBe(true);
  });

  it("does not block when the deletion is resolved or belongs to another email", () => {
    expect(hasDeletionConflict(accessRequest, [deletion("approved")])).toBe(false);
    expect(hasDeletionConflict(accessRequest, [deletion("pending", "someone-else@example.com")])).toBe(false);
  });

  it("does not apply the deletion rule to non-access requests or missing email", () => {
    expect(hasDeletionConflict({ ...accessRequest, request_type: "portability" }, [deletion("pending")])).toBe(false);
    expect(hasDeletionConflict({ ...accessRequest, email: null }, [deletion("pending")])).toBe(false);
  });
});

describe("request metadata helpers", () => {
  const policy: Policy = {
    id: "policy-1",
    name: "Access policy",
    request_type: "access",
    deadline_days: 30,
  };

  it("calculates remaining whole days and tolerates missing or invalid values", () => {
    const now = new Date("2025-01-21T00:00:00.000Z");
    expect(getDaysRemaining(accessRequest, [policy], now)).toBe(10);
    expect(getDaysRemaining({ ...accessRequest, policy_id: null }, [policy], now)).toBeNull();
    expect(getDaysRemaining({ ...accessRequest, submitted_at: "not-a-date" }, [policy], now)).toBeNull();
  });

  it("formats absent and invalid dates without throwing", () => {
    expect(formatDate(null)).toBe("Not provided");
    expect(formatDate("not-a-date")).toBe("Invalid date");
  });
});
