import { describe, it, expect, beforeEach, vi } from "vitest";
import { flushPromises, mount } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

vi.mock("@/services/dserverApi", () => ({
  dserverApi: { setToken: vi.fn() },
}));

const service = vi.hoisted(() => ({
  pending: "PBZJ-VZZL" as string | null,
  lookupDeviceRequest: vi.fn(),
  decideDeviceRequest: vi.fn(),
  clearPendingUserCode: vi.fn(),
}));

vi.mock("@/services/deviceApproval", () => ({
  getPendingUserCode: () => service.pending,
  clearPendingUserCode: service.clearPendingUserCode,
  lookupDeviceRequest: service.lookupDeviceRequest,
  decideDeviceRequest: service.decideDeviceRequest,
}));

import DeviceApproval from "@/components/DeviceApproval.vue";
import { useAuthStore } from "@/stores/auth";

// jsdom lacks ResizeObserver and visualViewport, which Vuetify's dialog uses.
globalThis.ResizeObserver ||= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;
globalThis.visualViewport ||= Object.assign(new EventTarget(), {
  width: 1024,
  height: 768,
  offsetLeft: 0,
  offsetTop: 0,
  pageLeft: 0,
  pageTop: 0,
  scale: 1,
}) as unknown as VisualViewport;

async function mountDialog() {
  const wrapper = mount(DeviceApproval, {
    attachTo: document.body,
    global: { plugins: [createVuetify({ components, directives })] },
  });
  await flushPromises();
  return wrapper;
}

function find(selector: string): HTMLElement | null {
  return document.body.querySelector(`[data-test="${selector}"]`);
}

describe("DeviceApproval", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
    setActivePinia(createPinia());
    useAuthStore().token = "user-token";
    service.pending = "PBZJ-VZZL";
    service.lookupDeviceRequest.mockReset().mockResolvedValue({
      user_code: "PBZJ-VZZL",
      client_name: "dtool on laptop",
      status: "pending",
      expires_at: "2026-11-23T13:38:34+00:00",
    });
    service.decideDeviceRequest.mockReset().mockResolvedValue({
      user_code: "PBZJ-VZZL",
      status: "approved",
    });
    service.clearPendingUserCode.mockReset();
  });

  it("shows nothing without a pending code", async () => {
    service.pending = null;
    await mountDialog();
    expect(service.lookupDeviceRequest).not.toHaveBeenCalled();
    expect(find("approve")).toBeNull();
  });

  it("shows the code and requesting client", async () => {
    await mountDialog();
    expect(service.lookupDeviceRequest).toHaveBeenCalledWith(
      "PBZJ-VZZL",
      "user-token",
      expect.stringContaining("/auth/oauth2/device"),
    );
    expect(find("user-code")?.textContent).toContain("PBZJ-VZZL");
    expect(document.body.textContent).toContain("dtool on laptop");
  });

  it("approves only on click", async () => {
    await mountDialog();
    expect(service.decideDeviceRequest).not.toHaveBeenCalled();

    find("approve")?.click();
    await flushPromises();

    expect(service.decideDeviceRequest).toHaveBeenCalledWith(
      "PBZJ-VZZL",
      true,
      "user-token",
      expect.stringContaining("/auth/oauth2/device"),
    );
    expect(document.body.textContent).toContain("Login approved");
    expect(service.clearPendingUserCode).toHaveBeenCalled();
  });

  it("denies", async () => {
    await mountDialog();
    find("deny")?.click();
    await flushPromises();
    expect(service.decideDeviceRequest).toHaveBeenCalledWith(
      "PBZJ-VZZL",
      false,
      "user-token",
      expect.any(String),
    );
    expect(document.body.textContent).toContain("Login denied");
  });

  it("reports unknown or expired codes and forgets them", async () => {
    service.lookupDeviceRequest.mockRejectedValue(
      new Error("Unknown or expired code"),
    );
    await mountDialog();
    expect(find("error")?.textContent).toContain("Unknown or expired code");
    expect(find("approve")).toBeNull();
    expect(service.clearPendingUserCode).toHaveBeenCalled();
  });
});
