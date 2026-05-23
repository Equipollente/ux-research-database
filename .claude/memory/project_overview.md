---
name: project_overview
description: Project context — UX resource database for Judith Heckmann, small base, personal curation
metadata:
  type: project
---

**Project:** UX & Research Resource Database  
**Owner:** Judith Heckmann (UX Researcher)  
**Repo:** `ux-research-database` on GitHub  
**Launch date:** 2026-05-23 (scaffolding phase)

**Goal:**
Centralize scattered web resources (articles, tools, frameworks, papers) into one searchable, filterable database with public read access and authenticated write access.

**Key Constraints:**
- Small base: 50-200 resources (no scaling issues)
- Personal curation (single author, Judith only)
- Modern, polished UI (not minimalist, but not overly complex)
- Deploy in < 30 seconds (GitHub Pages native)
- Maintainable by non-developers (form-based editing + direct JSON edit on GitHub)

**Data Model:**
- 10 fields per resource (id, source, trust_level, comments, last_updated, etc.)
- 6 taxonomies (access_model, origin, publisher_type, domain, content_type, topic)
- Multi-valued filtering (AND semantics within column, OR between columns)

**Phasing:**
1. Phase 1 (≈1-2 days): Read view + search/filter
2. Phase 2 (≈1-2 days): Authenticated CRUD
3. Phase 3 (≈1 day): Taxonomy management
4. Phase 4 (P1, ongoing): Dark mode, sorting, CSV export

**No deadline** — personal project, pace is flexible.
