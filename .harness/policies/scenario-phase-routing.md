# Scenario Phase Routing

Use this policy when a request describes a work scenario rather than one small
edit. This is the canonical harness map for Spec Kit and Superpowers
routing. Other entrypoints should summarize or link here instead of
duplicating the full table.

## Core Rules

- The 1-5 phase model is a development thinking flow, not a local feature-spec
  file convention.
- Use the smallest useful role set for the actual risk. Do not run Spec Kit
  and Superpowers together by default.
- For durable per-feature state, use Spec Kit and commit its
  `specs/<NNN-feature>/` output (spec.md, plan.md, tasks.md, and design
  artifacts). The spec directory is a shared team asset committed via git.
  Cross-feature overview lives in a thin, manually maintained root
  `ROADMAP.md` (feature, status, `specs/NNN` link per row) — Spec Kit keeps
  no cross-feature state of its own.
- The Spec Kit command surface is installed per runtime by `specify init` /
  `specify integration install` (Claude Code and Codex both). Both runtimes
  install the same hyphenated skill names (`speckit-specify`,
  `speckit-clarify`, `speckit-plan`, `speckit-tasks`, `speckit-analyze`,
  `speckit-implement`, `speckit-converge`) — use these names as written;
  there is no separate logical-name layer.
- Every specify/tasks invocation must explicitly request test tasks
  ("include test tasks (TDD)") — Spec Kit generates test tasks only on
  request.
- `speckit-constitution` runs once per project before the first feature. For
  projects initialized before this rule existed, run it retroactively before
  the next feature — a placeholder constitution leaves the Constitution Check
  in `speckit-plan` / `speckit-analyze` inert, and `./harness doctor` flags
  it (state-based, so new and existing projects converge on the same path).
- Steps may be chained in a single instruction ("run specify through tasks,
  batch clarify questions, stop at tasks.md"). Two human gates must never be
  skipped: answering clarify questions and reviewing tasks.md before
  implementation starts.

## Session Continuity

Before starting new Medium or larger work, check for in-flight Spec Kit
features:

- If any `specs/<NNN-*>/tasks.md` has unchecked items, resume that feature
  before opening new work unless the user explicitly redirects. Unchecked
  tasks.md items plus `.specify/` state are the checkpoint.
- Resume by reading the feature's spec.md summary, plan.md, and the unchecked
  tasks — do not re-derive intent from chat history.
- Audit records live in `docs/audits/` (harness-owned, active). A leftover
  legacy `.planning/` directory is scheduled for removal — follow
  `docs/audits/2026-07-07-planning-retirement.md` (distill -> `git rm`; git
  history is the archive); never read or update it for routing.

This keeps Claude Code, Codex, and different local machines aligned around the
same durable state instead of chat history.

## Plan of Record

For Medium+ work, the plan of record lives in `specs/<NNN-feature>/` —
created through the Spec Kit flow (`speckit-specify` -> `speckit-clarify` ->
`speckit-plan` -> `speckit-tasks`) **before implementation starts**. Rule of
thumb: if the work deserves a plan document, that document is a spec
directory.

- Exploration is free-form. Superpowers `brainstorming`, chat discussion, and
  scratch notes may happen anywhere; their outputs (`docs/superpowers/**`,
  `docs/plans/**`) are input material — feed them to `speckit-specify` —
  never the plan of record.
- A plan that exists only in chat or only as a claude.ai Artifact is not a
  plan of record. Store it in the repo so the next session, the other
  runtime, and teammates can find it.
- This section is runtime-neutral. The Claude mirror is the "Plan-of-Record
  Gate" in `.claude/rules/phase-routing.md`; the Codex Medium+ Hard Gate
  below applies the same rule (item 4). `guardrails.mjs` assists with
  non-blocking reminders only; the destination rule itself is the control.

## Phase Map

| Phase | Default route | Conditional skills |
| --- | --- | --- |
| P1 Strategy | Superpowers `brainstorming` for creative/product/architecture changes; otherwise direct strategy discussion | — |
| P2 Specify and plan | `speckit-specify` (request test tasks) -> `speckit-clarify` -> `speckit-plan` -> `speckit-tasks` -> `speckit-analyze`; `speckit-constitution` once per project before the first feature | Superpowers `writing-plans` only when a separate implementation plan is useful, `using-git-worktrees` |
| P3 Execution | Implement guided by unchecked tasks.md items under harness discipline; Superpowers `test-driven-development`, `systematic-debugging`, `executing-plans`. The implement step never commits — atomic commits and quality/e2e gates are harness rules | Superpowers `dispatching-parallel-agents`, `subagent-driven-development`; Playwright MCP browser QA for ad-hoc page checks |
| P4 Review and verification | `speckit-converge` until "Converged"; Superpowers `requesting-code-review`, `receiving-code-review`, `verification-before-completion`; record verification evidence in the spec directory (verification.md) | Playwright MCP browser QA when a user-facing flow needs live verification |
| P5 Ship and completion | Converge green -> update root `ROADMAP.md` status -> PR flow from the spec directory; Superpowers `finishing-a-development-branch` | — |

## Automated Feature Loop (Opt-In)

After the clarify gate, the remaining pipeline may run as one supervised
automation via the `codi-auto-loop` skill: plan -> tasks -> analyze, a
mandatory pause at the tasks.md review gate, then implement -> verify ->
review -> converge repeated until converge reports "Converged" with a green
verification chain. The two human gates above still apply - the loop never
answers clarify questions itself and always pauses for the tasks.md review.
Stop conditions (the same failure surviving three rounds, a fix that would
change spec requirements, any skill-raised confirmation gate, or
approval-required operations) return control to the user. Run the loop only
when the user asks for it; it is not a default phase step.

## Browser QA via Playwright MCP

Ad-hoc browser QA (page loads, snapshots, form interaction, screenshots)
runs through the Playwright MCP server registered at the user level for
both runtimes; real-browser session cases (device auth, complex logins)
use claude-in-chrome. Permission direction and the version pin live in
`tool-permissions.md`.

History: the previous gate/browser tool suite was demoted to opt-in on
2026-07-06 (zero gate usage in five weeks,
`docs/audits/2026-07-06-skill-usage-audit.md`) and fully removed on
2026-08-06 by user decision after the recheck
(`docs/audits/2026-08-06-skill-usage-recheck.md`); Playwright MCP replaced
its browser utility (see `specs/018-gstack-to-playwright-mcp/`). Reinstall
path: `.harness/docs/gstack-rollback.md`.

## Scenario Defaults

| Scenario | Default route |
| --- | --- |
| In-flight feature (unchecked `specs/*/tasks.md` items) | Resume that feature first; new work waits or gets its own spec |
| New project | P1 when strategy is unclear; `speckit-constitution` once, then the first feature's specify flow |
| Brownfield large feature | Superpowers `brainstorming` output feeds `speckit-specify` |
| Plan a feature | `speckit-specify` -> `speckit-clarify` -> `speckit-plan` -> `speckit-tasks`, with `speckit-analyze` before implementation |
| Execute a feature | tasks.md-guided implementation plus Superpowers TDD unless docs-only, config-only, or explicitly exempt |
| Bug fix | Superpowers `systematic-debugging`; add a spec only when the fix spans features, sessions, or release risk |
| Review or verification request | `speckit-converge` + Superpowers `verification-before-completion`; Playwright MCP browser QA when live verification helps |
| Ship preparation | Converge green -> PR flow; AI may create PRs but must not merge |

## Size Routing

The main orchestrator owns the size decision. User-provided size is useful
intent, but repository context, risk, and reversibility decide the route.
Size is a routing decision, not an estimate of elapsed time or file count.

| Size | Criteria | Default route |
| --- | --- | --- |
| Small | Direction is fixed, local, reversible, and mechanical. The user names the exact target or the target is obvious, no product/API/security/data decision is needed, and verification is direct. Examples: typo, literal value change, obvious docs edit, simple rename with clear scope. | Direct handling |
| Medium | The work has one coherent outcome, but the agent must decide what to inspect, what to change, or how to verify it. This can still be one file. Examples: small bug fix, policy/doc change with consistency updates, local behavior change, config change with tradeoffs. | Phase-specific routing with the smallest useful external tool set |
| Large | Medium plus multiple stages, multiple subsystems, broad cross-file impact, user-visible workflow change, API/contract change, role review, handoff, or likely session continuity needs. | Spec Kit feature flow (specify through converge) |
| Extra large or risky | Large plus high-impact or hard-to-reverse risk: production, deploy/rollback, CI/CD, infrastructure, database schema or data movement, auth, permissions, payments, security, secrets, privacy/compliance, destructive operations, generated mass rewrites, or breaking public contracts. | Full feature flow with explicit checkpoints at every stage gate |

### Size Decision Rules

- Small requires all of these: fixed direction, obvious target, localized edit,
  low blast radius, easy rollback, and direct verification.
- Any open design choice, uncertain root cause, unclear target, behavioral
  change, or need to inspect before deciding makes the work at least Medium.
- Use Large when the work needs a durable plan, spans more than one ownership
  boundary, affects user workflows or contracts, or would benefit from role
  review before implementation.
- Use Extra large or risky when failure can damage production, data, security,
  money movement, access control, deployment safety, or trust.
- Escalate immediately if new information raises risk. De-escalate only when
  evidence shows the work is localized, reversible, and directly verifiable.
- When tied, choose the smaller route only if the change is reversible, local,
  and directly verifiable. Otherwise choose Medium or Large.

Non-signals: keyword matching, raw file count, and user-provided size labels.
A one-line auth change can be risky; a many-file mechanical formatting change
can be Small if it is generated, reversible, and directly verifiable. If a
Small task exposes a decision point, stop, declare Medium, and route
accordingly.

### Boundary rules for inferred risk

The explicit keyword surfaces in the Extra-large row (production, deploy, auth,
payments, database schema, secrets, security) are unambiguous: when the scenario
names them, route Extra large or risky. The rules below resolve the cases where
risk must be *inferred* rather than read from the scenario text.

- External infrastructure or storage integration (object storage, S3, a managed
  queue, a CDN, a third-party API): Extra large or risky **only when** it
  introduces a new secret/credential or a new production deployment path.
  Reusing an already-provisioned credential and an existing deployment path
  makes a multi-subsystem feature Large, not Extra large. Worked example: a file
  upload that stores to an existing, already-credentialed bucket and touches
  front and back is Large; the same feature that provisions a brand-new bucket
  and its access keys is Extra large or risky.
- Untrusted external input that the feature must accept and process (file or
  image uploads, multipart bodies, webhooks from outside): this is a security
  surface in itself, so the work is at least Large. It becomes Extra large or
  risky when combined with auth, payments, or persistence of the untrusted data
  into production storage.
- Blast radius is measured by contract change, not by the number of consuming
  files. Changing a value in a shared package (design tokens, a shared util)
  stays Medium when only the rendered/produced value changes and rollback is a
  one-line revert; it becomes Large when the change alters a contract or
  behavioral meaning (a component API, a token's semantic role, an exported
  signature) that consumers depend on.
- "Need to inspect before deciding makes it at least Medium" has one carved-out
  exception: a dependency bump that is lockfile-only, already green on CI, and
  reverts by restoring the lockfile may stay Small. Major-version bumps, runtime
  or engine changes, and security patches are at least Medium regardless.

## Automation Boundary

- Claude Code: `.claude/settings.json` runs the skill injector hook on every
  prompt and can suggest skills.
- Codex: `./harness codex` runs `.harness/scripts/agent/agent-preflight.sh` once
  at startup. Codex must apply this policy directly on later turns.

## Codex Medium+ Hard Gate

This gate is runtime-neutral in intent: Claude Code applies the equivalent
always-loaded gate in `.claude/rules/phase-routing.md` ("Medium+ Hard Gate"),
and Codex applies the checklist below. Both runtimes must declare Size before
implementing Medium+ work; Small work is never gated.

Codex has no per-prompt UserPromptSubmit hook, so Medium or larger work must
start with an explicit routing gate in the current turn:

1. Load and apply `codi-phase-routing` before implementation.
2. Check for in-flight features before opening new Medium+ work: any
   `specs/<NNN-*>/tasks.md` with unchecked items must be resumed or
   explicitly deferred by the user first.
3. Choose Spec Kit for durable state, or explicitly state why a spec is not
   being created.
4. Superpowers `docs/superpowers/*` must not replace `specs/<NNN-feature>/`;
   use Superpowers for execution discipline, not feature state.
5. Decide subagent routing before inline execution. If independent workstreams
   exist, spawn subagents when repo/user instructions explicitly allow it and
   the runtime supports it; otherwise ask the user before falling back inline.
6. Declare relevant Codi stack skills before app implementation.
7. Confirm commit permission. Do not commit only because a downstream skill says
   to commit.

For Medium+ app work, split frontend/backend work, scaffold/import work, or any
multi-stage implementation: absence of `specs/` is not a no-spec reason. It
means Codex must run `speckit-specify` (and the rest of the planning stages)
before implementation. Existing unchecked tasks.md items are an even stronger
signal: Codex must resume from them before subagent, design, or implementation
gates. Skimming spec files without adopting their unchecked tasks is not a
substitute for resuming the feature.
After declaring `Size: Large` or larger, Codex must not downshift the same task
to a "small scaffold" or "mock-data-only" exemption to skip the spec flow.
Reclassify only when new evidence proves the work is localized, single-stream,
and directly verifiable; split frontend/backend scaffolds are not
single-stream.

No-spec is allowed only for clearly Small work, docs-only edits, mechanical
config-only edits, or when the Spec Kit command surface is unavailable. If
Codex chooses no-spec for Medium+ work, it must stop before implementation and
state the exemption.

Codex preflight and review handoffs should keep this checklist visible:
`spec? unchecked tasks? subagents? Codi skills? commit permission?`
