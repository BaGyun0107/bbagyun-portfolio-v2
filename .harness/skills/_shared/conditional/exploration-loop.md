# Exploration Loop (Hypothesis-Driven)

Transforms the reactive "fix what's broken" pattern into a proactive
"explore alternatives, pick the best."

---

## When to Activate

The Exploration Loop activates **only** when reactive fixing has failed:

| Condition | Detail |
|-----------|--------|
| **Same test/verification fails twice consecutively, same root cause** | See the retry strategy in `.harness/policies/tdd.md` |
| **User explicitly requests** exploration | "Try a few approaches and pick the best" |

Before activating, rerun the failing test or check once to rule out a flaky
or intermittent failure. Only a reproducible failure at the same point with
the same root cause qualifies.

Do NOT activate for:
- First-attempt implementations (try the standard approach first)
- Simple bug fixes with obvious solutions
- Trivial changes (formatting, naming)
- Flaky or intermittent failures (stabilize the test instead)

---

## Exploration Protocol

### Step 1: Hypothesize

Form at most 3 alternative hypotheses about the root cause and fix:

```
=== Exploration Decision ===
Problem: {what needs to be solved}
Failing test/check: {exact command and captured failure output}
Attempts so far: {count and outcomes}

Hypothesis A: ...
Hypothesis B: ...
Hypothesis C (optional): ...
```

### Step 2: Experiment

Execute each hypothesis **in isolation**:

- Execute sequentially: try A → run the failing test/check → stash/revert →
  try B → run → stash/revert
- Use `git stash` or a branch per experiment so attempts never mix
- Capture the test output and verification evidence from every attempt

### Step 3: Compare

Compare hypotheses by **test results and verification evidence**, not by
self-assigned scores:

```markdown
### Exploration Results

| Hypothesis | Failing test/check | Other tests | Verification evidence |
|-----------|--------------------|-------------|-----------------------|
| A | still fails (same assertion) | green | error output unchanged |
| B | passes | green | focused + broader run output captured |

Winner: Hypothesis B (failing check passes; no regressions)
```

A hypothesis wins only on observed evidence: the previously failing
test/check passes, no other test regresses, and the verification commands
were actually run with their output captured.

### Step 4: Select

- If one hypothesis makes the failing test/check pass without regressions,
  keep it and discard the others.
- If none passes within the allowed rounds, keep the least-broken state,
  record the blocker (what was tried, with the evidence for each attempt),
  and surface it to the user.

### Step 5: Record

Record every hypothesis (kept and discarded) with its evidence in the active
work state — `.planning/` for GSD-managed work, otherwise the session's
working notes — so a later attempt does not repeat a discarded fix.

---

## Constraints

| Constraint | Value | Rationale |
|-----------|-------|-----------|
| Max hypotheses per round | 3 | Diminishing returns; keeps within turn budget |
| Max exploration rounds per session | 2 | Prevents infinite exploration |
| Max turns per hypothesis experiment | 10 | Scoped to focused changes |

If both rounds are exhausted without a passing result, stop, record the
blocker, and surface it to the user per `.harness/policies/tdd.md`.
