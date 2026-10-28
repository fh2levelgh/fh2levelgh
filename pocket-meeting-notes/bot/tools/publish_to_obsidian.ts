import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { prompt } from "@grok/agent-sdk";
import { defineTool } from "@grok/agent-sdk/tools";
import * as z from "zod/v4";
import {
  formatNoteMarkdown,
  loadNote,
  obsidianFrontmatter,
  slugify,
  writeNote,
  type MeetingNoteRecord,
} from "../lib/notes.js";

function vaultRoot(): string | undefined {
  const raw = process.env.OBSIDIAN_VAULT_PATH?.trim();
  return raw && raw.length > 0 ? raw : undefined;
}

function notesFolder(): string {
  return process.env.OBSIDIAN_NOTES_FOLDER?.trim() || "Meeting Notes";
}

function safeFileName(record: MeetingNoteRecord): string {
  const day = (record.meetingAt ?? record.updatedAt).slice(0, 10);
  return `${day}-${slugify(record.title)}.md`;
}

export default defineTool({
  description: prompt`
    Publish a saved pocket meeting note into an Obsidian vault as Markdown.
    Requires OBSIDIAN_VAULT_PATH on the serve host. Optional OBSIDIAN_NOTES_FOLDER
    (default "Meeting Notes").
  `,
  effect: "write",
  inputSchema: z.object({
    noteId: z.string().min(1).describe("Id returned by save_meeting_note."),
    subfolder: z
      .string()
      .optional()
      .describe("Override the notes folder under the vault for this write."),
  }),
  dryRunResult: ({ noteId }) => ({
    published: false,
    dryRun: true,
    noteId,
    sink: "obsidian",
  }),
  async execute({ noteId, subfolder }, ctx) {
    const root = vaultRoot();
    if (!root) {
      return {
        published: false,
        error: "obsidian_vault_unset",
        noteId,
        message:
          "Set OBSIDIAN_VAULT_PATH to your vault root (local serve or a mounted path on the host).",
      };
    }

    const note = await loadNote(ctx.host.files, noteId);
    if (!note) {
      return { published: false, error: "note_not_found", noteId };
    }

    const folder = subfolder?.trim() || notesFolder();
    const relative = path.join(folder, safeFileName(note));
    const absolute = path.resolve(root, relative);
    const resolvedRoot = path.resolve(root);
    if (absolute !== resolvedRoot && !absolute.startsWith(resolvedRoot + path.sep)) {
      return {
        published: false,
        error: "path_escape",
        noteId,
        message: "Resolved note path left the vault root.",
      };
    }

    const body = obsidianFrontmatter(note) + formatNoteMarkdown(note);
    await mkdir(path.dirname(absolute), { recursive: true });
    await writeFile(absolute, body, "utf8");

    const updated: MeetingNoteRecord = {
      ...note,
      destinations: {
        ...note.destinations,
        obsidianPath: relative,
      },
    };
    await writeNote(ctx.host.files, updated);

    return {
      published: true,
      sink: "obsidian",
      noteId,
      vaultPath: root,
      relativePath: relative,
      absolutePath: absolute,
    };
  },
});
