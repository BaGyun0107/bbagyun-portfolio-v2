---
name: karpathy-style
description: Prompt-style wrapper for Karpathy-style agent operation in codi-harness-v2. Use for concise problem framing, explicit assumptions, tight feedback loops, simple plans, high-signal execution, and phase prompts.
---

# Karpathy-Style

Use this skill to shape prompts, phase handoffs, and agent responses.

## Required Policy

Read `.harness/prompt-style/karpathy.md` before writing or refining prompts.

## Operating Rules

- Keep the request concrete.
- State assumptions explicitly.
- Prefer small executable steps.
- Ask only when a decision changes the implementation path or safety boundary.
- Keep durable multi-phase state in GSD `.planning/`, not chat.
- Write phase prompts directly from `.harness/workflow.md` and
  `.harness/policies/scenario-phase-routing.md`.

## Phase Usage

This skill applies across all phases:

- `brainstorming`
- `planning`
- `execution`
- `review`
- `verification`
