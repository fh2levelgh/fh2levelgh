/** Shared note storage helpers. Tools own the side effects. */

export type MeetingNoteMeta = {
  id: string;
  title: string;
  meetingAt: string | null;
  updatedAt: string;
  attendees: string[];
  tags: string[];
};

export type MeetingNoteRecord = MeetingNoteMeta & {
  decisions: string[];
  actionItems: Array<{ owner: string | null; task: string; due: string | null }>;
  openQuestions: string[];
  raw: string | null;
  bodyMarkdown: string;
};

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
