# Contributing

Thanks for improving Product Stage Gates.

## Development Principles

- Keep the workflow deterministic where possible.
- Prefer repository files over chat-only context.
- Keep templates small enough to copy into real projects.
- Do not add framework-specific assumptions unless they are clearly optional.
- Update `README.md` when behavior, installation, or template usage changes.

## Pull Request Checklist

- The change has a clear use case.
- The skill instructions still describe the actual template behavior.
- `node templates/scripts/check-stage-gate.mjs` runs successfully from this repository.
- Documentation examples stay copy-pasteable.
- The change does not introduce secrets, private paths, or project-specific data.

## Commit Style

Use concise commit messages. Examples:

```text
docs: clarify workstream gate rules
feat: add CI gate template
fix: allow docs-only bootstrap updates
```

## Reporting Issues

When opening an issue, include:

- What project stage you were in.
- The relevant `docs/project-status.md` content.
- The command you ran.
- The expected behavior.
- The actual output.
