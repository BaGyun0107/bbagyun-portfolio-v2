# Playwright E2E (frontend)

Use Playwright for user-facing flow e2e. When to write e2e and what counts as a
user-facing flow: `.harness/policies/quality-gates.md` (do not restate it here).

## Selectors: role/text first

Prefer role- and text-based locators over brittle CSS selectors — they survive
markup refactors (a self-healing effect) and read like the user's intent.

```ts
// good — intent-revealing, refactor-resilient
await page.getByRole("button", { name: "Sign in" }).click();
await page.getByLabel("Email").fill("user@example.com");

// avoid — brittle, breaks on style/markup churn
await page.locator("div.login-form > button.btn-primary").click();
```

## Separate intent from implementation

Describe what the flow means first, then implement below it. The test name is
the intent; the body is the implementation.

```ts
test("a new user can sign up and reach the dashboard", async ({ page }) => {
  // intent: signup → email confirm → dashboard
  await page.goto("/signup");
  await page.getByLabel("Email").fill("new@example.com");
  await page.getByLabel("Password").fill("s3cret-pass");
  await page.getByRole("button", { name: "Create account" }).click();
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
});
```

## Scope: critical flows only

Cover critical business flows, not every feature — a test-per-feature suite is
slow, redundant, and flaky. Run with `mise run //apps/front:e2e` or, by default,
`mise run e2e:changed`. An agent may author these; a human reviews and owns them
(see the principles in `quality-gates.md`).
