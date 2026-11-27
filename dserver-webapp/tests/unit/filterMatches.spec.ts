import { describe, it, expect, beforeEach, vi } from "vitest";
import axios from "axios";
import { dserverApi } from "@/services/dserverApi";
import { buildSearchQuery, findMatchingUuids } from "@/services/filterMatches";

vi.mock("axios", () => ({ default: { post: vi.fn() } }));
vi.mock("@/services/dserverApi", () => ({
  dserverApi: {
    searchDatasets: vi.fn(),
    getBaseUrl: () => "http://dserver",
  },
}));

const NO_FILTERS = {
  free_text: null,
  creator_usernames: [],
  base_uris: [],
  tags: [],
  uploaded_by: [],
};

function page(uuids: string[], pageNumber: number, pages: number) {
  return {
    data: uuids.map((uuid) => ({ uuid })),
    pagination: { total: 0, page: pageNumber, per_page: 100, pages },
  };
}

describe("buildSearchQuery", () => {
  it("contains only the active filters", () => {
    expect(buildSearchQuery(NO_FILTERS)).toEqual({});
    expect(
      buildSearchQuery({ ...NO_FILTERS, free_text: "x", tags: ["t"] }),
    ).toEqual({ free_text: "x", tags: ["t"] });
  });
});

describe("findMatchingUuids", () => {
  beforeEach(() => vi.clearAllMocks());

  it("matches everything without a filter, without asking the server", async () => {
    const matches = await findMatchingUuids(
      ["a", "b"],
      { query: {}, mongoText: null },
      null,
    );
    expect(matches).toBeNull();
    expect(dserverApi.searchDatasets).not.toHaveBeenCalled();
  });

  it("restricts the search to the graph's datasets and reads all pages", async () => {
    vi.mocked(dserverApi.searchDatasets)
      .mockResolvedValueOnce(page(["a"], 1, 2) as never)
      .mockResolvedValueOnce(page(["c"], 2, 2) as never);
    const matches = await findMatchingUuids(
      ["a", "b", "c"],
      { query: { tags: ["t"] }, mongoText: null },
      null,
    );
    expect(matches).toEqual(new Set(["a", "c"]));
    expect(dserverApi.searchDatasets).toHaveBeenNthCalledWith(
      1,
      { tags: ["t"], uuids: ["a", "b", "c"] },
      { page: 1, page_size: 100 },
    );
    expect(dserverApi.searchDatasets).toHaveBeenCalledTimes(2);
  });

  it("combines a mongo query with the graph's datasets", async () => {
    vi.mocked(axios.post).mockResolvedValue({
      data: [{ uuid: "b" }],
      headers: {
        "x-pagination": JSON.stringify({ total: 1, total_pages: 1, page: 1 }),
      },
    });
    const matches = await findMatchingUuids(
      ["a", "b"],
      { query: {}, mongoText: '{"name": "x"}' },
      "token",
    );
    expect(matches).toEqual(new Set(["b"]));
    expect(axios.post).toHaveBeenCalledWith(
      "http://dserver/mongo/query",
      { query: { $and: [{ name: "x" }, { uuid: { $in: ["a", "b"] } }] } },
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: "Bearer token" }),
      }),
    );
  });
});
