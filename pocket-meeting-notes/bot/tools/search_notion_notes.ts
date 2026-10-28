import { prompt } from "@grok/agent-sdk";
import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";

function textFromMcp(result: {
  content: Array<{ type: string; text?: string }>;
  structuredContent?: unknown;
}): string {
  const parts = result.content
    .filter((c): c is { type: "text"; text: string } => c.type === "text" && typeof c.text === "string")
    .map((c) => c.text);
  if (parts.length > 0) return parts.join("\n");
  if (result.structuredContent != null) return JSON.stringify(result.structuredContent);
  return "";
}

export default defineTool({
  description: prompt`
    Search Notion for prior meeting notes or related pages.
    Use when the user asks about something that may live in Notion, not only
    in local pocket storage.
  `,
  effect: "read",
  inputSchema: z.object({
    query: z.string().min(1).describe("Keywords for Notion workspace search."),
    pageSize: z.number().int().min(1).max(25).default(8),
  }),
  async execute({ query, pageSize }, ctx) {
    let result;
    try {
      result = await ctx.host.mcp.callTool("notion", "notion-search", {
        query,
        page_size: pageSize,
      });
    } catch (err) {
      return {
        found: false,
        error: "notion_unavailable",
        message:
          err instanceof Error
            ? err.message
            : "Notion MCP call failed. Connect Notion in Cursor for this account.",
      };
    }

    if (result.isError) {
      return {
        found: false,
        error: "notion_tool_error",
        message: textFromMcp(result) || "Notion search failed.",
      };
    }

    return {
      found: true,
      query,
      detail: textFromMcp(result).slice(0, 8000),
      structured: result.structuredContent ?? null,
    };
  },
});
