<!--
Sync Impact Report
- Version change: template placeholder -> 1.0.0
- Added principles:
  - I. Evidence-First Portfolio Truth
  - II. Interview-Driven Progressive Completion
  - III. Shared Information Architecture, Optional Evidence
  - IV. Accessible and Responsive Reading
  - V. Test-First, Verifiable Delivery
- Added sections:
  - Project Constraints
  - Development Workflow and Quality Gates
- Removed sections: none; template placeholders were concretized
- Follow-up TODOs: none
-->

# Bbagyun Portfolio Constitution

## Core Principles

### I. Evidence-First Portfolio Truth

Every public claim MUST be traceable to an interview record, source code,
runtime evidence, or an explicitly labeled estimate. Measured, reported, and
estimated values MUST remain distinguishable. The portfolio MUST NOT invent
demo URLs, operational status, metrics, architecture relationships, API
contracts, or implementation outcomes. Private source code, customer data,
secrets, and internal-only operational details MUST remain unpublished.

Rationale: the portfolio's primary value is credible engineering judgment;
unsupported precision or fabricated evidence damages that credibility.

### II. Interview-Driven Progressive Completion

Each project MUST be completed through a focused interview before its content
is materially rewritten or its demo strategy is published. Projects MUST be
handled one at a time so facts, public scope, demo constraints, and evidence
can be reviewed without contaminating other project narratives. Uninterviewed
project content MUST be preserved until its own cycle begins.

Rationale: project histories differ, and chat or neighboring project content
is not a reliable substitute for the author's decisions.

### III. Shared Information Architecture, Optional Evidence

Project detail pages MUST use one shared reading order and one reusable page
template. Demos, swimlanes, architecture diagrams, ERDs, API contracts, and
operational metrics MUST remain optional evidence. Missing evidence MUST be
omitted without empty cards, disabled calls to action, or "coming soon"
placeholders. Structured content contracts MUST be type-safe and support
incremental migration from legacy content without forcing unsupported facts.

Rationale: consistency improves comparison, while optional evidence prevents
uniform presentation from becoming uniform fabrication.

### IV. Accessible and Responsive Reading

User-facing content MUST remain readable and operable by keyboard and assistive
technology. Visual evidence MUST provide meaningful text alternatives. State
and flow differences MUST NOT rely on color alone. Wide diagrams MAY scroll
inside their own containers, but the page MUST NOT introduce horizontal
overflow at supported viewport widths. External links MUST have accessible
labels and safe new-tab behavior.

Rationale: architecture evidence is part of the content, not decorative media,
and must remain understandable regardless of device or visual access.

### V. Test-First, Verifiable Delivery

Behavioral changes MUST follow test-driven development unless the repository
rules explicitly exempt the task. Tests MUST cover content contracts, type
boundaries, conditional evidence rendering, and affected user flows. A change
MUST NOT be declared complete without fresh type, lint, build, and relevant
browser or E2E evidence. Verification records MUST distinguish automated proof,
manual review, and remaining risk.

Rationale: portfolio content and presentation are both production behavior;
regressions in facts, accessibility, or navigation are user-facing defects.

## Project Constraints

- The project profile and app-local ownership rules define which application
  surface may change. Frontend portfolio UI work belongs under `apps/front`.
- App-local package manager and runtime declarations MUST be preserved. Root
  dependency installation and runtime upgrades are prohibited unless explicitly
  requested.
- Identifiers and file names use English. User-facing Korean content remains
  natural Korean; repository language rules govern comments and delivery text.
- GitHub Secrets MUST contain only the approved Infisical bootstrap credentials;
  secret values MUST NOT be read or published for portfolio content.
- AI MUST NOT merge pull requests. Destructive, history-rewriting, production,
  or secret-sensitive actions require the approval boundaries in `AGENTS.md`
  and the harness policies.

## Development Workflow and Quality Gates

1. Non-trivial product, content-architecture, or UI changes start with approved
   brainstorming.
2. Medium or larger durable work uses a committed Spec Kit
   `specs/<NNN-feature>/` directory as the plan of record.
3. Specification explicitly requests test tasks, and critical ambiguity is
   resolved through clarify before planning continues.
4. The user explicitly starts any automated plan-to-converge loop and reviews
   `tasks.md` before implementation.
5. Implementation follows unchecked tasks and test-first discipline, preserves
   unrelated user changes, and does not commit without current authorization.
6. Review and verification include content-source consistency, type checking,
   linting, production build, and E2E/browser evidence for affected user flows.
7. Completion requires convergence, feature status synchronization when
   applicable, and a handoff that records commands, decisions, and residual risk.

## Governance

This constitution operationalizes the repository's portfolio-quality principles.
Direct user instructions, `AGENTS.md`, and the canonical harness policies remain
the routing and safety authority; amendments MUST remain consistent with them.

An amendment requires a documented rationale, explicit user approval, an impact
review of active specifications, and a migration note when existing content or
contracts are affected. Semantic versioning applies: MAJOR for incompatible
principle removal or redefinition, MINOR for a new principle or materially
expanded governance, and PATCH for non-semantic clarification. Every feature
plan and final review MUST include a constitution compliance check, and any
intentional exception MUST record its reason, owner, and expiry in the feature
specification.

**Version**: 1.0.0 | **Ratified**: 2026-08-20 | **Last Amended**: 2026-08-20
