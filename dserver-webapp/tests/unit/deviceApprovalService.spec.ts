import { describe, it, expect, beforeEach, vi } from "vitest";

import {
  USER_CODE_STORAGE_KEY,
  capturePendingUserCode,
  clearPendingUserCode,
  decideDeviceRequest,
  getPendingUserCode,
  lookupDeviceRequest,
  normalizeUserCode,
} from "@/services/deviceApproval";

const DEVICE_URL = "http://localhost:5000/auth/oauth2/device";

function jsonResponse(status: number, body: unknown) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { "Content-Type": "application/json" },
    }),
  );
}

describe("normalizeUserCode", () => {
  it("formats valid codes as XXXX-XXXX", () => {
    expect(normalizeUserCode("PBZJ-VZZL")).toBe("PBZJ-VZZL");
    expect(normalizeUserCode("pbzjvzzl")).toBe("PBZJ-VZZL");
    expect(normalizeUserCode(" pbzj vzzl ")).toBe("PBZJ-VZZL");
  });

  it("rejects anything else", () => {
    expect(normalizeUserCode("")).toBeNull();
    expect(normalizeUserCode("PBZJ-VZZ")).toBeNull();
    // Vowels and digits are never part of user codes
    expect(normalizeUserCode("PAZJ-VZZL")).toBeNull();
    expect(normalizeUserCode("PBZ1-VZZL")).toBeNull();
    expect(normalizeUserCode("<script>")).toBeNull();
  });
});

describe("pending user code", () => {
  beforeEach(() => sessionStorage.clear());

  it("is captured from the query and survives the login redirect", () => {
    const replaceState = vi.fn();
    const code = capturePendingUserCode(
      { search: "?user_code=pbzj-vzzl", pathname: "/", hash: "" },
      sessionStorage,
      { replaceState },
    );
    expect(code).toBe("PBZJ-VZZL");
    expect(sessionStorage.getItem(USER_CODE_STORAGE_KEY)).toBe("PBZJ-VZZL");
    // The code is removed from the URL (and so from the browser history)
    expect(replaceState).toHaveBeenCalledWith(null, "", "/");

    // After returning from the login, the query is gone, the code is not.
    expect(
      capturePendingUserCode(
        { search: "", pathname: "/", hash: "#token=abc" },
        sessionStorage,
        { replaceState: vi.fn() },
      ),
    ).toBe("PBZJ-VZZL");
    expect(getPendingUserCode(sessionStorage)).toBe("PBZJ-VZZL");
  });

  it("keeps other query parameters and the fragment", () => {
    const replaceState = vi.fn();
    capturePendingUserCode(
      { search: "?user_code=PBZJVZZL&q=x", pathname: "/app", hash: "#token=t" },
      sessionStorage,
      { replaceState },
    );
    expect(replaceState).toHaveBeenCalledWith(null, "", "/app?q=x#token=t");
  });

  it("ignores invalid codes", () => {
    expect(
      capturePendingUserCode(
        { search: "?user_code=<b>", pathname: "/", hash: "" },
        sessionStorage,
        { replaceState: vi.fn() },
      ),
    ).toBeNull();
    expect(sessionStorage.getItem(USER_CODE_STORAGE_KEY)).toBeNull();
  });

  it("can be cleared", () => {
    sessionStorage.setItem(USER_CODE_STORAGE_KEY, "PBZJ-VZZL");
    clearPendingUserCode(sessionStorage);
    expect(getPendingUserCode(sessionStorage)).toBeNull();
  });
});

describe("device request API", () => {
  it("looks up a request with the user's token", async () => {
    const fetchImpl = vi.fn(() =>
      jsonResponse(200, {
        user_code: "PBZJ-VZZL",
        client_name: "dtool on laptop",
        status: "pending",
        expires_at: "2026-11-23T13:38:34+00:00",
      }),
    );
    const request = await lookupDeviceRequest(
      "PBZJ-VZZL",
      "my-token",
      DEVICE_URL,
      fetchImpl,
    );
    expect(request.client_name).toBe("dtool on laptop");
    expect(fetchImpl).toHaveBeenCalledWith(`${DEVICE_URL}/PBZJ-VZZL`, {
      method: "GET",
      headers: { Authorization: "Bearer my-token" },
    });
  });

  it.each([
    [true, "approve"],
    [false, "deny"],
  ])("decides (approve=%s) via POST .../%s", async (approve, action) => {
    const fetchImpl = vi.fn(() =>
      jsonResponse(200, { user_code: "PBZJ-VZZL", status: "approved" }),
    );
    await decideDeviceRequest(
      "PBZJ-VZZL",
      approve,
      "my-token",
      DEVICE_URL,
      fetchImpl,
    );
    expect(fetchImpl).toHaveBeenCalledWith(
      `${DEVICE_URL}/PBZJ-VZZL/${action}`,
      { method: "POST", headers: { Authorization: "Bearer my-token" } },
    );
  });

  it("reports the server's error description", async () => {
    const fetchImpl = vi.fn(() =>
      jsonResponse(404, {
        error: "not_found",
        error_description: "Unknown or expired code",
      }),
    );
    await expect(
      lookupDeviceRequest("PBZJ-VZZL", "t", DEVICE_URL, fetchImpl),
    ).rejects.toThrow("Unknown or expired code");
  });
});
