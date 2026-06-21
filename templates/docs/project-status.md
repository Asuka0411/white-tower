# Project Status

current_stage: 3-prepare-development

gate_mode: source-locked

allowed_actions:
- update-docs
- create-product-requirements
- create-experience-design
- create-architecture
- create-technical-plan
- create-adr
- create-workstream
- create-todo
- update-gate-checks

blocked_actions:
- initialize-app-code
- implement-feature
- add-runtime-dependency
- create-deployment

gate_to_next_stage:
- docs/architecture.md exists
- docs/technical-plan.md exists
- TODO.md exists and has ordered implementation slices
- docs/adr/ contains at least one accepted architecture decision
- at least one workstream is active with allowed paths and verification steps

last_verified:
- node scripts/check-stage-gate.mjs
