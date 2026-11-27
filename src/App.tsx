import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowDownToLine,
  Check,
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Clock3,
  FileText,
  Filter,
  Inbox,
  Moon,
  Plus,
  Search,
  Sun,
  UserRound,
  X,
} from "lucide-react";
import { createRequest, getPolicies, getRequests, updateRequestStatus } from "./api";
import {
  formatDate,
  getDaysRemaining,
  getPolicyForType,
  hasDeletionConflict,
} from "./domain";
import type {
  Policy,
  PrivacyRequest,
  RequestStatus,
  RequestType,
  ToastKind,
  ToastMessage,
} from "./types";

type StatusFilter = "all" | RequestStatus;
type TypeFilter = "all" | RequestType;
type Theme = "dark" | "light";
const PAGE_SIZE = 10;

function getSavedTheme(): Theme {
  try {
    return window.localStorage.getItem("ethyca-theme") === "light" ? "light" : "dark";
  } catch (error) {
    console.warn("Could not read the saved theme preference.", error);
    return "dark";
  }
}

const requestTypeLabels: Record<RequestType, string> = {
  access: "Data access",
  deletion: "Data deletion",
  portability: "Data export",
};

const statusLabels: Record<RequestStatus, string> = {
  pending: "Pending",
  in_progress: "In progress",
  approved: "Approved",
  denied: "Denied",
};

function App() {
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [showNewRequest, setShowNewRequest] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [theme, setTheme] = useState<Theme>(getSavedTheme);
  const toastSequence = useRef(0);

  const notify = (kind: ToastKind, message: string) => {
    const id = ++toastSequence.current;
    setToasts((current) => [...current, { id, kind, message }]);
  };

  const dismissToast = (id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    const timers = toasts
      .filter((toast) => toast.kind !== "error")
      .map((toast) => window.setTimeout(() => dismissToast(toast.id), 5000));
    return () => timers.forEach(window.clearTimeout);
  }, [toasts]);

  useEffect(() => {
    try {
      window.localStorage.setItem("ethyca-theme", theme);
    } catch (error) {
      console.warn("Could not save the theme preference.", error);
    }
  }, [theme]);

  useEffect(() => {
    let active = true;
    async function loadDashboard() {
      try {
        const [requestData, policyData] = await Promise.all([getRequests(), getPolicies()]);
        if (!active) return;
        setRequests(requestData);
        setPolicies(policyData);
        setSelectedId(requestData.find((request) => request.status === "pending")?.id ?? requestData[0]?.id ?? null);
        const missingPolicyCount = requestData.filter(
          (request) => !request.policy_id || !policyData.some((policy) => policy.id === request.policy_id),
        ).length;
        if (missingPolicyCount > 0) {
          notify("info", `${missingPolicyCount} request(s) have no matching policy; deadline details are unavailable.`);
        }
      } catch (error) {
        if (active) {
          notify("error", error instanceof Error ? error.message : "Unable to load privacy requests.");
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadDashboard();
    return () => {
      active = false;
    };
  }, []);

  const filteredRequests = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return requests
      .filter((request) => statusFilter === "all" || request.status === statusFilter)
      .filter((request) => typeFilter === "all" || request.request_type === typeFilter)
      .filter((request) => {
        if (!normalizedQuery) return true;
        return [request.name, request.email, request.id]
          .some((value) => value?.toLocaleLowerCase().includes(normalizedQuery));
      })
      .sort((a, b) => {
        const activeA = a.status === "pending" || a.status === "in_progress";
        const activeB = b.status === "pending" || b.status === "in_progress";
        if (activeA !== activeB) return activeA ? -1 : 1;
        return (b.submitted_at ?? "").localeCompare(a.submitted_at ?? "");
      });
  }, [query, requests, statusFilter, typeFilter]);

  const activeCount = requests.filter((request) => request.status === "pending" || request.status === "in_progress").length;
  const overdueCount = requests.filter(
    (request) =>
      (request.status === "pending" || request.status === "in_progress") &&
      (getDaysRemaining(request, policies) ?? 0) < 0,
  ).length;
  const activeFilterLabels = [
    statusFilter === "all" ? null : statusLabels[statusFilter],
    typeFilter === "all" ? null : requestTypeLabels[typeFilter],
    query.trim() ? `Search: ${query.trim()}` : null,
  ].filter((label): label is string => label !== null);
  const pageCount = Math.max(1, Math.ceil(filteredRequests.length / PAGE_SIZE));
  const visiblePage = Math.min(currentPage, pageCount);
  const pageStartIndex = (visiblePage - 1) * PAGE_SIZE;
  const firstResultIndex = filteredRequests.length === 0 ? 0 : pageStartIndex + 1;
  const lastResultIndex = Math.min(pageStartIndex + PAGE_SIZE, filteredRequests.length);
  const paginatedRequests = useMemo(
    () => filteredRequests.slice(pageStartIndex, pageStartIndex + PAGE_SIZE),
    [filteredRequests, pageStartIndex],
  );

  useEffect(() => {
    if (currentPage > pageCount) setCurrentPage(pageCount);
  }, [currentPage, pageCount]);

  useEffect(() => {
    if (paginatedRequests.length === 0) {
      if (selectedId !== null) setSelectedId(null);
    } else if (!paginatedRequests.some((request) => request.id === selectedId)) {
      setSelectedId(paginatedRequests[0].id);
    }
  }, [paginatedRequests, selectedId]);

  const selectedRequest = requests.find((request) => request.id === selectedId) ?? null;
  const conflict = selectedRequest ? hasDeletionConflict(selectedRequest, requests) : false;

  function clearFilters() {
    setStatusFilter("all");
    setTypeFilter("all");
    setQuery("");
    setCurrentPage(1);
  }

  async function handleAction(status: Extract<RequestStatus, "approved" | "denied">) {
    if (!selectedRequest || busy) return;
    if (status === "approved" && hasDeletionConflict(selectedRequest, requests)) {
      notify("warning", "Approval blocked: an active deletion request exists for this email address.");
      return;
    }
    setBusy(true);
    try {
      const updated = await updateRequestStatus(selectedRequest.id, status);
      setRequests((current) => current.map((request) => request.id === updated.id ? updated : request));
      notify("success", `Request ${status === "approved" ? "approved" : "denied"}.`);
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Could not update this request.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateRequest(
    values: { name: string; email: string; requestType: RequestType },
  ) {
    const policy = getPolicyForType(policies, values.requestType);
    setBusy(true);
    try {
      const created = await createRequest({
        name: values.name.trim(),
        email: values.email.trim(),
        request_type: values.requestType,
        status: "pending",
        submitted_at: new Date().toISOString(),
        assigned_to: null,
        policy_id: policy?.id ?? null,
      });
      setRequests((current) => [created, ...current]);
      setSelectedId(created.id);
      setStatusFilter("all");
      setTypeFilter("all");
      setQuery("");
      setCurrentPage(1);
      setShowNewRequest(false);
      notify("success", "New privacy request submitted.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Could not submit the request.");
      throw error;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="app-shell" data-theme={theme}>
      <header className="topbar">
        <div className="brand" aria-label="Ethyca">
          <svg className="brand-mark" viewBox="0 0 330 212" aria-hidden="true">
            <path d="M118.338 0H87.23V84.7989H118.338V0ZM242.924 127.201H211.816V212H242.924V127.201ZM146.273 212H183.882L124.559 126.96V180.869L146.273 212ZM81.0095 180.864V126.955L21.714 211.995H59.323L81.004 180.864H81.0095ZM249.15 31.131V85.0399L308.44 0H270.858L249.145 31.131H249.15ZM205.596 31.131L183.882 0H146.273L205.596 85.0399V31.131ZM205.568 90.8549H124.564V121.14H205.568V90.8549ZM330 90.8549H248.996V121.14H330V90.8549ZM81.0095 90.8549H0V121.14H81.0095V90.8549Z" />
          </svg>
          <span>ethyca</span>
        </div>
        <div className="topbar-right">
          <button
            className="theme-toggle"
            type="button"
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            aria-pressed={theme === "light"}
            title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
            onClick={() => setTheme((current) => current === "dark" ? "light" : "dark")}
          >
            {theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}
          </button>
          <div className="user-avatar" aria-label="Signed in as Alex Morgan">AM</div>
        </div>
      </header>

      <main className="dashboard">
        <section className="page-heading">
          <div>
            <div className="eyebrow">OPERATIONS / REQUESTS</div>
            <h1>Privacy requests</h1>
            <p>Review and manage requests from people exercising their privacy rights.</p>
          </div>
          <button className="btn btn-primary new-request-button" onClick={() => setShowNewRequest(true)}>
            <Plus size={17} /> New request
          </button>
        </section>

        <section className="metrics" aria-label="Request summary">
          <Metric
            icon={<Inbox size={17} />}
            label="Total requests"
            value={requests.length}
            tone="mint"
          />
          <Metric
            icon={<Clock3 size={17} />}
            label="Needs attention"
            value={activeCount}
            tone="blue"
          />
          <Metric
            icon={<AlertTriangle size={17} />}
            label="Past deadline"
            value={overdueCount}
            tone="amber"
          />
        </section>

        <section className="workspace">
          <div className="request-list-panel">
            <div className="list-heading">
              <div>
                <h2>All requests <span className="count-badge">{filteredRequests.length}</span></h2>
                <p>Prioritized by active status and submission date</p>
              </div>
            </div>
            <div className="list-controls">
              <label className="search-field">
                <Search size={16} aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search name, email or ID"
                  aria-label="Search requests"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value);
                    setCurrentPage(1);
                  }}
                />
              </label>
              <label className="select-field">
                <span className="visually-hidden">Filter by status</span>
                <select value={statusFilter} onChange={(event) => {
                  setStatusFilter(event.target.value as StatusFilter);
                  setCurrentPage(1);
                }}>
                  <option value="all">All statuses</option>
                  {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <ChevronDown size={14} />
              </label>
              <label className="select-field type-select">
                <span className="visually-hidden">Filter by request type</span>
                <select value={typeFilter} onChange={(event) => {
                  setTypeFilter(event.target.value as TypeFilter);
                  setCurrentPage(1);
                }}>
                  <option value="all">All types</option>
                  {Object.entries(requestTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                </select>
                <ChevronDown size={14} />
              </label>
            </div>
            {activeFilterLabels.length > 0 && (
              <div className="active-filter-summary" aria-live="polite">
                <span className="filter-summary-title"><Filter size={13} /> Filtered</span>
                <span className="filter-summary-values" title={activeFilterLabels.join(" · ")}>
                  {activeFilterLabels.join(" · ")}
                </span>
                <button className="clear-filters-button" onClick={clearFilters}>Clear</button>
              </div>
            )}

            <div className="request-list" aria-label="Privacy requests">
              {loading ? (
                <div className="list-message"><span className="spinner-border spinner-border-sm" /> Loading requests…</div>
              ) : filteredRequests.length === 0 ? (
                <div className="empty-state">
                  <Inbox size={25} />
                  <strong>{requests.length ? "No matching requests" : "No requests available"}</strong>
                  <span>{requests.length ? "Try changing the search or filters." : "Check the API connection and try again."}</span>
                </div>
              ) : paginatedRequests.map((request) => (
                <RequestRow
                  key={request.id}
                  request={request}
                  policy={policies.find((policy) => policy.id === request.policy_id)}
                  selected={selectedId === request.id}
                  conflict={hasDeletionConflict(request, requests)}
                  onSelect={() => setSelectedId(request.id)}
                />
              ))}
            </div>
            <div className="list-footer">
              <span>{loading ? " " : `Showing ${firstResultIndex}–${lastResultIndex} of ${filteredRequests.length} requests`}</span>
              {pageCount > 1 && (
                <nav className="pagination-controls" aria-label="Request pagination">
                  <button
                    type="button"
                    aria-label="Previous page"
                    title="Previous page"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((page) => page - 1)}
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span aria-live="polite">Page {visiblePage} of {pageCount}</span>
                  <button
                    type="button"
                    aria-label="Next page"
                    title="Next page"
                    disabled={currentPage === pageCount}
                    onClick={() => setCurrentPage((page) => page + 1)}
                  >
                    <ChevronRight size={14} />
                  </button>
                </nav>
              )}
            </div>
          </div>

          <aside className="detail-panel" aria-label="Request details">
            {selectedRequest ? (
              <RequestDetail
                request={selectedRequest}
                policy={policies.find((policy) => policy.id === selectedRequest.policy_id)}
                conflict={conflict}
                busy={busy}
                onAction={handleAction}
              />
            ) : (
              <div className="detail-empty">
                <FileText size={28} />
                <strong>Select a request</strong>
                <span>Choose a request from the list to review its details.</span>
              </div>
            )}
          </aside>
        </section>
      </main>

      {showNewRequest && (
        <NewRequestDialog onClose={() => setShowNewRequest(false)} onSubmit={handleCreateRequest} busy={busy} />
      )}
      <div className="toast-stack" aria-live="polite">
        {toasts.map((toast) => (
          <Toast key={toast.id} toast={toast} onDismiss={() => dismissToast(toast.id)} />
        ))}
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="metric-card">
      <span className={`metric-icon ${tone}`}>{icon}</span>
      <div><span className="metric-label">{label}</span><strong>{value}</strong></div>
    </div>
  );
}

function RequestRow({
  request,
  policy,
  selected,
  conflict,
  onSelect,
}: {
  request: PrivacyRequest;
  policy: Policy | undefined;
  selected: boolean;
  conflict: boolean;
  onSelect: () => void;
}) {
  const remaining = getDaysRemaining(request, policy ? [policy] : []);
  const active = request.status === "pending" || request.status === "in_progress";
  return (
    <button className={`request-row ${selected ? "selected" : ""}`} onClick={onSelect} aria-pressed={selected}>
      <span
        className={`request-type-icon ${request.request_type}`}
        title={`${requestTypeLabels[request.request_type]} request`}
      >
        {request.request_type === "access" ? <UserRound size={17} /> : request.request_type === "deletion" ? <X size={17} /> : <ArrowDownToLine size={17} />}
      </span>
      <span className="row-main">
        <span className="row-person" title={request.name || "Name not provided"}>
          {request.name || "Name not provided"}
        </span>
        <span className="row-email" title={request.email || "Email not provided"}>
          {request.email || "Email not provided"}
        </span>
        <span className="row-meta" title={`${request.id} · ${requestTypeLabels[request.request_type]}`}>
          {request.id} <span>·</span> {requestTypeLabels[request.request_type]}
        </span>
      </span>
      <span className="row-right">
        <StatusBadge status={request.status} />
        {conflict && <span className="conflict-dot" title="Active deletion conflict" aria-label="Active deletion conflict"><AlertTriangle size={13} /></span>}
        <span className={`row-date ${active && remaining !== null && remaining < 0 ? "overdue-text" : ""}`}>
          {active && remaining !== null ? remaining < 0 ? `${Math.abs(remaining)}d overdue` : `${remaining}d left` : formatDate(request.submitted_at)}
        </span>
      </span>
    </button>
  );
}

function StatusBadge({ status }: { status: RequestStatus }) {
  return <span className={`status-badge ${status}`}>{statusLabels[status]}</span>;
}

function RequestDetail({
  request,
  policy,
  conflict,
  busy,
  onAction,
}: {
  request: PrivacyRequest;
  policy: Policy | undefined;
  conflict: boolean;
  busy: boolean;
  onAction: (status: "approved" | "denied") => void;
}) {
  const daysRemaining = getDaysRemaining(request, policy ? [policy] : []);
  const isActive = request.status === "pending" || request.status === "in_progress";
  return (
    <div>
      <div className="detail-header">
        <div>
          <span className="detail-kicker">REQUEST DETAILS</span>
          <h2>{request.name || "Name not provided"}</h2>
          <span className="detail-id">{request.id}</span>
        </div>
        <StatusBadge status={request.status} />
      </div>
      {conflict && (
        <div className="conflict-alert" role="alert">
          <AlertTriangle size={17} />
          <div><strong>Related deletion request</strong><span>Approval is blocked while an active deletion request exists for this email.</span></div>
        </div>
      )}
      <div className="detail-section">
        <h3>Request information</h3>
        <DetailItem label="Request type"><span className={`type-label ${request.request_type}`}>{requestTypeLabels[request.request_type]}</span></DetailItem>
        <DetailItem label="Email address">{request.email || <span className="missing-data">Not provided</span>}</DetailItem>
        <DetailItem label="Submitted">{formatDate(request.submitted_at)}</DetailItem>
        <DetailItem label="Assigned to">{request.assigned_to || <span className="missing-data">Unassigned</span>}</DetailItem>
      </div>
      <div className="detail-section policy-section">
        <h3>Policy &amp; deadline</h3>
        {policy ? (
          <>
            <DetailItem label="Policy">{policy.name}</DetailItem>
            <DetailItem label="Response target">{policy.deadline_days} days</DetailItem>
            <DetailItem label="Time remaining">
              {daysRemaining === null ? "Unavailable" : daysRemaining < 0
                ? <span className="overdue-text">{Math.abs(daysRemaining)} days overdue</span>
                : `${daysRemaining} days`}
            </DetailItem>
          </>
        ) : (
          <div className="missing-policy"><AlertTriangle size={15} /> Policy unavailable for this request.</div>
        )}
      </div>
      {isActive && (
        <div className="detail-actions">
          <p>Review this request and record your decision.</p>
          <div className="action-buttons">
            <button className="btn btn-outline-light deny-button" onClick={() => onAction("denied")} disabled={busy}>
              Deny request
            </button>
            <button className="btn btn-primary approve-button" onClick={() => onAction("approved")} disabled={busy || conflict}>
              {busy ? <span className="spinner-border spinner-border-sm" /> : <Check size={16} />}
              Approve
            </button>
          </div>
          {conflict && <span className="action-hint">Resolve the deletion request before approving access.</span>}
        </div>
      )}
      {!isActive && <div className="resolved-note"><Check size={15} /> This request has been resolved.</div>}
    </div>
  );
}

function DetailItem({ label, children }: { label: string; children: ReactNode }) {
  return <div className="detail-item"><span>{label}</span><strong>{children}</strong></div>;
}

function NewRequestDialog({
  onClose,
  onSubmit,
  busy,
}: {
  onClose: () => void;
  onSubmit: (values: { name: string; email: string; requestType: RequestType }) => Promise<void>;
  busy: boolean;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [requestType, setRequestType] = useState<RequestType>("access");
  const [submitError, setSubmitError] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(false);
    try {
      await onSubmit({ name, email, requestType });
    } catch {
      setSubmitError(true);
    }
  }

  return (
    <div className="modal-backdrop-custom" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="new-request-dialog" role="dialog" aria-modal="true" aria-labelledby="new-request-title">
        <div className="dialog-heading">
          <div><span className="detail-kicker">REQUEST MANAGEMENT</span><h2 id="new-request-title">Create request</h2></div>
          <button className="icon-button" aria-label="Close dialog" title="Close dialog" onClick={onClose}><X size={18} /></button>
        </div>
        <p className="dialog-description">Submit a privacy request on behalf of an external user.</p>
        <form onSubmit={submit}>
          <label className="form-field">Full name
            <input className="form-control" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} autoFocus />
          </label>
          <label className="form-field">Email address
            <input className="form-control" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required maxLength={254} />
          </label>
          <label className="form-field">Request type
            <select className="form-select" value={requestType} onChange={(event) => setRequestType(event.target.value as RequestType)}>
              {Object.entries(requestTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
            </select>
          </label>
          {submitError && <p className="form-error" role="alert">Your request was not submitted. Please try again.</p>}
          <div className="dialog-actions">
            <button type="button" className="btn btn-outline-light" onClick={onClose} disabled={busy}>Cancel</button>
            <button className="btn btn-primary" type="submit" disabled={busy}>{busy ? "Submitting…" : "Submit request"}</button>
          </div>
        </form>
      </section>
    </div>
  );
}

function Toast({ toast, onDismiss }: { toast: ToastMessage; onDismiss: () => void }) {
  const icons: Record<ToastKind, ReactNode> = {
    success: <Check size={17} />,
    info: <Inbox size={17} />,
    warning: <AlertTriangle size={17} />,
    error: <AlertTriangle size={17} />,
  };
  return (
    <div className={`toast-message ${toast.kind}`} role={toast.kind === "error" ? "alert" : "status"}>
      <span className="toast-icon">{icons[toast.kind]}</span>
      <span>{toast.message}</span>
      <button className="toast-dismiss" aria-label="Dismiss notification" title="Dismiss notification" onClick={onDismiss}><X size={16} /></button>
    </div>
  );
}

export default App;
