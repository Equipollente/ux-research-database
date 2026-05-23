---
name: tech_stack_astro
description: Stack decision — Astro chosen for modern UI + fast GitHub Pages deploy
metadata:
  type: project
---

**Decision:** Astro + GitHub Pages for ux-research-database

**Why:** 
- Astro builds ultra-fast (< 30 sec including deploy)
- Native GitHub Pages support (zero backend needed)
- Excellent DX for "modern and polish" design (CSS is easy)
- Small base (50-200 resources) doesn't need React complexity
- Code is readable and maintainable for future collaborators
- Can integrate React/Alpine for advanced interactivity later via "islands"

**Tech Stack (confirmed 2026-05-23):**
- **Framework:** Astro 5.x
- **Hosting:** GitHub Pages (static)
- **Auth:** GitHub PAT in localStorage (client-side only)
- **Data:** `data/resources.json` versioned in repo
- **API calls:** Octokit (@octokit/rest) for GitHub commits
- **Styling:** CSS (vanilla) or Tailwind (if needed for P1 features)
- **Deployment:** GitHub Actions auto-deploy on push to main

**How to apply:** 
- When adding features, prefer Astro components first
- Only add React if interactivity is genuinely complex (animations, real-time updates, etc.)
- Keep the build pipeline simple — no extra tooling unless blocked
