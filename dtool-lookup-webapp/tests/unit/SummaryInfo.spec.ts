import { describe, it, expect, beforeEach, vi } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { createPinia, setActivePinia } from "pinia";
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";
import SummaryInfo from "@/components/SummaryInfo.vue";
import { useStore } from "@/store";

vi.mock("@/services/dserverApi", () => ({
  dserverApi: {
    getMySummary: vi.fn().mockResolvedValue({
      number_of_datasets: 6,
      base_uris: ["s3://a", "s3://b", "s3://c"],
      datasets_per_base_uri: { "s3://a": 1, "s3://b": 2, "s3://c": 3 },
      creator_usernames: [],
      datasets_per_creator: {},
      tags: [],
      datasets_per_tag: {},
    }),
  },
}));

// Vuetify's lists observe their size; jsdom has no ResizeObserver.
globalThis.ResizeObserver ??= class {
  observe() {}
  unobserve() {}
  disconnect() {}
} as unknown as typeof ResizeObserver;

const vuetify = createVuetify({ components, directives });

async function mountSidebar() {
  const wrapper = mount(SummaryInfo, { global: { plugins: [vuetify] } });
  await flushPromises();
  return wrapper;
}

function checkboxes(wrapper: ReturnType<typeof mount>) {
  return wrapper.findAll(".locations input[type=checkbox]");
}

function checked(wrapper: ReturnType<typeof mount>) {
  return checkboxes(wrapper).map(
    (c) => (c.element as HTMLInputElement).checked,
  );
}

describe("SummaryInfo locations", () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it("shows the locations right below the heading, all selected", async () => {
    const wrapper = await mountSidebar();
    const html = wrapper.html();
    expect(html.indexOf("Repository")).toBeLessThan(html.indexOf("Locations"));
    expect(html.indexOf("Locations")).toBeLessThan(
      html.indexOf("Total Datasets"),
    );
    expect(checked(wrapper)).toEqual([true, true, true]);
    expect(useStore().base_uris).toEqual([]);
  });

  it("filters by deselecting locations and keeps one selected", async () => {
    const wrapper = await mountSidebar();
    const store = useStore();

    await checkboxes(wrapper)[0].trigger("click");
    expect(store.base_uris).toEqual(["s3://b", "s3://c"]);
    expect(wrapper.text()).toContain("2 of 3");

    await checkboxes(wrapper)[1].trigger("click");
    expect(store.base_uris).toEqual(["s3://c"]);
    expect(checked(wrapper)).toEqual([false, false, true]);

    // The last selected location cannot be deselected.
    await checkboxes(wrapper)[2].trigger("click");
    expect(store.base_uris).toEqual(["s3://c"]);
  });

  it("selecting all locations again removes the filter", async () => {
    const wrapper = await mountSidebar();
    const store = useStore();
    await checkboxes(wrapper)[0].trigger("click");
    await checkboxes(wrapper)[0].trigger("click");
    expect(store.base_uris).toEqual([]);
    expect(checked(wrapper)).toEqual([true, true, true]);
  });
});
