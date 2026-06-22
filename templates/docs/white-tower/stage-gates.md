# Stage Gates

## Stage 1: Product Requirements

**Goal:** define what the product is, who it serves, what MVP includes, and what is explicitly out of scope.

**Required outputs:**

- `docs/prd/README.md`
- MVP scope
- user flows
- acceptance criteria
- risks and non-goals

**Blocked actions:**

- application source implementation
- runtime dependency installation

## Stage 2: Experience Design

**Goal:** make product behavior, layout priorities, interaction states, and visual direction visible before implementation.

**Required outputs:**

- `docs/uiux/README.md`
- page coverage index
- component and interaction state rules
- loading, empty, error, disabled state definitions

## Stage 3: Prepare Development

**Goal:** create durable technical context before writing product code.

**Required outputs:**

- `docs/architecture.md`
- `docs/technical-plan.md`
- `docs/adr/*.md`
- `docs/workstreams/*.md`
- `TODO.md`
- `scripts/check-stage-gate.mjs`

**Allowed actions:**

- documentation
- architecture and technical planning
- stage-gate tooling
- workstream and TODO slicing

**Blocked actions:**

- product feature implementation
- new application source roots
- runtime dependencies unrelated to gate tooling

## Stage 4: Formal Development

**Goal:** implement one small, verified slice at a time.

**Entry conditions:**

- `gate_mode: development`
- architecture and technical plan exist
- active workstream exists
- TODO slice is small and verifiable

**Required per-slice outputs:**

- implementation
- related tests or verification
- updated docs if contracts changed
- one coherent commit

## Stage 5: Release Handoff

**Goal:** make the project understandable, deployable, and recoverable without chat context.

**Required outputs:**

- accurate `README.md`
- deployment or release notes
- verification summary
- known limitations
- rollback or recovery notes when relevant
