<!--
Sync Impact Report
Version change: 1.0.0 → 1.1.0
Modified principles:
  - Principle 5: Enhanced from "Test-First" to strict "TDD (Red-Green-Refactor)" discipline
  - Principle 6: NEW - Conventional Commits & Atomic Changes
Added sections: None
Removed sections: None
Templates requiring updates:
✅ .specify/templates/plan-template.md (Constitution Check section)
✅ .specify/templates/spec-template.md (Test-First Strategy mentions)
✅ .specify/templates/tasks-template.md (Constitution Alignment Checklist)
Follow-up TODOs: None
-->

# Crypto Sniper Bot Constitution

## Core Principles

### 1. Ship Vertical Value Slices
Every increment must prove end-to-end value: Encore service → DB → API → Next.js dashboard. Scopes that cannot be demoed through the dashboard are rejected. Each slice documents what user-facing signal verifies success (e.g., `/health`, live trades, risk metrics). This keeps work aligned with traders’ outcomes and prevents partial infrastructure work from landing alone.

### 2. Trading Safety & Guardrails First
Risk limits, toggleable auto-trading, and config validation are non-negotiable. Any code path that could place an order must enforce `trade_config` checks, respect dry-run mode, and log rejected orders. Secrets stay in Encore config. Reviews fail if a change weakens guardrails or bypasses configuration validation.

### 3. Observability & Latency Transparency
All services emit structured logs, latency metrics, and health probes. Database writes must include timestamps, and the frontend surfaces status so operators can catch regressions quickly. Changes that introduce new flows must add metrics/traces before merge. p95 latency targets are documented per feature and verified in plans.

### 4. Type-Safe Encore Contracts
APIs live in Encore services with shared TypeScript types consumed by the generated client. Schema changes require migrations plus contract tests. Breaking changes use semantic versioning and dashboard compatibility notes. No ad-hoc REST handlers outside Encore.

### 5. TDD (Red-Green-Refactor) Discipline
Strict Test-Driven Development is mandatory: write failing tests FIRST, then implement the minimal code to pass, then refactor. Each slice defines tests before implementation: unit for pure logic, contract/integration for Encore APIs, and RTL/Playwright for dashboard pages. Tests must fail initially (Red), then pass with implementation (Green), then be refactored for clarity (Refactor). CI must run Bun/Encore tests plus frontend suites. Code reviews reject any implementation that lacks corresponding tests written first. If a test cannot be automated, the plan states the manual validation procedure and owner.

### 6. Conventional Commits & Atomic Changes
All commits MUST follow Conventional Commits format: `<type>(<scope>): <description>` where type is feat|fix|docs|test|refactor|chore|perf|ci. Each commit is atomic (single logical change), includes relevant tests, and passes CI. Commit messages are imperative mood ("add feature" not "added feature"). Breaking changes append `!` after type/scope and include `BREAKING CHANGE:` footer. Squash commits before merge to maintain clean history. Examples: `feat(monitor): add WebSocket reconnection with exponential backoff`, `test(api): add contract tests for /listings endpoint`, `fix(dashboard)!: change polling interval to 3s`, `docs(constitution): add TDD and conventional commits principles`.

## Platform Guardrails & Technology Constraints

- **Runtime stack**: Backend services in Encore.ts (Bun), typed with Effect-TS helpers where long-running workflows exist. Frontend uses Next.js 16 App Router with Tailwind v4 + shadcn/ui. Deviations need governance approval.
- **Data layer**: Neon/PostgreSQL via Encore `SQLDatabase`. Migrations live under `backend/db/migrations` and must be reversible.
- **Integrations**: MEXC REST + WebSocket only through shared clients in `backend/trade-executor/`. Secrets are managed with `encore secret`. No inline HMAC logic in feature files.
- **Performance**: Target <100 ms execution for trade paths and document reconnect/backoff strategies for WebSocket flows. Plans/specs must capture latency budgets and mitigation steps.

## Delivery Workflow & Review Gates

1. Use `/speckit.specify`, `/speckit.plan`, `/speckit.tasks`, and `/speckit.implement` sequentially per slice.
2. Constitution Check (mirrored in templates) blocks planning unless:
   - The slice reaches the dashboard or an operator-visible CLI output.
   - Risk guardrails and observability deltas are enumerated.
   - Encore contracts, migrations, and client updates are listed with rollback notes.
3. Code reviews confirm:
   - Tests were written FIRST and failed before implementation (TDD per Principle 5).
   - Commits follow Conventional Commits format (Principle 6).
   - Telemetry/latency instrumentation accompanies new flows.
   - Dashboard changes include UX screenshots or recorded states.
4. Deployments follow Encore preview → validation → main promotion. Emergency fixes still document which principle was bypassed and create a follow-up task.

## Governance

- This constitution overrides conflicting guidelines. Amendments require consensus between code owners of `backend/` and `frontend/`, plus documentation updates noted in the Sync Impact Report.
- Versioning follows SemVer: MAJOR for removing/replacing principles, MINOR for adding principles or workflow steps, PATCH for clarifications.
- Compliance review happens at PR time (checklist in templates) and during sprint demos. Non-compliance must be logged in `ai_docs/slices/` with remediation owners.
- Runtime guidance lives in `README.md` and AI slice documents; contradictions are resolved in favor of this constitution.

**Version**: 1.1.0 | **Ratified**: 2025-11-14 | **Last Amended**: 2025-11-14
