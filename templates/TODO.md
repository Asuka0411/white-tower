# TODO

current_stage: 3-准备开发

## Now

- [ ] Confirm product requirements are complete enough to constrain implementation.
- [ ] Confirm interface design covers required pages, states, and interaction rules.
- [ ] Create or update `docs/architecture.md`.
- [ ] Create at least one accepted architecture decision in `docs/adr/`.
- [ ] Split the first implementation workstream into small TODO slices.

## Next

- [ ] Move `gate_mode` to `development` only after stage 3 exit criteria are met.
- [ ] Implement one verified slice at a time.
- [ ] Update documentation when implementation changes contracts or project structure.

## Later

- [ ] Run `scripts/check-stage-gate.mjs` manually when using White Tower; only add hooks or CI if the project owner explicitly asks for hard enforcement.
- [ ] Add release handoff documentation before publishing.
