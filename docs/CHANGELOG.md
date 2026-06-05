# Changelog

All notable changes to this project will be documented in this file.

## [2.3.0] — 2026-06-05 — Phase 2C complete

### Fixed
- Edit Resource modal: all fields now saved correctly (FormData replaces querySelectorAll, which silently failed due to Astro CSS scoping)
- Edit Taxonomy modal: `renames` object now populated correctly; stale SSR state replaced by `localTaxonomyValues` (JS-side copy from API fetch)
- New taxonomy values now appear in Edit Resource checkboxes after save (`updateEditFormCheckboxes()` + `data-taxonomy` attribute)
- Filter pills keep correct styling after dynamic rebuild (moved `.pill` and `.modal-checkbox-label` to `<style is:global>`)
- Dropdown ⋮ position no longer offset when page is scrolled (removed erroneous `window.scrollY` — `position:fixed` uses viewport coords)
- Dropdown ⋮ now flips above the button when it would overflow the viewport bottom

### Changed
- All post-save UI updates are now optimistic (in-memory `allResources` + direct DOM re-render via `buildRow()`), bypassing the 5-min CDN cache on `raw.githubusercontent.com` — no page reload needed
- Filter pill click handling uses event delegation on `.filter-panel-container` instead of per-pill listeners, so dynamically rebuilt pills work automatically
- `openTaxonomyModal()` reads from `localTaxonomyValues` instead of SSR pills (decoupled from frozen build-time DOM state)

## [2.2.0] — 2026-05-25 — Phase 2C night run

### Added
- Edit Resource modal (pre-filled form, PUT semantics via `/api/update-resource`)
- Edit Taxonomy modal (rename/add values, atomic propagation via `/api/update-taxonomy`)
- `⋮` actions menu per row (dropdown portal, `position:fixed` via JS)
- Filter UX: exclusive accordion, auto-close on last deselect, `(N)` counters, 3 button states, "Effacer les filtres" button
- Netlify Function `update-resource.ts` — POST `/api/update-resource`, body `{id, resource}`
- Netlify Function `update-taxonomy.ts` — POST `/api/update-taxonomy`, body `{name, values, renames?}`
- Shared helper `netlify/functions/_lib/github.ts` (auth, fetch, commit)

### Changed
- `getResourcesFromGitHub()` now returns both `resources` and `taxonomies`
- `buildRow()` extracted as standalone function for optimistic re-renders
- `add-resource.ts` and `delete-resource.ts` refactored to use `_lib/github.ts`

## [2.1.0] — 2026-05-23 — Phase 2B (token migration)

### Security
- Removed `PUBLIC_GITHUB_TOKEN` from client bundle — all writes now go through Netlify Functions
- GitHub token stored only in Netlify server-side env vars, never exposed to client
- Added `x-admin-password` header auth on all write endpoints

### Added
- Netlify Function `delete-resource.ts` — POST `/api/delete-resource`, body `{id}`
- `netlify.toml` redirect: `/api/* → /.netlify/functions/*`

### Changed
- `AddResourceForm.astro` completed: all 6 taxonomies + `trust_level` field
- Reads remain unauthenticated via `raw.githubusercontent.com` (cache-buster `?t=Date.now()`)

## [1.0.0] — 2026-05-22 — Initial release

### Added
- Astro 5 static site with resource table, search, taxonomy filters, pagination
- `src/data/resources.json` as single data source (taxonomies + resources)
- Client-side fetch from `raw.githubusercontent.com`
- Netlify deployment (replaced GitHub Pages)
- `AddResourceForm.astro` (MVP: 3/6 taxonomies)
