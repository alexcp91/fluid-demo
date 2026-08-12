# AGENTS.md

## Cursor Cloud specific instructions

`fluid-demo` is a single-package Vite + React 19 + TypeScript SPA (the "Fluid Functionalism" demo). There is no separate backend and no database. Dependencies are installed automatically by the environment update script (`npm install`).

### Services

There is only one process to run: the Vite server. Standard commands live in `package.json` `scripts`:

- Run (dev): `npm run dev` — serves the SPA on `http://localhost:5173`.
- Lint: `npm run lint` (oxlint; currently emits warnings only, no errors).
- Build: `npm run build` (`tsc -b && vite build`).
- Preview a production build: `npm run preview`.

### Non-obvious notes

- The email persistence API (`GET/PUT /api/emails/...` and `/api/emails/<id>/html`) is not a standalone server — it is a Vite plugin (`vite-plugin-email-api.ts`) that only runs while `npm run dev` (or `npm run preview`) is active. Emails are stored as flat JSON files under `data/emails/` (seeded with `welcome.json`).
- Editing an email in the UI writes to `data/emails/welcome.json` on disk. `welcome.json` is tracked by git, so if you edit it during testing, run `git checkout -- data/emails/welcome.json` afterward to avoid committing test edits.
- Reusable templates use the same Vite plugin under `/api/templates` (`GET` list, `GET/PUT/PATCH/DELETE /api/templates/<id>`, `POST /api/templates/<id>/duplicate`). Files live in `data/templates/` (seeded with `welcome-series.json` and `product-launch.json`, v2 node documents). Reset test edits with `git checkout -- data/templates/`.
- No environment variables, secrets, or external services are required to run or test the app.
- No automated test suite exists. `playwright` is a devDependency but there are no test files and no `test` script; verify changes manually via the running dev server.
