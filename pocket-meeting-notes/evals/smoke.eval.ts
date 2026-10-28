import { defineEval } from "@grok/agent-sdk/evals";

export default defineEval({
  tags: ["smoke"],
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
});
