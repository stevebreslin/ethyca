import type { Policy, PrivacyRequest, RequestStatus } from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });
  } catch {
    throw new Error("Could not reach the API. Check that the request server is running.");
  }

  if (!response.ok) {
    throw new Error(`The API returned an error (${response.status}). Please try again.`);
  }

  return response.json() as Promise<T>;
}

export function getRequests(): Promise<PrivacyRequest[]> {
  return request<PrivacyRequest[]>("/privacy_requests");
}

export function getPolicies(): Promise<Policy[]> {
  return request<Policy[]>("/policies");
}

export function updateRequestStatus(
  id: string,
  status: RequestStatus,
): Promise<PrivacyRequest> {
  return request<PrivacyRequest>(`/privacy_requests/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export type NewRequest = Omit<PrivacyRequest, "id">;

export function createRequest(newRequest: NewRequest): Promise<PrivacyRequest> {
  return request<PrivacyRequest>("/privacy_requests", {
    method: "POST",
    body: JSON.stringify(newRequest),
  });
}
