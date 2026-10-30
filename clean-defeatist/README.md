# clean-defeatist

An OpenCode V2 plugin that adds two commands for cleaning up defeatist framing in a long session.

## Commands

### `/clean-defeatist`

1. Injects a synthetic cleanup request into the session context.
2. Sends a prompt asking the model to restate the conversation in success-oriented terms.

The synthetic message is visible to the model but does not appear as a user-authored message.

### `/clean-defeatist-compact`

Does exactly what `/clean-defeatist` does, then queues a compaction. The compaction runs after the cleanup turn, so the cleaned summary replaces the old context instead of racing the cleanup request.

## Install

```jsonc
{
  "plugins": [
    {
      "package": "/absolute/path/to/opencode-tools/clean-defeatist",
      "options": {
        // optional overrides
        "synthetic": "...",
        "prompt": "..."
      }
    }
  ]
}
```

Or copy/symlink this directory into `.opencode/plugins/clean-defeatist/`.

Restart OpenCode after changing the config:

```sh
opencode service restart
```

## Options

| Option | Default | Description |
| --- | --- | --- |
| `synthetic` | built-in cleanup request | Text injected with `ctx.session.synthetic()`. |
| `prompt` | built-in cleanup prompt | Text sent to the model with `ctx.session.prompt()`. |

## How it works

The plugin registers both commands through `ctx.command.transform()`.

`/clean-defeatist` calls:

```ts
await ctx.session.synthetic({ sessionID, text: synthetic })
await ctx.session.prompt({ ...prompt, sessionID, text: promptText, delivery })
```

`/clean-defeatist-compact` runs the same two calls and then:

```ts
await ctx.session.compact({ sessionID, delivery: "queue" })
```

`delivery: "queue"` is intentional: compaction must run after the cleanup turn, not concurrently with it.

## Requirements

- OpenCode V2 (`2.0.x`).
- The plugin API from `@opencode/plugin` (provided by OpenCode at runtime).

## License

MIT
