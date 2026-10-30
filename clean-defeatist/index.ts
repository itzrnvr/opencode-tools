/**
 * clean-defeatist — OpenCode V2 plugin
 *
 * Adds two commands that reframe a session before the model continues:
 *
 *   /clean-defeatist
 *     Injects a cleanup request into the session context and asks the model to
 *     restate the conversation in success-oriented language.
 *
 *   /clean-defeatist-compact
 *     Does exactly the same, then queues a compaction so the cleaned summary
 *     replaces the old context.
 *
 * The cleanup instruction is injected with ctx.session.synthetic(), so the
 * model sees it without it appearing as a user-authored message.
 *
 * Docs: https://opencode.ai/v2/docs/build/plugins
 */
import { Plugin } from "@opencode/plugin"

const DEFAULT_SYNTHETIC =
  "CLEANUP REQUEST: review the conversation history and produce a cleaned version that removes all defeatist, negative, or give-up language. Rephrase in success-oriented terms: describe what worked, what to try next, and concrete next steps. Frame limitations as 'areas to refine' or 'strategies to try'."

const DEFAULT_PROMPT =
  "Please review the conversation history and produce a cleaned version that removes all defeatist/negative language, rephrasing in success-oriented terms. Focus on what worked and concrete next steps."

type Options = {
  /** Override the synthetic cleanup instruction injected into context. */
  synthetic?: string
  /** Override the prompt sent to the model. */
  prompt?: string
}

export default Plugin.define({
  id: "clean-defeatist",
  async setup(ctx) {
    const options = (ctx.options ?? {}) as Options
    const synthetic = options.synthetic ?? DEFAULT_SYNTHETIC
    const promptText = options.prompt ?? DEFAULT_PROMPT

    await ctx.command.transform((editor) => {
      editor.add({
        name: "clean-defeatist",
        description: "Reframe the session in success-oriented language",
        execute: async ({ sessionID, prompt, delivery }) => {
          await ctx.session.synthetic({ sessionID, text: synthetic })
          await ctx.session.prompt({
            ...prompt,
            sessionID,
            text: promptText,
            delivery,
          })
        },
      })

      editor.add({
        name: "clean-defeatist-compact",
        description: "Reframe the session in success-oriented language, then compact it",
        execute: async ({ sessionID, prompt, delivery }) => {
          await ctx.session.synthetic({ sessionID, text: synthetic })
          await ctx.session.prompt({
            ...prompt,
            sessionID,
            text: promptText,
            delivery,
          })
          // Queue so compaction runs after the cleanup turn instead of racing it.
          await ctx.session.compact({ sessionID, delivery: "queue" })
        },
      })
    })
  },
})
