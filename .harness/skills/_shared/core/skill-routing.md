# Skill Routing Map

Routing rules for codi-orchestrator and codi-coordination to assign tasks to the correct agent.

## Progressive Disclosure

Skills use two-stage loading to optimize context usage:

1. **Stage 1 (always loaded)**: `name` and `description` from SKILL.md frontmatter
2. **Stage 2 (on explicit invocation)**: Full SKILL.md body loaded only when skill is explicitly requested via /command or agent skills field

Skills are explicitly loaded via /command invocation or agent skills field. Load full instructions only for explicitly requested skills.

---

## Skill → Agent Mapping

| Skill Domain | Primary Skill | Notes |
|----------------------|---------------|-------|
| API, endpoint, REST, GraphQL, database, migration | **codi-backend** | |
| auth, JWT, login, register, password | **codi-backend** | Auth UI task can also be created for frontend |
| UI, component, page, form, screen (web) | **codi-frontend** | |
| style, Tailwind, responsive, CSS | **codi-frontend** | |
| mobile, iOS, Android, Flutter, React Native, app | **codi-mobile** | |
| offline, push notification, camera, GPS | **codi-mobile** | |
| architecture, system design, software design, module boundary, service boundary, tradeoff, ADR, ATAM, CBAM, quality attribute | **codi-architecture** | Consult before planning when the structure itself is undecided |
| bug, error, crash, broken, slow | **codi-debug** | |
| review, security, performance | **codi-qa** | |
| accessibility, WCAG, a11y | **codi-qa** | |
| UI design, design system, landing page, DESIGN.md, color palette, typography, glassmorphism, responsive design | **codi-design** | |
| brainstorm, ideate, design, explore, idea, concept | **codi-brainstorm** | Run before codi-pm |
| plan, breakdown, task, sprint | **codi-pm** | |
| automatic, parallel, orchestrate | **codi-orchestrator** | |
| workflow, guide, manual, step-by-step | **codi-coordination** | |
| configuration management, SCM, CM, git, commit, gitflow, GitHub Flow, GitLab Flow, trunk-based branching, merge conflict, rebase, worktree, baseline, tag, release branch, signed commits, merge queue, conventional commits | **codi-scm** | SCM + Conventional Commits in one skill |

---

## Complex Request Routing

| Request Pattern | Execution Order |
|----------------|-----------------|
| "Create a fullstack app" | codi-pm → (codi-backend + codi-frontend) parallel → codi-qa |
| "Create a mobile app" | codi-pm → (codi-backend + codi-mobile) parallel → codi-qa |
| "Fullstack + mobile" | codi-pm → (codi-backend + codi-frontend + codi-mobile) parallel → codi-qa |
| "Help me choose the system architecture" | codi-architecture → codi-pm |
| "Review this architecture before we build" | codi-architecture → codi-pm → codi-qa |
| "Fix bug and review" | codi-debug → codi-qa |
| "Add feature and test" | codi-pm → relevant agent → codi-qa |
| "I have an idea for a feature" | codi-brainstorm → codi-pm → relevant agents → codi-qa |
| "Let's design something new" | codi-brainstorm → codi-pm → relevant agents → codi-qa |
| "Do everything automatically" | codi-orchestrator (internally codi-pm → agents → codi-qa) |
| "I'll manage manually" | codi-coordination |
| "Design and build a landing page" | codi-design → codi-frontend |
| "Design, build, and review" | codi-design → codi-frontend → codi-qa |
| "Redesign based on this URL" | codi-design (Phase 2 EXTRACT) → codi-frontend |

---

## Inter-Agent Dependency Rules

### Parallel Execution Possible (No Dependencies)
- codi-backend + codi-frontend (when API contract is pre-defined)
- codi-backend + codi-mobile (when API contract is pre-defined)
- codi-frontend + codi-mobile (independent of each other)

### Sequential Execution Required
- codi-architecture → codi-pm (architecture decision comes before task decomposition)
- codi-brainstorm → codi-pm (design comes before planning)
- codi-pm → all other agents (planning comes first)
- implementation agent → codi-qa (review after implementation complete)
- implementation agent → codi-debug (debugging after implementation complete)
- codi-backend → codi-frontend/codi-mobile (when executing parallel without API contract)

### QA Is Always Last
- codi-qa runs after all implementation tasks are complete
- Exception: Can run immediately if user requests review of specific files only

---

## Escalation Rules

| Situation | Escalation Target |
|-----------|------------------|
| Agent finds bug in different domain | Create task for codi-debug |
| QA finds CRITICAL issue | Re-run relevant domain agent |
| Architecture change needed | codi-architecture → codi-pm |
| Performance issue found (during implementation) | Current agent fixes, codi-debug if severe |
| API contract mismatch | codi-orchestrator re-runs codi-backend |

---

## Turn Limit Guide by Agent

| Agent | Default Turns | Max Turns (including retries) |
|-------|--------------|------------------------------|
| codi-pm | 10 | 15 |
| codi-backend | 20 | 30 |
| codi-frontend | 20 | 30 |
| codi-mobile | 20 | 30 |
| codi-architecture | 12 | 18 |
| codi-debug | 15 | 25 |
| codi-qa | 15 | 20 |
