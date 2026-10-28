import { prompt } from "@grok/agent-sdk";
import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import {
  NOTES_INDEX_KEY,
  emptyIndex,
  noteFilePath,
  type MeetingNoteRecord,
  type NoteIndex,
} from "../lib/notes.js";

export default defineTool({
  description: prompt`
    Look up saved pocket meeting notes.
    Pass noteId for one full note, or a query / limit for recent matches.
  `,
  effect: "read",
  inputSchema: z.object({
    noteId: z.string().optional().describe("Exact note id to load."),
    query: z
      .string()
      .optional()
      .describe("Case-insensitive match against title, tags, attendees."),
    limit: z.number().int().min(1).max(50).default(10),
  }),
  async execute({ noteId, query, limit }, ctx) {
    if (noteId) {
      const raw = await ctx.host.files.read(noteFilePath(noteId), {
        scope: "deployment",
      });
      if (!raw) {
        return { found: false, noteId };
      }
      const note = JSON.parse(raw) as MeetingNoteRecord;
      return { found: true, note };
    }

    const index = ((await ctx.host.kv.get(NOTES_INDEX_KEY)) as NoteIndex | undefined) ?? emptyIndex();
    const q = query?.trim().toLowerCase();
    const matches = index.notes.filter((n) => {
      if (!q) return true;
      const hay = [n.title, ...n.tags, ...n.attendees].join(" ").toLowerCase();
      return hay.includes(q);
    });

    return {
      found: matches.length > 0,
      count: matches.length,
      notes: matches.slice(0, limit),
    };
  },
});
