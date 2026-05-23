# UX Research Database

A centralized, searchable database of curated UX research, design resources, frameworks, and tools. Built with Astro + GitHub Pages.

## 🚀 Quick Start

### Local Development

```bash
npm install
npm run dev
```

Then open `http://localhost:3000` in your browser.

### Build for Production

```bash
npm run build
```

Output goes to `./dist/`.

## 📁 Project Structure

```
src/
  pages/          # Astro pages (becomes routes)
  components/     # Reusable UI components
  layouts/        # Page layouts
  utils/          # Utility functions (GitHub API, filters, etc.)
  styles/         # Global and component styles
data/
  resources.json  # Source of truth — all resources + taxonomies
docs/
  PRD-*.md        # Product requirements
  CHANGELOG.md    # Version history
.github/
  workflows/      # GitHub Actions (auto-deploy)
```

## 🔄 Edit Flow

### Via Web UI (when authenticated)
1. Click "Mode édition" in header
2. Paste your GitHub Personal Access Token (fine-grained, `contents:write` scope)
3. Add/edit/delete resources via forms
4. Changes auto-commit to GitHub

### Direct GitHub Edit
1. Edit `data/resources.json` on GitHub
2. Commit to `main` branch
3. Auto-deploy happens within ~30 seconds

## 📚 Data Schema

See `data/schema.json` for full validation schema.

Each resource has:
- `id`, `source`, `access_model`, `origin`, `publisher_type`
- `domain`, `content_type`, `topic` (multi-valued)
- `trust_level` (1-5), `comments`, `last_updated`

Taxonomies are defined in `data/resources.json` under `taxonomies`.

## 🔐 Authentication

Read access is public. Write access requires a GitHub PAT stored in `localStorage` (browser-only, never committed).

## 📖 Documentation

- `docs/PRD-resource-database.md` — Full product requirements
- `docs/CHANGELOG.md` — Version history

---

**Owner:** Judith Heckmann  
**Built with:** Astro + GitHub Pages  
**License:** MIT
