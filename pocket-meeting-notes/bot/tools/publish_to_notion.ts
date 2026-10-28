import { prompt } from "@grok/agent-sdk";
import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import {
  formatNoteMarkdown,
  loadNote,
  writeNote,
  type MeetingNoteRecord,
} from "../lib/notes.js";

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

function extractNotionLink(text: string): { url?: string; pageId?: string } {
  const urlMatch = text.match(/https:\/\/(?:www\.)?notion\.so\/[^\s)"']+/);
  const idMatch = text.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  );
  return {
    url: urlMatch?.[0],
    pageId: idMatch?.[0],
  };
}

export default defineTool({
  description: prompt`
    Publish a saved pocket meeting note to Notion as a page.
    Requires noteId from save_meeting_note. Uses draft mode unless parentPageId
    or NOTION_PARENT_PAGE_ID is set.
  `,
  effect: "write",
  inputSchema: z.object({
    noteId: z.string().min(1).describe("Id returned by save_meeting_note."),
    parentPageId: z
      .string()
      .optional()
      .describe("Optional Notion parent page id. Overrides NOTION_PARENT_PAGE_ID."),
  }),
  dryRunResult: ({ noteId }) => ({
    published: false,
    dryRun: true,
    noteId,
    sink: "notion",
  }),
  async execute({ noteId, parentPageId }, ctx) {
    const note = await loadNote(ctx.host.files, noteId);
    if (!note) {
      return { published: false, error: "note_not_found", noteId };
    }

    const parent =
      parentPageId?.trim() ||
      process.env.NOTION_PARENT_PAGE_ID?.trim() ||
      undefined;

    const content = formatNoteMarkdown(note);
    const args: Record<string, unknown> = {
      pages: [
        {
          properties: { title: note.title },
          content,
        },
      ],
      allow_async: false,
    };
    if (parent) {
      args.parent = { page_id: parent, type: "page_id" };
    } else {
      args.creation_mode = "draft";
    }

    let result;
    try {
      result = await ctx.host.mcp.callTool("notion", "notion-create-pages", args);
    } catch (err) {
      return {
        published: false,
        error: "notion_unavailable",
        noteId,
        message:
          err instanceof Error
            ? err.message
            : "Notion MCP call failed. Connect Notion in Cursor and ensure the account MCP bridge is signed in.",
      };
    }

    if (result.isError) {
      return {
        published: false,
        error: "notion_tool_error",
        noteId,
        message: textFromMcp(result) || "Notion create-pages returned an error.",
      };
    }

    const payload = textFromMcp(result);
    const link = extractNotionLink(payload);
    const updated: MeetingNoteRecord = {
      ...note,
      destinations: {
        ...note.destinations,
        notionPageId: link.pageId ?? note.destinations?.notionPageId,
        notionUrl: link.url ?? note.destinations?.notionUrl,
      },
    };
    await writeNote(ctx.host.files, updated);

    return {
      published: true,
      sink: "notion",
      noteId,
      notionUrl: updated.destinations?.notionUrl ?? null,
      notionPageId: updated.destinations?.notionPageId ?? null,
      draft: !parent,
      detail: payload.slice(0, 2000),
    };
  },
});
