/**
 * Agents domain handler
 *
 * Provides tools for agent (technician/user) operations in HaloPSA.
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { DomainHandler, CallToolResult } from "../utils/types.js";
import { getClient } from "../utils/client.js";
import { normalizeListResponse } from "../utils/list-response.js";

/**
 * Get agent domain tools
 */
function getTools(): Tool[] {
  return [
    {
      name: "halopsa_agents_list",
      description: "List technicians",
      inputSchema: {
        type: "object" as const,
        properties: {
          team_id: {
            type: "number",
          },
          inactive: {
            type: "boolean",
            description: "Include inactive",
          },
          limit: {
            type: "number",
            description: "Maximum number of results (default: 50)",
          },
        },
      },
    },
    {
      name: "halopsa_agents_get",
      description: "Get technician details by ID",
      inputSchema: {
        type: "object" as const,
        properties: {
          agent_id: {
            type: "number",
          },
        },
        required: ["agent_id"],
      },
    },
    {
      name: "halopsa_teams_list",
      description: "List teams",
      inputSchema: {
        type: "object" as const,
        properties: {
          limit: {
            type: "number",
            description: "Maximum number of results (default: 50)",
          },
        },
      },
    },
  ];
}

/**
 * Handle an agent domain tool call
 */
async function handleCall(
  toolName: string,
  args: Record<string, unknown>
): Promise<CallToolResult> {
  const client = await getClient();

  switch (toolName) {
    case "halopsa_agents_list": {
      const limit = (args.limit as number) || 50;
      const response = await client.agents.list({
        team_id: args.team_id as number | undefined,
        inactive: args.inactive as boolean | undefined,
        pageSize: limit,
      });
      const list = normalizeListResponse(response, "agents", { pageSize: limit });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: list.record_count,
                agents: list.records,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    case "halopsa_agents_get": {
      const agentId = args.agent_id as number;
      const agent = await client.agents.get(agentId);

      return {
        content: [{ type: "text", text: JSON.stringify(agent, null, 2) }],
      };
    }

    case "halopsa_teams_list": {
      const limit = (args.limit as number) || 50;
      const response = await client.teams.list({
        pageSize: limit,
      });
      const list = normalizeListResponse(response, "teams", { pageSize: limit });

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                record_count: list.record_count,
                teams: list.records,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    default:
      return {
        content: [{ type: "text", text: `Unknown agent tool: ${toolName}` }],
        isError: true,
      };
  }
}

export const agentsHandler: DomainHandler = {
  getTools,
  handleCall,
};
