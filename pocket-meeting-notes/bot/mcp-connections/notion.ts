import { defineConnection } from "@grok/agent-sdk/connections";

/** Cursor-account Notion connector. Tokens stay on Cursor's backend. */
export default defineConnection({
  cursorAccount: true,
  servers: ["Notion"],
  // Model uses authored publish/search tools; host code calls Notion via ctx.host.mcp.
  advertiseTools: false,
});
