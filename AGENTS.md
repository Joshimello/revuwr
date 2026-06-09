# Repository Guidelines

## Project Structure & Module Organization

This is an npm workspace/Turbo monorepo. Application code lives in `apps/`:

- `apps/admin`: SvelteKit admin for event, question, response, review, export, and settings workflows.
- `apps/platform`: SvelteKit applicant/reviewer platform for auth, onboarding, applications, review, and email flows.
- `packages/config-eslint`: shared ESLint config.
- `packages/ui`: shared UI package entry point.

Within each app, routes are under `src/routes`, shared utilities and components are under `src/lib`, static assets are in `static`, and translations are in `messages`. PocketBase generated types live at `src/lib/pocketbase/pocketbase-types.ts`; the root `pb_schema.json` documents the schema.

## Build, Test, and Development Commands

- `npm install`: install dependencies; use Node `>=18`.
- `npm run dev`: run all app dev servers through Turbo.
- `npm run build`: build all workspaces with Turbo.
- `npm run lint`: run workspace ESLint tasks.
- `npm run format`: format the repository with Prettier.
- `npm --workspace <admin|platform> run check`: run `svelte-check` for one app.
- `npm --workspace <admin|platform> run test`: run Playwright and Vitest tests for one app.
- `npm --workspace platform run machine-translate`: update platform translations through Inlang.
- `npm --workspace <admin|platform> run typegen`: regenerate PocketBase types.

## Coding Style & Naming Conventions

Use TypeScript and Svelte 4 patterns already present in the apps. Prettier uses single quotes, no trailing commas, and `printWidth: 100`; let it handle formatting. Name Svelte components and route-local files in kebab case, such as `data-table-action.svelte`. Keep route helpers beside their route in files like `methods.ts`, `stores.ts`, and `types.ts`. Prefer primitives in `src/lib/components/ui` before adding new component patterns.

## Testing Guidelines

Vitest is configured for unit tests and Playwright for integration tests, but no test files are currently checked in. Add focused tests near the code they cover using names such as `*.test.ts` or `*.spec.ts`. For user-facing route changes, include Playwright coverage when practical. Run the relevant app `test` and `check` commands before submitting.

## Commit & Pull Request Guidelines

Recent history uses short Conventional Commit-style messages, for example `feat: platform question paging`, `fix: question circles`, and `refactor: platform root page`. Keep commits scoped.

Pull requests should describe the change, identify the affected app or package, link issues, and include screenshots or recordings for UI changes. Note schema, environment, translation, or generated-type updates.

## Security & Configuration Tips

Do not commit secrets or local environment files. PocketBase and email behavior depends on environment configuration; regenerate `pocketbase-types.ts` after schema changes.
