# pocket-meeting-notes

Agent SDK agent that turns quick meeting dumps into structured notes (decisions, action items, open questions) and stores them for later recall.

## Defaults

- **Purpose:** domain assistant for pocket meeting notes
- **Channels:** playground + HTTP (Slack optional later)
- **MCP:** none on first cut
- **Tools:** `save_meeting_note`, `find_meeting_notes`
- **Skill:** `structure-pocket-dump`

## Local loop

```bash
npx @grok/agent-sdk login
npx @grok/agent-sdk validate --dir .
npx @grok/agent-sdk dev
# playground: http://127.0.0.1:3000/playground

npx @grok/agent-sdk run --dir . --message "Standup dump: we ship Friday. Save it."
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

Save the one-time alias token from the first deploy. Manage at https://cursor.com/dashboard/deployed-agents.
