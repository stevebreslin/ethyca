export type RequestType = "access" | "deletion" | "portability";
export type RequestStatus = "pending" | "in_progress" | "approved" | "denied";

export interface PrivacyRequest {
  id: string;
  name: string | null;
  email: string | null;
  request_type: RequestType;
  status: RequestStatus;
  submitted_at: string | null;
  assigned_to: string | null;
  policy_id: string | null;
}

export interface Policy {
  id: string;
  name: string;
  request_type: RequestType;
  deadline_days: number;
}

export type ToastKind = "success" | "info" | "warning" | "error";

export interface ToastMessage {
  id: number;
  kind: ToastKind;
  message: string;
}
