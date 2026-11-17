import { describe, it, expect } from "vitest";
import { normalizeListResponse } from "../utils/list-response.js";

describe("normalizeListResponse", () => {
  it("reads a bare array, which /Agent, /Team, /Category and /AssetType return", () => {
    const result = normalizeListResponse([{ id: 1 }, { id: 2 }], "agents");
    expect(result).toEqual({ record_count: 2, records: [{ id: 1 }, { id: 2 }] });
  });

  it("reads a wrapped { record_count, <key> } response", () => {
    const result = normalizeListResponse({ record_count: 40, agents: [{ id: 1 }] }, "agents");
    expect(result).toEqual({ record_count: 40, records: [{ id: 1 }] });
  });

  it("returns no rows for an object missing the key", () => {
    expect(normalizeListResponse({ record_count: 3 }, "agents")).toEqual({
      record_count: 3,
      records: [],
    });
  });

  it("returns no rows for null or a non-object", () => {
    expect(normalizeListResponse(null, "agents")).toEqual({ record_count: 0, records: [] });
    expect(normalizeListResponse("oops", "agents")).toEqual({ record_count: 0, records: [] });
  });

  it("pages client-side when Halo ignored page_size and returned every row", () => {
    const rows = Array.from({ length: 83 }, (_, i) => ({ id: i + 1 }));
    const page2 = normalizeListResponse(rows, "categories", { pageSize: 50, pageNo: 2 });
    expect(page2.record_count).toBe(83);
    expect(page2.records.map((r) => (r as { id: number }).id)).toEqual(
      Array.from({ length: 33 }, (_, i) => i + 51)
    );
  });

  it("does not re-slice a response Halo already paged", () => {
    const rows = [{ id: 51 }, { id: 52 }];
    const result = normalizeListResponse(rows, "categories", { pageSize: 50, pageNo: 2 });
    expect(result.records).toEqual(rows);
  });
});
