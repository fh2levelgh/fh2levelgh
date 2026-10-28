import { prompt } from "@grok/agent-sdk";
import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import {
  NOTES_INDEX_KEY,
  emptyIndex,
  mintNoteId,
  noteFilePath,
  toMeta,
  upsertMeta,
  type MeetingNoteRecord,
  type NoteIndex,
} from "../lib/notes.js";

const actionItemSchema = z.object({
  owner: z.string().nullable().default(null),
  task: z.string().min(1),
  due: z.string().nullable().default(null),
});

export default defineTool({
  description: prompt`
    Persist a structured pocket meeting note.
    Call after you extract title, attendees, decisions, action items,
    and open questions from the user's dump. Pass noteId to update.
  `,
  effect: "write",
  inputSchema: z.object({
    noteId: z
      .string()
      .optional()
      .describe("Existing note id to update. Omit to create a new note."),
    title: z.string().min(1).describe("Short meeting title."),
    meetingAt: z
      .string()
      .nullable()
      .optional()
      .describe("ISO-8601 meeting time when known; otherwise null."),
    attendees: z.array(z.string()).default([]),
    decisions: z.array(z.string()).default([]),
    actionItems: z.array(actionItemSchema).default([]),
    openQuestions: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    raw: z
      .string()
      .nullable()
      .optional()
      .describe("Original user dump when useful for later search."),
    bodyMarkdown: z
      .string()
      .min(1)
      .describe("Readable markdown note (summary + sections)."),
  }),
  dryRunResult: (input) => ({
    saved: false,
    dryRun: true,
    id: input.noteId ?? "dry-run-id",
    title: input.title,
  }),
  async execute(input, ctx) {
    const now = new Date().toISOString();
    const id = input.noteId?.trim() || mintNoteId(input.title);

    const record: MeetingNoteRecord = {
      id,
      title: input.title.trim(),
      meetingAt: input.meetingAt ?? null,
      updatedAt: now,
      attendees: input.attendees,
      tags: input.tags,
      decisions: input.decisions,
      actionItems: input.actionItems,
      openQuestions: input.openQuestions,
      raw: input.raw ?? null,
      bodyMarkdown: input.bodyMarkdown,
    };

    await ctx.host.files.write(noteFilePath(id), JSON.stringify(record, null, 2), {
      scope: "deployment",
    });

    const prior = (await ctx.host.kv.get(NOTES_INDEX_KEY)) as NoteIndex | undefined;
    const next = upsertMeta(prior ?? emptyIndex(), toMeta(record));
    await ctx.host.kv.put(NOTES_INDEX_KEY, next);

    return {
      saved: true,
      id: record.id,
      title: record.title,
      updatedAt: record.updatedAt,
      decisionCount: record.decisions.length,
      actionItemCount: record.actionItems.length,
    };
  },
});
