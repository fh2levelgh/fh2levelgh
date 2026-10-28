import { defineAgent } from "@grok/agent-sdk";

export default defineAgent({
  name: "pocket-meeting-notes",
  description:
    "Capture pocket meeting dumps, structure decisions and action items, and publish to Notion and/or Obsidian.",
  model: {
    id: "grok-4.7",
    params: [
      { id: "reasoning_effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
  hosting: {
    secretNames: ["OBSIDIAN_VAULT_PATH", "OBSIDIAN_NOTES_FOLDER", "NOTION_PARENT_PAGE_ID"],
  },
});
