# Context Budget Management

The context window is finite. Unnecessary loading directly degrades performance.
Follow this guide to use context efficiently.

---

## Core Principles

1. **No full file reads** — Read only the necessary functions/classes when a targeted read suffices
2. **No duplicate reads** — Do not re-read files already read
3. **Lazy resource loading** — Load resources only when needed
4. **Maintain records** — Note read files and symbols in progress

---

## File Reading Strategy

```
❌ Bad: Read an entire 500-line file at once
✅ Good: Check first 50 lines (imports + class definitions) → read additional functions as needed
✅ Good: Search (grep) for the target symbol first, then read only that range
```

---

## Tracking Read Files (Record in Progress)

Record read files/symbols when updating progress notes:

```markdown
## Turn 3 Progress

### Read Files
- app/api/todos.py: create_todo(), update_todo()
- app/models/todo.py: Todo class
- app/schemas/todo.py: entire file (short file, 40 lines)

### Not Yet Read
- app/services/todo_service.py (will read next turn)
- tests/test_todos.py (reference after implementation)

### Work Completed
- Added priority field to TodoCreate schema
```

This approach:
- Prevents reading the same file twice
- Clarifies what to do next turn

---

## Large File Handling Strategy

### Files Over 500 Lines

1. Skim the structure first (imports, class/function signatures)
2. Read only the necessary symbols or line ranges
3. Never read the entire file

### Complex Components (React/Flutter)

1. Read only props/state definitions first
2. Read render/build methods only when modification needed
3. Skip style sections unless they are modification targets

### Test Files

1. Read only after implementation is complete (unnecessary before)
2. Check only existing test patterns (first 1-2 test functions)
3. Write remaining tests following the pattern

---

## Context Overflow Symptoms & Responses

| Symptom | Meaning | Response |
|---------|---------|----------|
| Forgetting previously read code | Context window exhausted | Note key info in progress, make re-referenceable |
| Re-reading the same file | Tracking gap | Check "Read Files" list in progress |
| Output suddenly becomes shorter | Output tokens insufficient | Write only essentials, omit extra explanations |
| Ignoring instructions | Forgot loaded skill content | Re-reference only the essential SKILL.md rules |
