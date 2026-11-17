/**
 * Normalize a Halo list response.
 *
 * Some Halo list endpoints (/Agent, /Team, /Category, /AssetType) return a
 * bare JSON array and ignore page_size, while others return
 * `{ record_count, <key>: [...] }`; paginated /Agent returns
 * `{ record_count, results: [...] }`. Reading `response.<key>` off a bare array
 * yields undefined, so the tool reported no rows.
 */
export interface NormalizedList<T = unknown> {
  record_count: number;
  records: T[];
}

export function normalizeListResponse<T = unknown>(
  response: unknown,
  key: string,
  page?: { pageSize?: number; pageNo?: number }
): NormalizedList<T> {
  let records: T[];
  let recordCount: number | undefined;

  if (Array.isArray(response)) {
    records = response as T[];
  } else if (response && typeof response === "object") {
    const obj = response as Record<string, unknown>;
    const value = Array.isArray(obj[key]) ? obj[key] : obj.results;
    records = Array.isArray(value) ? (value as T[]) : [];
    recordCount = typeof obj.record_count === "number" ? obj.record_count : undefined;
  } else {
    records = [];
  }

  const total = recordCount ?? records.length;
  const pageSize = page?.pageSize;

  // More rows than requested means Halo ignored paging: page client-side.
  if (pageSize && pageSize > 0 && records.length > pageSize) {
    const pageNo = page?.pageNo && page.pageNo > 0 ? page.pageNo : 1;
    records = records.slice((pageNo - 1) * pageSize, pageNo * pageSize);
  }

  return { record_count: total, records };
}
