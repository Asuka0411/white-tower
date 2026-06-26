# Contributing

Thanks for improving 白塔协议.

## Development Principles

- Keep the workflow deterministic where possible.
- Prefer repository files over chat-only context.
- Keep templates small enough to copy into real projects.
- Do not add framework-specific assumptions unless they are clearly optional.
- Update `README.md` when behavior, installation, or template usage changes.

## Pull Request Checklist

- The change has a clear use case.
- The skill instructions still describe the actual template behavior.
- `node --check templates/scripts/check-initiative-package.mjs` runs successfully.
- `node templates/scripts/check-initiative-package.mjs examples/initiative-package-demo --branch=feature/000012_260626_import_folder` runs successfully.
- `node examples/initiative-package-demo/scripts/run-edge-cases.mjs` runs successfully.
- `git diff --check` passes.
- Documentation examples stay copy-pasteable.
- The change does not introduce secrets, private paths, or project-specific data.

## Commit Style

Use concise commit messages. Examples:

```text
docs: clarify task-pool loop
feat: add initiative checker rule
fix: accept gitflow branch format
```

## Reporting Issues

When opening an issue, include:

- What task-pool state you were in.
- The relevant `docs/white-tower/status.md` content.
- The relevant initiative package path.
- The command you ran.
- The expected behavior.
- The actual output.
