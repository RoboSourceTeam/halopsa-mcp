import { describe, it, expect, vi } from "vitest";

const { handleCall } = vi.hoisted(() => ({
  handleCall: vi.fn(async () => ({ content: [{ type: "text", text: "routed" }] })),
}));

vi.mock("../domains/index.js", () => ({
  getDomainHandler: vi.fn(async () => ({ getTools: () => [], handleCall })),
  getAvailableDomains: () => ["agents"],
}));

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createMcpServer } from "../mcp-server.js";
import { getDomainHandler } from "../domains/index.js";

describe("tool routing", () => {
  it("routes halopsa_teams_list to the agents domain instead of Unknown tool", async () => {
    const server = createMcpServer();
    const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
    await server.connect(serverTransport);
    const client = new Client({ name: "test", version: "0.0.0" });
    await client.connect(clientTransport);

    const result = await client.callTool({ name: "halopsa_teams_list", arguments: {} });

    expect(getDomainHandler).toHaveBeenCalledWith("agents");
    expect(handleCall).toHaveBeenCalledWith("halopsa_teams_list", {});
    expect(result.isError).toBeFalsy();
    expect(result.content).toEqual([{ type: "text", text: "routed" }]);
    await client.close();
  });
});
