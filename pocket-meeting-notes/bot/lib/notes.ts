/** Shared note storage helpers. Tools own the side effects. */

export type MeetingNoteMeta = {
  id: string;
  title: string;
  meetingAt: string | null;
  updatedAt: string;
  attendees: string[];
  tags: string[];
};

export type NoteDestinations = {
  notionPageId?: string;
  notionUrl?: string;
  obsidianPath?: string;
};

export type MeetingNoteRecord = MeetingNoteMeta & {
  decisions: string[];
  actionItems: Array<{ owner: string | null; task: string; due: string | null }>;
  openQuestions: string[];
  raw: string | null;
  bodyMarkdown: string;
  destinations?: NoteDestinations;
};

export function formatNoteMarkdown(record: MeetingNoteRecord): string {
  // Structured fields are the source of truth for sinks; bodyMarkdown is summary only.
  const lines: string[] = [];
  lines.push(`# ${record.title}`);
  lines.push("");
  if (record.meetingAt) lines.push(`- Meeting: ${record.meetingAt}`);
  if (record.attendees.length > 0) {
    lines.push(`- Attendees: ${record.attendees.join(", ")}`);
  }
  if (record.tags.length > 0) lines.push(`- Tags: ${record.tags.map((t) => `#${t}`).join(" ")}`);
  lines.push("");
  lines.push("## Summary");
  lines.push(record.bodyMarkdown.trim());
  lines.push("");
  if (record.decisions.length > 0) {
    lines.push("## Decisions");
    for (const d of record.decisions) lines.push(`- ${d}`);
    lines.push("");
  }
  if (record.actionItems.length > 0) {
    lines.push("## Action items");
    for (const a of record.actionItems) {
      const owner = a.owner ? `${a.owner}: ` : "";
      const due = a.due ? ` (due ${a.due})` : "";
      lines.push(`- [ ] ${owner}${a.task}${due}`);
    }
    lines.push("");
  }
  if (record.openQuestions.length > 0) {
    lines.push("## Open questions");
    for (const q of record.openQuestions) lines.push(`- ${q}`);
    lines.push("");
  }
  return lines.join("\n").trim() + "\n";
}

export function obsidianFrontmatter(record: MeetingNoteRecord): string {
  const tags = ["meeting", ...record.tags].map((t) => JSON.stringify(t)).join(", ");
  const attendees = record.attendees.map((a) => JSON.stringify(a)).join(", ");
  return [
    "---",
    `id: ${JSON.stringify(record.id)}`,
    `title: ${JSON.stringify(record.title)}`,
    `meeting_at: ${JSON.stringify(record.meetingAt)}`,
    `updated_at: ${JSON.stringify(record.updatedAt)}`,
    `tags: [${tags}]`,
    `attendees: [${attendees}]`,
    "---",
    "",
  ].join("\n");
}

export async function loadNote(
  files: { read: (path: string, options?: { scope?: "deployment" }) => Promise<string | undefined> },
  noteId: string,
): Promise<MeetingNoteRecord | undefined> {
  const raw = await files.read(noteFilePath(noteId), { scope: "deployment" });
  if (!raw) return undefined;
  return JSON.parse(raw) as MeetingNoteRecord;
}

export async function writeNote(
  files: {
    write: (
      path: string,
      data: string,
      options?: { scope?: "deployment" },
    ) => Promise<void>;
  },
  record: MeetingNoteRecord,
): Promise<void> {
  await files.write(noteFilePath(record.id), JSON.stringify(record, null, 2), {
    scope: "deployment",
  });
}

export type NoteIndex = {
  notes: MeetingNoteMeta[];
};

export const NOTES_INDEX_KEY = "pocket-notes:index";
export const NOTE_FILE_PREFIX = "pocket-notes/";

export function noteFilePath(id: string): string {
  return `${NOTE_FILE_PREFIX}${id}.json`;
}

export function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base.length > 0 ? base : "note";
}

export function mintNoteId(title: string, now: Date = new Date()): string {
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z");
  return `${stamp}-${slugify(title)}`;
}

export function emptyIndex(): NoteIndex {
  return { notes: [] };
}

export function upsertMeta(index: NoteIndex, meta: MeetingNoteMeta): NoteIndex {
  const rest = index.notes.filter((n) => n.id !== meta.id);
  return {
    notes: [meta, ...rest].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  };
}

export function toMeta(record: MeetingNoteRecord): MeetingNoteMeta {
  return {
    id: record.id,
    title: record.title,
    meetingAt: record.meetingAt,
    updatedAt: record.updatedAt,
    attendees: record.attendees,
    tags: record.tags,
  };
}
