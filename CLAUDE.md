# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All commands can be run from the root or within a specific app directory.

**Root (runs all workspaces via Turbo):**
```bash
npm run dev        # Start all dev servers
npm run build      # Build all apps
npm run lint       # Lint all workspaces
npm run format     # Format with Prettier
```

**Per-app (from `apps/platform/` or `apps/admin/`):**
```bash
npm run dev              # Start dev server
npm run check            # Type-check with svelte-check
npm run check:watch      # Type-check in watch mode
npm run test:unit        # Run Vitest unit tests
npm run test:integration # Run Playwright e2e tests
npm run typegen          # Regenerate PocketBase TypeScript types from schema
```

## Architecture

This is a **Turborepo monorepo** with two SvelteKit apps sharing a PocketBase backend.

### Apps

**`apps/platform/`** — Public-facing applicant portal
Users log in via OAuth, fill out applications, and view their submission status. Uses SSR auth with cookie-based sessions. Sends transactional email via Resend. Has real-time updates via EventSource.

**`apps/admin/`** — Internal reviewer dashboard
Admins manage events, questions, applications, reviewers, and export data. Uses client-side PocketBase auth (stored in `localStorage` key `admin_auth`). Features TipTap rich text editor, drag-and-drop (svelte-dnd-action), and data tables (svelte-headless-table).

**`packages/ui/`** — Shared Svelte component library referenced as `@repo/ui`.

**`packages/config-eslint/`** — Shared ESLint config.

### Backend: PocketBase

PocketBase is the sole backend. The schema is defined in `/pb_schema.json`. Key application collections: `users`, `events`, `applications`, `applications_count`, `reviews`, `reviewers`, `questions`, `answers`, `colleges`, `files`, `notifications`.

TypeScript types are auto-generated via `pocketbase-typegen` into each app's `src/lib/pocketbase/pocketbase-types.ts`. Run `npm run typegen` after schema changes.

### Two PocketBase Instances Per Request (platform)

In `apps/platform/src/hooks.server.ts`, each request creates two PocketBase clients on `event.locals`:
- `event.locals.pb` — user-scoped client, loaded from session cookie
- `event.locals.apb` — superuser client, authenticated with `PB_EMAIL` / `PB_PASSWORD` env vars for privileged operations
- `event.locals.rs` — Resend email client

In the admin app, there is no `hooks.server.ts`; auth is handled entirely client-side via the `LocalAuthStore`.

### Environment Variables

**Platform** (`.env`):
- `PUBLIC_PB_URL` — PocketBase server URL
- `PB_EMAIL`, `PB_PASSWORD` — Superuser credentials
- `RS_API_KEY` — Resend API key
- OAuth provider credentials

**Admin** (`.env`):
- `PUBLIC_PB_URL` — PocketBase server URL

### Internationalization

Platform uses `@inlang/paraglide-js` v2 with a custom middleware in `hooks.server.ts` that injects the locale into the `%lang%` HTML placeholder.

Admin uses `@inlang/paraglide-sveltekit` v0.11.

### Typed PocketBase Client

Both apps export a typed `pb` singleton from `src/lib/pocketbase/client.ts` cast as `TypedPocketBase`. The `pbImage(collectionID, recordID, file)` helper builds PocketBase file URLs.

### UI Stack

- **Tailwind CSS** with HSL CSS variable–based theming and dark mode support
- **Bits UI** for headless components
- **svelte-radix** for Radix primitives
- **lucide-svelte** for icons
- **svelte-sonner** for toast notifications
- **mode-watcher** for dark mode detection
