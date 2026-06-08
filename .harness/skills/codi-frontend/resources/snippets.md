# Frontend Agent - Code Snippets

Copy-paste ready patterns. Use these as starting points, adapt to the specific task.

---

## Next.js 16 framework canonicals

Use this section only when the target project actually uses Next.js. For React-only apps, follow the existing router, image, font, and bundler conventions instead.

```tsx
// ✅ Internal nav: <Link>, never <a href="/...">
import Link from "next/link";
<Link href="/gallery" className="...">View gallery</Link>

// ✅ Custom font: next/font, never <link rel="stylesheet">
import { Inter } from "next/font/google";
const inter = Inter({ subsets: ["latin"] });
<body className={inter.className}>...</body>

// ✅ Images: next/image, never raw <img>
import Image from "next/image";
<Image src="/hero.png" alt="Hero scene" width={1200} height={600} priority />

// ✅ Imports: only what you use. After refactoring, remove orphans.
// ✅ useCallback / useEffect deps: list every referenced symbol exactly.
```

---

## React-only framework canonicals

Use this section when `next` is absent. Keep the router and bundler already present in the project.

```tsx
// ✅ Browser entry: keep provider composition near the existing React root.
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// ✅ Route/component splitting: prefer the project's router-level lazy pattern.
import { lazy, Suspense } from "react";

const SettingsPage = lazy(() => import("./routes/settings"));

<Suspense fallback={<PageSkeleton />}>
  <SettingsPage />
</Suspense>;
```

---

## Accessible Card (focus ring + semantic + keyboard)

Baseline for an interactive surface. Adjust colors via theme tokens; verify
the resulting contrast ratio against the actual `--card` / `--foreground` /
`--muted-foreground` values (theme tokens alone do NOT guarantee 4.5:1 — the
designer / token system has to make them so).

```tsx
interface CardProps {
  title: string;
  description?: string;
  onClick?: () => void;
}

export function Card({ title, description, onClick }: CardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-lg border bg-card p-4 text-left shadow-sm transition-colors",
        "hover:bg-accent",
        // visible focus indicator (WCAG 2.4.7 Focus Visible, 2.4.11 Focus Not Obscured)
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
      ].join(" ")}
    >
      {/* Visible text inside the button is the accessible name —
          do NOT add aria-label here, that would override and hide the
          description from screen readers. */}
      <span className="block text-lg font-semibold text-foreground">{title}</span>
      {description && (
        <span className="mt-1 block text-sm text-muted-foreground">
          {description}
        </span>
      )}
    </button>
  );
}
```

Accessibility checklist for interactive surfaces:
- **Semantic element** — `<button>`, `<a>`, `<Link>`. Never `<div onClick>`.
- **Keyboard reachable** — implicit when using semantic elements.
- **Visible focus** — `focus-visible:ring-2 ring-offset-2` (or equivalent). Never strip the outline without replacing it.
- **Accessible name** — visible text inside the element IS the name. Add `aria-label` ONLY for icon-only buttons (e.g., `<button aria-label="Close">×</button>`); when visible text exists, `aria-label` overrides it and is an anti-pattern.
- **Contrast** — verify the actual color values against background reach 4.5:1 (normal text) or 3:1 (large text >= 18pt or 14pt bold). Run an axe/Lighthouse pass; theme tokens are not a proof.
- **Heading semantics** — keep heading tags (`<h1>`-`<h6>`) outside interactive elements. Inside a button, use `<span>` with type-scale classes; promote to a heading at the surrounding section level.

---

## React 19 hook patterns

```tsx
// ✅ Derive in render — no state, no effect
function ItemCount({ items }: { items: Item[] }) {
  const count = items.length;
  return <span>{count}</span>;
}

// ✅ Initialize once with a lazy initializer
const [id] = useState(() => crypto.randomUUID());

// ✅ Pass the ref OBJECT (not its current value) to children that need an instance.
//   The child reads .current inside its own effect or event handler, never in render.
function Selectable({ targetRef }: { targetRef: React.RefObject<THREE.Object3D> }) {
  // ...
}

// ❌ Never: useEffect that calls setState to mirror props/state
//    eslint: react-hooks/set-state-in-effect
// useEffect(() => { setCount(items.length); }, [items]);

// ❌ Never: gate JSX on ref.current — it is null on first render, and refs
//    do not trigger re-renders when they attach
//    eslint: react-hooks/refs
// return ref.current ? <Child target={ref.current} /> : null;
```

## TanStack Query Hook

> Authentication rides on the httpOnly cookie. Do not access tokens from JS (no `getToken()`). Shared fetch configuration is centralized in the "API Client" section below.

```tsx
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export function useTodos() {
  return useQuery<Todo[]>({
    queryKey: ["todos"],
    queryFn: () => apiClient.get<Todo[]>("/api/todos"),
  });
}

export function useCreateTodo() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { title: string }) =>
      apiClient.post<Todo>("/api/todos", data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["todos"] }),
  });
}
```

---

## Form with TanStack Form + Zod

```tsx
"use client";

import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "At least 8 characters"),
});

export function LoginForm({ onSubmit }: { onSubmit: (data: z.infer<typeof schema>) => void }) {
  const form = useForm({
    defaultValues: { email: "", password: "" },
    validatorAdapter: zodValidator(),
    validators: { onChange: schema },
    onSubmit: async ({ value }) => onSubmit(value),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        form.handleSubmit();
      }}
      className="space-y-4"
    >
      <form.Field name="email">
        {(field) => (
          <div>
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className="mt-1 w-full rounded-md border px-3 py-2"
              aria-invalid={field.state.meta.errors.length > 0}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-sm text-destructive">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>
      <form.Field name="password">
        {(field) => (
          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={field.state.value}
              onChange={(e) => field.handleChange(e.target.value)}
              onBlur={field.handleBlur}
              className="mt-1 w-full rounded-md border px-3 py-2"
              aria-invalid={field.state.meta.errors.length > 0}
            />
            {field.state.meta.errors.length > 0 && (
              <p className="mt-1 text-sm text-destructive">{field.state.meta.errors[0]}</p>
            )}
          </div>
        )}
      </form.Field>
      <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
        {([canSubmit, isSubmitting]) => (
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </button>
        )}
      </form.Subscribe>
    </form>
  );
}
```

---

## Loading / Error / Empty States

```tsx
interface AsyncStateProps<T> {
  data: T | undefined;
  isLoading: boolean;
  error: Error | null;
  empty: React.ReactNode;
  children: (data: T) => React.ReactNode;
}

export function AsyncState<T>({ data, isLoading, error, empty, children }: AsyncStateProps<T>) {
  if (isLoading) return <div className="flex justify-center p-8"><Spinner /></div>;
  if (error) return <ErrorCard message={error.message} />;
  if (!data || (Array.isArray(data) && data.length === 0)) return <>{empty}</>;
  return <>{children(data)}</>;
}
```

---

## Responsive Grid Layout

```tsx
export function StatsGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {children}
    </div>
  );
}
```

---

## API Client (fetch factory + 401 refresh)

> Single client factory. Assumes httpOnly cookie-based auth. Tokens are never read or stored in JS.

```tsx
// lib/api-client.ts
type ApiError = {
  status: "error";
  code: string;
  message: string;
  details?: unknown;
};

class ApiClientError extends Error {
  constructor(public readonly payload: ApiError, public readonly httpStatus: number) {
    super(payload.message);
  }
}

let refreshing: Promise<void> | null = null;

async function refreshSession() {
  if (!refreshing) {
    refreshing = fetch("/api/auth/refresh", {
      method: "POST",
      credentials: "include",
    }).then((res) => {
      if (!res.ok) throw new ApiClientError(
        { status: "error", code: "REFRESH_FAILED", message: "Session expired" },
        res.status,
      );
    }).finally(() => {
      refreshing = null;
    });
  }
  return refreshing;
}

const STATE_CHANGING = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function readCsrfToken(): string | null {
  const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function buildHeaders(method: string, hasBody: boolean): HeadersInit {
  const headers: Record<string, string> = {};
  if (hasBody) headers["Content-Type"] = "application/json";
  if (STATE_CHANGING.has(method)) {
    const csrf = readCsrfToken();
    if (csrf) headers["X-CSRF-Token"] = csrf;
  }
  return headers;
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  const exec = () =>
    fetch(path, {
      method,
      credentials: "include",
      headers: buildHeaders(method, body !== undefined),
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

  let res = await exec();
  if (res.status === 401 && !path.startsWith("/api/auth/")) {
    try {
      await refreshSession();
      res = await exec();
    } catch (err) {
      window.location.assign("/login");
      throw err;
    }
  }

  if (!res.ok) {
    const payload = (await res.json().catch(() => null)) as ApiError | null;
    throw new ApiClientError(
      payload ?? { status: "error", code: "UNKNOWN", message: res.statusText },
      res.status,
    );
  }
  return (await res.json()) as T;
}

export const apiClient = {
  get: <T>(path: string) => request<T>("GET", path),
  post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  delete: <T>(path: string) => request<T>("DELETE", path),
};
```

```tsx
// features/todos/api/use-todos.ts — feature-scoped API hook
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
}

export function useTodos() {
  return useQuery<Todo[]>({
    queryKey: ["todos"],
    queryFn: () => apiClient.get<Todo[]>("/api/todos"),
  });
}
```

> Core invariants: (1) send cookies with `credentials: "include"`; (2) for state-changing requests, read the `csrf_token` cookie and echo it as the `X-CSRF-Token` header (double-submit); (3) on 401, the interceptor refreshes at most once and serializes concurrent calls via a shared promise; (4) if refresh fails, force-redirect to the login page; (5) consume the backend error schema (`status` / `code` / `message`) as-is.

---

## Vitest Component Test

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Card } from "./Card";

describe("Card", () => {
  it("renders title and description", () => {
    render(<Card title="Test" description="Desc" />);
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(screen.getByText("Desc")).toBeInTheDocument();
  });

  it("calls onClick when clicked", async () => {
    const onClick = vi.fn();
    render(<Card title="Test" onClick={onClick} />);
    await userEvent.click(screen.getByText("Test"));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
```
