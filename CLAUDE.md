# CLAUDE.md — Project context for AI agents

> Read this file **first** before acting. It's the canonical source of truth for collaboration with Judith on this project. The rest of the repo is the code; this file tells you the things you couldn't easily infer from it.

---

## Quick orientation

- **Project**: UX Research Database — Judith Heckmann's personal, curated collection of UX research, design resources, and frameworks
- **Owner**: Judith Heckmann (sole maintainer)
- **Stack**: Astro 5 (`output: 'static'`), TypeScript, vanilla JS in `<script>` tags (no React/Vue)
- **Data**: single source = `src/data/resources.json` (taxonomies + array of resources)
- **Hosting**: currently GitHub Pages (`equipollente.github.io/ux-research-database/`), **migration to Netlify in progress** — see Phase 2B below
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
├── PHASE_2B_TOKEN_MIGRATION.md        ← active plan: secure the GitHub token
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

## In-flight: Phase 2B — Secure the GitHub token

**Status**: planned but not started (as of 2026-05-23).

**The problem**: `PUBLIC_GITHUB_TOKEN` is injected into the client JS bundle by Astro. In production on GitHub Pages, any visitor can read the token in DevTools and destroy the repo (token has `repo` scope).

**The plan (validated by Judith)**:
1. Migrate hosting from GitHub Pages to **Netlify** (free tier)
2. Reads → `raw.githubusercontent.com` (no token, repo is public)
3. Writes → **Netlify Function** holding the token server-side, gated by a shared admin password

**Full step-by-step plan with code samples is in [PHASE_2B_TOKEN_MIGRATION.md](PHASE_2B_TOKEN_MIGRATION.md)** at the repo root. Read it before touching `github-api.ts` or the deployment setup.

⚠️ **Naming conflict**: `docs/PHASE_2_ROADMAP.md` uses "Phase 2B" to mean "Full Resource Form" (a future feature). `PHASE_2B_TOKEN_MIGRATION.md` uses "Phase 2B" for the Netlify migration. These are **different things**. When Judith says "Phase 2B", clarify if unsure.

---

## Known technical debt

### Form is incomplete (MVP carryover)
[AddResourceForm.astro](src/components/AddResourceForm.astro) only renders **3 of the 6 taxonomies** (Domains, Content Types, Topics). The 3 missing — `access_model`, `origin`, `publisher_type` — exist in `resources.json` and are displayed in the table, but the form has no way to set them yet. **This is intentional MVP scope** ("TEMPS 1" in `docs/PHASE_2_ROADMAP.md`), not a bug Claude introduced. Will be completed when the form is reworked for the Netlify auth flow (Phase 2B step 3).

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

Declared in [src/env.d.ts](src/env.d.ts). Values live in `.env.local` (gitignored).

| Var | Status | Notes |
|---|---|---|
| `PUBLIC_GITHUB_OWNER` | Active | Safe (public repo identifier) |
| `PUBLIC_GITHUB_REPO` | Active | Safe |
| `PUBLIC_GITHUB_BRANCH` | Active | Safe |
| `PUBLIC_GITHUB_TOKEN` | ⚠️ Deprecated, leaking to client | Removed in Phase 2B |

After Phase 2B, the token moves into Netlify env vars (server-side only, no `PUBLIC_` prefix), and a new `ADMIN_PASSWORD` env var is added in Netlify for the Function auth.

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
| Plan future features | `docs/PHASE_2_ROADMAP.md` (Phases 2C–2F still TBD) |
| Migrate the token | `PHASE_2B_TOKEN_MIGRATION.md` (step-by-step plan) |
