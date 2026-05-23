# UX Research Database

A curated, searchable database of UX research, design resources, frameworks, and tools.

Built with [Astro](https://astro.build/) — TypeScript, static output, no client-side framework.

---

## Quick start

```bash
npm install
npm run dev    # http://localhost:4321/ux-research-database/
npm run build  # outputs to dist/
```

---

## How it works

- All resources and their taxonomies live in `src/data/resources.json` — single source of truth.
- The page reads this JSON, renders a filterable, paginated table.
- An "Add Resource" form lets the maintainer append entries (token-gated; see Phase 2B for the hosting model migration in progress).

---

## Where to look

| Looking for... | Open... |
|---|---|
| Product requirements | [docs/PRD-resource-database.md](docs/PRD-resource-database.md) |
| Data schema | [docs/schema.json](docs/schema.json) |
| Roadmap (future features) | [docs/PHASE_2_ROADMAP.md](docs/PHASE_2_ROADMAP.md) |
| Active migration: secure token | [PHASE_2B_TOKEN_MIGRATION.md](PHASE_2B_TOKEN_MIGRATION.md) |
| AI/agent context | [CLAUDE.md](CLAUDE.md) |
| Older logs (read-only) | [docs/archive/](docs/archive/) |

---

## Project status

- **Phase 1** ✅ — UI, search, filters, pagination
- **Phase 2A** ✅ — GitHub API integration for reads/writes
- **Phase 2B** 🟡 — Migrate hosting to Netlify, move token server-side ([plan](PHASE_2B_TOKEN_MIGRATION.md))
- **Phases 2C–2F** ⬜ — Edit/delete, import/export, advanced search, collections (see roadmap)

---

**Owner**: Judith Heckmann
**License**: MIT
