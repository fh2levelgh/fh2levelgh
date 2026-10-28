import { defineEval } from "@grok/agent-sdk/evals";

export default defineEval({
  tags: ["smoke"],
  cases: [
    {
      id: "save-local",
      description: "A messy dump is saved via save_meeting_note.",
      async test(t) {
        await t.send(
          [
            "Pocket dump from standup:",
            "me and Priya talked about the churn dashboard.",
            "we decided to ship the cohort chart Friday.",
            "Priya will pull retention numbers by Wed.",
            "still unclear if finance wants weekly or monthly.",
            "Save this as a meeting note.",
          ].join(" "),
        );
        t.succeeded();
        t.calledTool("save_meeting_note");
        t.notCalledTool("echo");
      },
    },
    {
      id: "publish-both",
      description: "User asks for Notion and Obsidian after a dump.",
      async test(t) {
        await t.send(
          [
            "Quick notes: decided to freeze scope for v1.",
            "Alex owns the changelog by Thursday.",
            "Save it and publish to Notion and Obsidian.",
          ].join(" "),
        );
        t.succeeded();
        t.calledTool("save_meeting_note");
        t.calledTool("publish_to_notion");
        t.calledTool("publish_to_obsidian");
      },
    },
  ],
});
