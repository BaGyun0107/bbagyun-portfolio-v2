# Difficulty Assessment & Protocol Branching

All agents assess task size at the start and apply the appropriate protocol
depth. This guide is the size-assessment step (Step 0, item 1) of the codi-*
execution protocols. The official Size system in
`.harness/policies/scenario-phase-routing.md` (Size Routing and Size Decision
Rules) is the source of truth; this guide maps each size to a protocol depth.

## Size Classification

Sizes are **Small**, **Medium**, **Large**, and **Extra large or risky**.
Size is a routing decision driven by decision load, blast radius, and
reversibility.

### Small

Small requires ALL six signals. If any one is missing, the work is at least
Medium.

- Fixed direction (no open product/design choice)
- Obvious target (named by the user or unambiguous)
- Localized edits
- Easy rollback
- Low blast radius
- Direct verification

### Medium

Medium starts as soon as the agent must decide **what to inspect, what to
change, or how to verify** — even when the change is one file. Examples: a bug
fix with an uncertain root cause, a behavior change, a config change with
tradeoffs.

### Large

Medium plus any of:

- Multiple ownership boundaries or subsystems
- Role review gates or handoff between agents or sessions
- User-visible workflow change or API/contract impact
- The work needs a durable plan

### Extra large or risky

Large plus high-impact or hard-to-reverse risk: production, deploy/rollback,
CI/CD, infrastructure, database schema or data movement, auth, permissions,
payments, security, secrets, privacy/compliance, or destructive operations.

### Non-signals

- **File count is NOT a size signal.** A one-line auth change can be Extra
  large or risky; a many-file mechanical rewrite can be Small if it is
  generated, reversible, and directly verifiable.
- **Turn count and expected elapsed time are NOT size signals.**
- Keyword matching and user-provided size labels are also non-signals;
  repository context, risk, and reversibility decide.

---

## Protocol Branching

### Small → Fast Track
1. ~~Step 1 (Analyze)~~: Skip — proceed directly to implementation
2. **Pre-check**: Confirm whether test files exist for the target module (e.g., `__tests__/`, `*.test.*`)
3. Step 3 (Implement): Implementation
4. Step 4 (Verify): Minimal checklist items:
   - All `Code Quality` items from `common-checklist.md`
   - `Tests actually assert meaningful behavior` (if tests exist or were added)
   - Run existing tests to verify no regressions

### Medium → Standard Protocol
1. Step 1 (Analyze): Brief
2. Step 2 (Plan): Brief
3. Step 3 (Implement): Full
4. Step 4 (Verify): Full

### Large → Extended Protocol (Sprint-Based)

1. Step 1 (Analyze): Full + explore existing code
2. Step 2 (Plan): Full + **decompose into 2-4 feature-focused sprints**
   - Each sprint = independently testable deliverable
   - Target: 5-8 turns per sprint (pacing for the context budget, not a size signal)
   - Record sprint plan in `progress-{agent-id}.md`
3. **Sprint Loop** (repeat per sprint):
   - Step 3 (Implement): Current sprint's features only
   - Step 3.5 (Sprint Gate):
     - [ ] Sprint deliverable complete
     - [ ] lint/test pass
     - If sprint took 2x expected turns → write checkpoint and inform user
       (see `context-budget.md` Standalone Agent Mode)
   - On gate pass → next sprint
4. Step 4 (Verify): Full + `common-checklist.md`

#### Sprint Decomposition Example

Task: "JWT auth + CRUD API + tests"
- Sprint 1: User model + auth endpoints (register/login)
- Sprint 2: CRUD endpoints + validation
- Sprint 3: Tests + error handling

### Extra large or risky → Extended Protocol + Explicit Checkpoints

Run the Large protocol, plus:

- Insert an explicit user checkpoint before each high-impact step
  (production, deploy/rollback, schema or data movement, auth/security,
  destructive operations)
- Follow the approval rules in `.harness/policies/guardrails.md`

---

## Difficulty Misjudgment Recovery

- Started as Small but a decision point appeared → switch to the Medium
  protocol, record in progress
- Started as Medium but ownership boundaries, role gates, handoff, or
  user/API impact appeared → upgrade to Large
- At any size, new information exposing production, deploy, CI/CD, data,
  auth, security, or destructive risk → escalate to Extra large or risky
  immediately
- Started as Large but actually small → just finish quickly (minimal
  overhead); de-escalate only when the work proves localized, reversible, and
  directly verifiable
