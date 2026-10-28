# pocket-meeting-notes

Agent SDK agent that turns quick meeting dumps into structured notes, stores them locally, and can publish to **Notion** and/or **Obsidian**.

## Defaults

- **Purpose:** domain assistant for pocket meeting notes
- **Channels:** playground + HTTP (Slack optional later)
- **MCP:** Cursor-account Notion connector (`bot/mcp-connections/notion.ts`)
- **Tools:** `save_meeting_note`, `find_meeting_notes`, `publish_to_notion`, `publish_to_obsidian`, `search_notion_notes`
- **Skills:** `structure-pocket-dump`, `publish-destinations`

## Sinks

| Sink | How |
| --- | --- |
| Local | Always — `ctx.host.files` + kv index |
| Notion | Cursor account Notion MCP; optional `NOTION_PARENT_PAGE_ID` (else draft page) |
| Obsidian | Markdown under `OBSIDIAN_VAULT_PATH` / `OBSIDIAN_NOTES_FOLDER` (default `Meeting Notes`) |

Obsidian needs a real vault path on the serve host (local `dev`/`serve`, or a mounted path). Notion works wherever the Cursor account Notion connector is connected.

## Local loop

```bash
npx @grok/agent-sdk login
# Connect Notion in the Cursor dashboard if you want Notion publish.

export OBSIDIAN_VAULT_PATH="$HOME/Documents/MyVault"   # optional
# export NOTION_PARENT_PAGE_ID="..."                  # optional

npx @grok/agent-sdk validate --dir .
npx @grok/agent-sdk dev
# playground: http://127.0.0.1:3000/playground

npx @grok/agent-sdk run --dir . --message "Standup dump: we ship Friday. Save to Notion and Obsidian."
npx @grok/agent-sdk eval --dir . --tag smoke
npm run check
```

## Deploy

Do not deploy from this transcript. In your own terminal:

```bash
npx @grok/agent-sdk validate --dir .
npx @grok/agent-sdk deploy --dir . --dry-run
npx @grok/agent-sdk deploy --dir .
```

Set secrets `OBSIDIAN_VAULT_PATH` / `OBSIDIAN_NOTES_FOLDER` / `NOTION_PARENT_PAGE_ID` only if the host can use them. Connect Notion under Deployed Agents. Save the one-time alias token from the first deploy.
