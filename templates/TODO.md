# TODO

task_pool_model: true

## Now

- [ ] Capture incoming requirements, bugs, UI/UX work, improvements, and follow-ups into `docs/initiatives/planned/`.
- [ ] Confirm product requirements are complete enough to constrain implementation.
- [ ] Confirm product-level UI/UX style and any pending review images.
- [ ] Create or update `docs/product/TECH.md` and required ADRs.
- [ ] Split the first runnable initiative into fine-grained task DAG slices.

## Next

- [ ] Dispatch runnable tasks by priority, dependency, path conflicts, and parallel safety.
- [ ] Implement one verified slice at a time using Gitflow branches.
- [ ] Update acceptance records and global product docs when implementation changes contracts or project structure.
- [ ] Archive completed initiatives and sweep follow-up tasks back into the task pool.

## Later

- [ ] Run `scripts/check-initiative-package.mjs .` manually when using White Tower; only add hooks or CI if the project owner explicitly asks for hard enforcement.
- [ ] Add release handoff documentation before publishing.
