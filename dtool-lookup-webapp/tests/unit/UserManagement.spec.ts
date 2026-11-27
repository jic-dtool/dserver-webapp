import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import UserManagement from "@/components/UserManagement.vue";
import { dserverApi } from "@/services/dserverApi";

vi.mock("@/services/dserverApi", () => ({
  dserverApi: {
    listUsers: vi.fn(),
    listBaseURIs: vi.fn(),
    grantSearchPermission: vi.fn(),
    grantRegisterPermission: vi.fn(),
  },
}));

// Vuetify's tables and menus observe their size; jsdom has neither.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const vuetify = createVuetify({ components, directives });

const USER = {
  username: "alice",
  is_admin: false,
  search_permissions_on_base_uris: ["s3://a"],
  register_permissions_on_base_uris: [],
};

describe("UserManagement permissions", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(dserverApi.listUsers).mockResolvedValue([USER] as never);
    vi.mocked(dserverApi.listBaseURIs).mockResolvedValue([
      { base_uri: "s3://a" },
      { base_uri: "s3://b" },
    ] as never);
    vi.mocked(dserverApi.grantSearchPermission).mockResolvedValue(
      undefined as never,
    );
    vi.mocked(dserverApi.grantRegisterPermission).mockResolvedValue(
      undefined as never,
    );
  });

  async function expandedEditor() {
    const wrapper = mount(UserManagement, {
      global: { plugins: [vuetify] },
    });
    await flushPromises();
    // Open the permission editor of the user.
    (wrapper.vm as unknown as { expandedRows: string[] }).expandedRows = [
      "alice",
    ];
    await flushPromises();
    return wrapper;
  }

  it("grants a permission as soon as a base URI is selected", async () => {
    const wrapper = await expandedEditor();
    const selects = wrapper
      .findAllComponents(components.VSelect)
      .filter((s) => s.props("label") === "Add base URI");
    expect(selects).toHaveLength(2); // search and register
    expect(wrapper.findAll(".mdi-plus")).toHaveLength(0);

    // Search: only s3://b is not yet granted.
    expect(selects[0].props("items")).toEqual(["s3://b"]);
    selects[0].vm.$emit("update:modelValue", "s3://b");
    await flushPromises();
    expect(dserverApi.grantSearchPermission).toHaveBeenCalledWith(
      "alice",
      "s3://b",
    );

    selects[1].vm.$emit("update:modelValue", "s3://a");
    await flushPromises();
    expect(dserverApi.grantRegisterPermission).toHaveBeenCalledWith(
      "alice",
      "s3://a",
    );
    // Reloaded after each grant.
    expect(dserverApi.listUsers).toHaveBeenCalledTimes(3);
  });
});
