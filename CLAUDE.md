# CLAUDE.md — Project context for AI agents

> Read this file **first** before acting. It's the canonical source of truth for collaboration with Judith on this project. The rest of the repo is the code; this file tells you the things you couldn't easily infer from it.

---

## Quick orientation

- **Project**: UX Research Database — Judith Heckmann's personal, curated collection of UX research, design resources, and frameworks
- **Owner**: Judith Heckmann (sole maintainer)
- **Stack**: Astro 5 (`output: 'static'`), TypeScript, vanilla JS in `<script>` tags (no React/Vue)
- **Data**: single source = `src/data/resources.json` (taxonomies + array of resources)
- **Hosting**: Netlify (`https://ux-research-database.netlify.app`), GitHub Pages workflow disabled. Auto-deploys on push to `main`.
- **Working directory**: `C:\Users\judit\Documents\UX-Research\RessourcesDatabase`
- **Repo**: `equipollente/ux-research-database` (branch `main`)

---

## How to run

```bash
npm install
npm run dev    # http://localhost:4321/ux-research-database/
npm run build  # outputs to dist/
```

> If multiple Astro dev servers seem to be running (zombie ports 4321–4327), they're orphans from previous sessions. Kill them with `taskkill //F //PID <pid>` before relaunching. They serve **stale bundles** and will mask any recent code change.

---

## Project structure (after audit 2026-05-23)

```
/
├── CLAUDE.md                          ← this file, AI context
├── PHASE_2B_TOKEN_MIGRATION.md        ← completed plan: secure the GitHub token (kept for reference)
├── PHASE_2C_CRUD_AND_FILTERS.md       ← active plan: CRUD on resources/taxonomies + filter UX refinements
├── README.md                          ← human-facing intro
├── astro.config.mjs
├── package.json
├── tsconfig.json
├── .env.local                         ← GitHub token + env vars (gitignored)
├── .github/workflows/deploy.yml       ← will become obsolete after Netlify migration
├── src/
│   ├── env.d.ts                       ← TypeScript env var declarations
│   ├── pages/index.astro              ← single-page app entry
│   ├── layouts/BaseLayout.astro       ← shared <head>, header, footer
│   ├── components/
│   │   ├── AddResourceForm.astro      ← form to add a resource
│   │   └── ResourceTable.astro        ← table + search + filters + pagination
│   ├── data/
│   │   └── resources.json             ← UNIQUE source of taxonomies + resources
│   └── utils/
│       ├── data-transform.ts          ← canonical Resource & Taxonomies types
│       ├── filters.ts                 ← filter/search logic
│       └── github-api.ts              ← GitHub REST API calls (will be refactored in Phase 2B)
└── docs/
    ├── CHANGELOG.md
    ├── PHASE_2_ROADMAP.md             ← original plan (Phase 2C/D/E/F still pending)
    ├── PRD-resource-database.md       ← product requirements
    ├── schema.json                    ← JSON schema for resources.json validation
    └── archive/                       ← historical phase logs, do not modify
```

---

## Critical gotcha — CSS scoping vs `innerHTML`

Astro's `<style>` block is **automatically scoped** (rewrites selectors to match a `data-astro-cid-XXXX` attribute on SSR-rendered elements). Elements created client-side via `tr.innerHTML = ...` or `document.createElement(...)` **lose this attribute** and won't match scoped selectors.

In [ResourceTable.astro](src/components/ResourceTable.astro), the table rows are built client-side from a `fetch`. So:

- `<style>` (scoped) contains styles for SSR elements only: filter pills, search bar, table header, pagination shell
- `<style is:global>` contains styles for dynamic elements: `.tag`, `.tag-list`, `.source-cell a`, `.trust-level`, `.comments`, `.hidden`, `.page-number`, plus all responsive (`@media (max-width: 768px)`) rules that target `.resource-table td[data-label="..."]`

**If you add a new CSS rule that targets a dynamically rendered element, put it in `<style is:global>`. If you forget this, the rule will be silently dead.**

---

## Architecture — reads vs writes

**Reads** are unauthenticated:
- Client fetches `src/data/resources.json` from `raw.githubusercontent.com` (hardcoded URL in [src/utils/github-api.ts](src/utils/github-api.ts))
- No token, no CORS issues, no env vars at build time

**Writes** go through a Netlify Function:
- Endpoint: `POST /api/add-resource` (redirected by netlify.toml to `/.netlify/functions/add-resource`)
- Auth: `x-admin-password` header validated against `ADMIN_PASSWORD` env var
- The Function holds `GITHUB_TOKEN` (server-side env var, never exposed)
- On success: commit appended to `src/data/resources.json`, raw mirror updates within ~minutes

**No GitHub token exists in client code anywhere.** The previous `PUBLIC_GITHUB_TOKEN` approach was retired in Phase 2B (2026-05-23).

⚠️ **Naming note**: `docs/PHASE_2_ROADMAP.md` uses "Phase 2B" to mean "Full Resource Form" (mostly done as side-effect of the security work). `PHASE_2B_TOKEN_MIGRATION.md` documents what was actually done.

---

## Known technical debt

### Form completed (Phase 2B, 2026-05-23)
[AddResourceForm.astro](src/components/AddResourceForm.astro) now covers all 6 taxonomies plus a `trust_level` field (1-5). The MVP-era partial form (3/6 categories) was completed at the same time as the Netlify Function refactor. No more debt here.

### Type duplication has been fixed (2026-05-23)
`Resource` interface used to live in both `data-transform.ts` and `github-api.ts`. Now canonical in `data-transform.ts`; `github-api.ts` re-exports it. **Do not re-introduce a duplicate.**

### `loadResources()` removed (2026-05-23)
The function `loadResources()` in `data-transform.ts` used to fetch from `/data/resources.json` (a path that never existed). It was dead code — removed during audit. Don't reintroduce it.

---

## Working with Judith — collaboration norms

> These are based on her explicit feedback. Honor them.

1. **Validate step by step**. Before any non-trivial refactor or multi-file change: diagnose, propose 2–3 options with tradeoffs, **wait for her green light**, then execute. Don't chain steps without check-ins.
2. **Test partial solutions before extending**. When fixing a class of bugs (e.g. CSS scoping), apply the fix to 2–3 examples first, let her verify, then extend.
3. **Communication in French, code in English**. Judith writes to you in French; reply in French. Code, identifiers, commit messages: English.
4. **Don't create `.md` docs unprompted**. She doesn't want a doc for every change. Only create one when she explicitly asks ("rédige la doc"). The exception is this `CLAUDE.md` — it lives because it's our shared context.
5. **Don't commit or deploy without being asked**. She decides when to commit. Surface what's changed; don't push.
6. **Diagnose before fixing**. Explain what's wrong and your hypothesis before writing code. Especially for bugs — she wants to understand the root cause, not just see a patch.

---

## Environment variables

**Client-side (`PUBLIC_*` in `.env.local`)**: none. The file no longer exists. The reads URL is hardcoded; there are no client-side secrets.

**Server-side (Netlify env vars)**: set in Netlify dashboard, never bundled into the client:

| Var | Purpose |
|---|---|
| `GITHUB_TOKEN` | Fine-grained PAT with `contents:write` scope on this repo only |
| `GITHUB_OWNER` | Repo owner — `Equipollente` |
| `GITHUB_REPO` | `ux-research-database` |
| `GITHUB_BRANCH` | `main` |
| `ADMIN_PASSWORD` | Shared password for the `Add Resource` form |

To rotate the token: revoke the existing PAT on GitHub, generate a new fine-grained one with the same scope, update `GITHUB_TOKEN` in Netlify dashboard, trigger a redeploy.

---

## Quick reference — what's where

| Need to... | Look at... |
|---|---|
| Add a new taxonomy value | `src/data/resources.json` → `taxonomies.<name>` |
| Add a new resource | `src/data/resources.json` → `resources[]` (or via the form once Phase 2B is done) |
| Change table columns | `src/components/ResourceTable.astro` (markup + JS that builds rows from API) |
| Change form fields | `src/components/AddResourceForm.astro` |
| Style a dynamic element | `<style is:global>` block in `ResourceTable.astro` (see scoping gotcha above) |
| Understand the data shape | `docs/schema.json` (JSON Schema) or `src/utils/data-transform.ts` (TS types) |
| Plan future features | `docs/PHASE_2_ROADMAP.md` (high-level), `PHASE_2C_CRUD_AND_FILTERS.md` (next sprint detailed) |
| Migrate the token | `PHASE_2B_TOKEN_MIGRATION.md` (done, kept for reference) |
| Implement Edit/Delete + filter UX | `PHASE_2C_CRUD_AND_FILTERS.md` (next sprint) |
