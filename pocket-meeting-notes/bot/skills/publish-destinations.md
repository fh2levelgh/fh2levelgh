---
description: Use when the user wants a note in Notion, Obsidian, both, or asks where notes should live.
---

# Publish destinations

1. Always call `save_meeting_note` first so the note has an id.
2. **Notion** — call `publish_to_notion` with that id. Omit parent unless the user named one; draft mode is fine.
3. **Obsidian** — call `publish_to_obsidian` when they want the vault. If it returns `obsidian_vault_unset`, tell them to set `OBSIDIAN_VAULT_PATH`.
4. **Both** — publish to each sink they named. Report each outcome with links/paths.
5. Recall: local `find_meeting_notes` first; use `search_notion_notes` when they mean Notion history.
