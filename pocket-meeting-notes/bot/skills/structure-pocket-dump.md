---
description: Use when the user pastes a rough voice dump, bullet mess, or partial meeting recollection that needs structuring before save.
---

# Structure a pocket dump

1. Infer a short **title** (topic + context). Ask only if nothing is inferable.
2. Pull **attendees** when names appear; leave empty rather than inventing.
3. Separate **decisions** (agreed outcomes) from **open questions**.
4. Turn commitments into **action items** with `owner`, `task`, and `due` when stated.
5. Write concise `bodyMarkdown` with sections: Summary, Decisions, Action items, Open questions.
6. Call `save_meeting_note` with the structured fields. Include `raw` when the dump is messy.
7. If the user named Notion and/or Obsidian, publish with those tools after save.
8. Reply with the saved note id, a 2–4 sentence summary, action items as a checklist, and destination links/paths.
