# Lessons Learned — Template and Guidance

This file is an upstream-owned template: it defines the lesson entry format and
the rules for when a lesson must be recorded. It is NOT an accumulating log.
Accumulated lessons are recorded in the project's GSD `.planning/` state (or in
`.harness/skills-local/` for skill-shaped lessons), NEVER in this upstream-owned
file — downstream writes to `.harness/skills/` are blocked and overwritten by
`./harness update --apply-harness`.

---

## When to Record a Lesson

Recording is required when any of the following occurs:

| Trigger | Deadline |
|---------|----------|
| Verification failure (a verify/test command exits non-zero after a fix attempt) | Before retry |
| Same error type occurs 2+ times in a session | Immediate |
| User explicitly requests "don't do this again" | Before next action |

Once a trigger fires, add the lesson to the project's `.planning/` state before
closing out the work — it is not optional.

## When to Read Recorded Lessons

- Complex task start: review the project's recorded lessons for the relevant
  domain to prevent repeating mistakes
- Medium tasks: reference if related items exist
- Simple tasks: can skip

---

## Lesson Entry Format

```markdown
### {YYYY-MM-DD}: {domain} - {one-line summary}
- **Problem**: {what went wrong - be specific}
- **Root Cause**: {why it happened - go deeper than surface}
- **Fix Applied**: {how it was resolved this time}
- **Prevention**: {process/prompt change to prevent recurrence}
```

Group entries by domain inside the project's lesson record (for example:
Backend, Frontend, Mobile, QA / Security, Debug, Cross-Domain) so future work
in the same domain can find them.

---

## Maintenance (of the project's lesson record)

When lessons become too many (50+):

- Move old lessons (6+ months) to archive
- Delete lessons invalidated by framework version upgrades
- This cleanup is performed manually (agents should not delete arbitrarily)
