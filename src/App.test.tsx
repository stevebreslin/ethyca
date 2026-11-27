import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import type { Policy, PrivacyRequest } from "./types";

const api = vi.hoisted(() => ({
  getRequests: vi.fn(),
  getPolicies: vi.fn(),
  updateRequestStatus: vi.fn(),
  createRequest: vi.fn(),
}));

vi.mock("./api", () => api);

const requests: PrivacyRequest[] = [
  {
    id: "req-access",
    name: "Alex Example",
    email: "alex@example.com",
    request_type: "access",
    status: "pending",
    submitted_at: "2025-03-01T12:00:00.000Z",
    assigned_to: null,
    policy_id: "pol-access",
  },
  {
    id: "req-delete",
    name: "Alex Example",
    email: "ALEX@example.com",
    request_type: "deletion",
    status: "in_progress",
    submitted_at: "2025-03-02T12:00:00.000Z",
    assigned_to: "reviewer@example.com",
    policy_id: "pol-delete",
  },
  {
    id: "req-resolved",
    name: "Jordan Example",
    email: "jordan@example.com",
    request_type: "deletion",
    status: "approved",
    submitted_at: "2025-03-03T12:00:00.000Z",
    assigned_to: "reviewer@example.com",
    policy_id: "pol-delete",
  },
];

const policies: Policy[] = [
  { id: "pol-access", name: "Access policy", request_type: "access", deadline_days: 30 },
  { id: "pol-delete", name: "Deletion policy", request_type: "deletion", deadline_days: 45 },
];

describe("privacy request dashboard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    window.localStorage.clear();
    api.getRequests.mockResolvedValue(requests);
    api.getPolicies.mockResolvedValue(policies);
    api.updateRequestStatus.mockImplementation(async (id: string, status: string) => ({
      ...requests[0],
      id,
      status,
    }));
  });

  it("surfaces and prevents approval while a matching active deletion exists", async () => {
    render(<App />);

    expect(await screen.findByText("Related deletion request")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^approve$/i })).toBeDisabled();
    expect(api.updateRequestStatus).not.toHaveBeenCalled();
  });

  it("allows denial despite the access/deletion conflict", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText("Related deletion request");
    await user.click(screen.getByRole("button", { name: /deny request/i }));

    await waitFor(() => expect(api.updateRequestStatus).toHaveBeenCalledWith("req-access", "denied"));
    expect(await screen.findByText("Request denied.")).toBeInTheDocument();
  });

  it("submits a new request and selects it for review", async () => {
    const user = userEvent.setup();
    const createdRequest: PrivacyRequest = {
      id: "req-new",
      name: "Casey Example",
      email: "casey@example.com",
      request_type: "access",
      status: "pending",
      submitted_at: "2025-03-04T12:00:00.000Z",
      assigned_to: null,
      policy_id: "pol-access",
    };
    api.createRequest.mockResolvedValue(createdRequest);
    render(<App />);

    await screen.findByText("Related deletion request");
    await user.click(screen.getByRole("button", { name: /new request/i }));
    await user.type(screen.getByLabelText("Full name"), "Casey Example");
    await user.type(screen.getByLabelText("Email address"), "casey@example.com");
    await user.click(screen.getByRole("button", { name: /submit request/i }));

    await waitFor(() => expect(api.createRequest).toHaveBeenCalledWith(expect.objectContaining({
      name: "Casey Example",
      email: "casey@example.com",
      request_type: "access",
      policy_id: "pol-access",
    })));
    expect(await screen.findByText("New privacy request submitted.")).toBeInTheDocument();
    expect(screen.getAllByText("Casey Example").length).toBeGreaterThan(0);
  });

  it("switches themes and remembers the selection", async () => {
    const user = userEvent.setup();
    render(<App />);

    const themeButton = screen.getByRole("button", { name: "Switch to light theme" });
    expect(themeButton).toHaveAttribute("title", "Switch to light theme");
    await user.click(themeButton);

    expect(document.querySelector(".app-shell")).toHaveAttribute("data-theme", "light");
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toHaveAttribute("aria-pressed", "true");
    expect(window.localStorage.getItem("ethyca-theme")).toBe("light");
  });

  it("keeps the summary cards informational rather than interactive", async () => {
    render(<App />);

    await screen.findByText("Related deletion request");

    expect(screen.getByText("Total requests")).toBeInTheDocument();
    expect(screen.getByText("Needs attention")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /total requests/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /needs attention/i })).not.toBeInTheDocument();
    expect(document.querySelectorAll(".request-row")).toHaveLength(3);
  });

  it("shows status and request type filters in the table filter summary", async () => {
    const user = userEvent.setup();
    render(<App />);

    await screen.findByText("Related deletion request");
    await user.selectOptions(screen.getByLabelText("Filter by status"), "approved");
    await user.selectOptions(screen.getByLabelText("Filter by request type"), "deletion");

    expect(screen.getByText("Approved · Data deletion")).toBeInTheDocument();
    expect(document.querySelectorAll(".request-row")).toHaveLength(1);

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(screen.queryByText("Filtered")).not.toBeInTheDocument();
    expect(document.querySelectorAll(".request-row")).toHaveLength(3);
  });

  it("paginates the request queue and resets to the first page when filters change", async () => {
    const user = userEvent.setup();
    const pagedRequests = Array.from({ length: 23 }, (_, index) => ({
      ...requests[0],
      id: `req-page-${index + 1}`,
      name: `Person ${index + 1}`,
      email: `person${index + 1}@example.com`,
      submitted_at: "2025-03-01T12:00:00.000Z",
    }));
    api.getRequests.mockResolvedValue(pagedRequests);
    render(<App />);

    await waitFor(() => expect(document.querySelectorAll(".request-row")).toHaveLength(10));
    expect(document.querySelectorAll(".request-row")).toHaveLength(10);
    expect(screen.getByText("Showing 1–10 of 23 requests")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next page" })).toHaveAttribute("title", "Next page");

    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Showing 11–20 of 23 requests")).toBeInTheDocument();
    expect(document.querySelectorAll(".request-row")[0].textContent).toContain("Person 11");

    await user.selectOptions(screen.getByLabelText("Filter by status"), "pending");
    expect(screen.getByText("Showing 1–10 of 23 requests")).toBeInTheDocument();
    expect(screen.getByText("Page 1 of 3")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Next page" }));
    await user.click(screen.getByRole("button", { name: "Next page" }));
    expect(screen.getByText("Showing 21–23 of 23 requests")).toBeInTheDocument();
    expect(document.querySelectorAll(".request-row")).toHaveLength(3);
    expect(screen.getByRole("button", { name: "Next page" })).toBeDisabled();
  });

  it("provides full-value tooltips for request text that can be truncated", async () => {
    const longName = "Alexandra Example Person With A Very Long Name";
    const longEmail = "alexandra.example.person.with.a.long.address@example-company.test";
    api.getRequests.mockResolvedValue([{
      ...requests[0],
      name: longName,
      email: longEmail,
      id: "request-with-a-long-identifier",
      request_type: "portability",
    }]);
    render(<App />);

    await waitFor(() => expect(document.querySelector(".request-row")).toBeInTheDocument());
    const row = document.querySelector(".request-row");
    expect(row?.querySelector(".row-person")?.getAttribute("title")).toBe(longName);
    expect(row?.querySelector(".row-email")?.getAttribute("title")).toBe(longEmail);
    expect(row?.querySelector(".row-meta")?.getAttribute("title")).toBe("request-with-a-long-identifier · Data export");
    expect(row?.querySelector(".request-type-icon")?.getAttribute("title")).toBe("Data export request");
  });
});
