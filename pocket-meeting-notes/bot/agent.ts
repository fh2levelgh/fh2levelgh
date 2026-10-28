import { defineAgent } from "@grok/agent-sdk";

export default defineAgent({
  name: "pocket-meeting-notes",
  description:
    "Capture pocket meeting dumps, structure decisions and action items, and recall prior notes.",
  model: {
    id: "grok-4.7",
    params: [
      { id: "reasoning_effort", value: "high" },
      { id: "fast", value: "true" },
    ],
  },
});
