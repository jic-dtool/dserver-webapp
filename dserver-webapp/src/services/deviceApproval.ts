/**
 * Approval of command-line logins (OAuth 2.0 device authorization flow).
 *
 * `dtool dserver login` shows the user a short code and a link to this
 * webapp with `?user_code=...`. The code is kept in sessionStorage so that it
 * survives the login redirect; once the user is logged in, the
 * DeviceApproval dialog lets them approve or deny the request. The requests
 * to the token plugin are authenticated with the user's dserver token.
 */

export const USER_CODE_STORAGE_KEY = "dtool-device-user-code";

// User codes consist of 8 consonants (no vowels, no digits), see RFC 8628.
const USER_CODE_PATTERN = /^[BCDFGHJKLMNPQRSTVWXZ]{8}$/;

export interface DeviceRequest {
  user_code: string;
  client_name: string | null;
  created_at?: string;
  expires_at?: string;
  status: "pending" | "approved" | "denied";
}

interface LocationLike {
  search: string;
  pathname: string;
  hash: string;
}

interface HistoryLike {
  replaceState(data: unknown, unused: string, url?: string | null): void;
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

/** Return the code as XXXX-XXXX, or null if it is not a valid user code. */
export function normalizeUserCode(code: string): string | null {
  const compact = code.replace(/[\s-]/g, "").toUpperCase();
  if (!USER_CODE_PATTERN.test(compact)) {
    return null;
  }
  return `${compact.slice(0, 4)}-${compact.slice(4)}`;
}

/**
 * Store a `user_code` query parameter for after the login, remove it from
 * the URL, and return the pending code (if any).
 */
export function capturePendingUserCode(
  location: LocationLike = window.location,
  storage: Storage = window.sessionStorage,
  history: HistoryLike = window.history,
): string | null {
  const params = new URLSearchParams(location.search);
  const raw = params.get("user_code");
  if (raw !== null) {
    const code = normalizeUserCode(raw);
    if (code !== null) {
      storage.setItem(USER_CODE_STORAGE_KEY, code);
    }
    params.delete("user_code");
    const query = params.toString();
    history.replaceState(
      null,
      "",
      `${location.pathname}${query ? `?${query}` : ""}${location.hash}`,
    );
  }
  return getPendingUserCode(storage);
}

export function getPendingUserCode(
  storage: Storage = window.sessionStorage,
): string | null {
  return storage.getItem(USER_CODE_STORAGE_KEY);
}

export function clearPendingUserCode(
  storage: Storage = window.sessionStorage,
): void {
  storage.removeItem(USER_CODE_STORAGE_KEY);
}

async function request<T>(
  fetchImpl: FetchLike,
  url: string,
  method: "GET" | "POST",
  token: string,
): Promise<T> {
  const response = await fetchImpl(url, {
    method,
    headers: { Authorization: `Bearer ${token}` },
  });
  let body: Record<string, unknown> = {};
  try {
    body = await response.json();
  } catch {
    // Non-JSON error response
  }
  if (!response.ok) {
    const description =
      (body.error_description as string) ||
      (body.error as string) ||
      `HTTP ${response.status}`;
    throw new Error(description);
  }
  return body as T;
}

/** Return the pending request of a user code. */
export function lookupDeviceRequest(
  code: string,
  token: string,
  deviceUrl: string,
  fetchImpl: FetchLike = fetch,
): Promise<DeviceRequest> {
  return request<DeviceRequest>(
    fetchImpl,
    `${deviceUrl}/${encodeURIComponent(code)}`,
    "GET",
    token,
  );
}

/** Approve or deny the request of a user code. */
export function decideDeviceRequest(
  code: string,
  approve: boolean,
  token: string,
  deviceUrl: string,
  fetchImpl: FetchLike = fetch,
): Promise<Pick<DeviceRequest, "user_code" | "status">> {
  return request(
    fetchImpl,
    `${deviceUrl}/${encodeURIComponent(code)}/${approve ? "approve" : "deny"}`,
    "POST",
    token,
  );
}
