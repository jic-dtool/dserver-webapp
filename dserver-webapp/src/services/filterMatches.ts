import axios from "axios";
import { parsePaginationHeader } from "dserver-client";
import { dserverApi } from "@/services/dserverApi";
import type { SearchQuery } from "@/services/dserverApi";

/** The search filters of the dataset list. */
export interface SearchFilter {
  /** Structured search (free text, creators, locations, tags, ...). */
  query: SearchQuery;
  /** Raw mongo query (JSON); takes precedence over `query` when set. */
  mongoText: string | null;
}

/** The structured search query of the filters in the main store. */
export function buildSearchQuery(store: {
  free_text: string | null;
  creator_usernames: string[];
  base_uris: string[];
  tags: string[];
  uploaded_by: string[];
}): SearchQuery {
  const query: SearchQuery = {};
  if (store.free_text) query.free_text = store.free_text;
  if (store.creator_usernames.length > 0)
    query.creator_usernames = store.creator_usernames;
  if (store.base_uris.length > 0) query.base_uris = store.base_uris;
  if (store.tags.length > 0) query.tags = store.tags;
  if (store.uploaded_by.length > 0) query.uploaded_by = store.uploaded_by;
  return query;
}

/** Whether the filter restricts the datasets at all. */
export function isFilterActive(filter: SearchFilter): boolean {
  return !!filter.mongoText || Object.keys(filter.query).length > 0;
}

const PAGE_SIZE = 100;

/**
 * The subset of `uuids` that the filter matches, decided by the server with
 * the same search as the dataset list. `null` when no filter is active
 * (everything matches).
 */
export async function findMatchingUuids(
  uuids: string[],
  filter: SearchFilter,
  token: string | null,
): Promise<Set<string> | null> {
  if (!isFilterActive(filter)) return null;
  const matches = new Set<string>();
  if (uuids.length === 0) return matches;

  for (let page = 1; ; page++) {
    const { datasets, pages } = filter.mongoText
      ? await mongoPage(uuids, filter.mongoText, token, page)
      : await searchPage(uuids, filter.query, page);
    for (const dataset of datasets) matches.add(dataset.uuid);
    if (page >= pages || datasets.length === 0) return matches;
  }
}

interface Page {
  datasets: { uuid: string }[];
  pages: number;
}

async function searchPage(
  uuids: string[],
  query: SearchQuery,
  page: number,
): Promise<Page> {
  const result = await dserverApi.searchDatasets(
    { ...query, uuids },
    { page, page_size: PAGE_SIZE },
  );
  return { datasets: result.data, pages: result.pagination.pages };
}

async function mongoPage(
  uuids: string[],
  mongoText: string,
  token: string | null,
  page: number,
): Promise<Page> {
  const query = { $and: [JSON.parse(mongoText), { uuid: { $in: uuids } }] };
  const response = await axios.post(
    `${dserverApi.getBaseUrl()}/mongo/query`,
    { query },
    {
      params: { page, page_size: PAGE_SIZE },
      headers: {
        Authorization: `Bearer ${token || ""}`,
        "Content-Type": "application/json",
      },
    },
  );
  const datasets = response.data as { uuid: string }[];
  const pagination = parsePaginationHeader(
    response.headers["x-pagination"],
    PAGE_SIZE,
    datasets.length,
  );
  return { datasets, pages: pagination.pages };
}
