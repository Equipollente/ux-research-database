# 🚀 PHASE 2A: GitHub Backend Integration - DETAILED PLAN

**Status:** 📋 Plan Document  
**Target Duration:** 60-90 minutes (autonomous execution)  
**Start Date:** 2026-05-23  
**GitHub Repo:** equipollente/ux-research-database  
**Authentication:** Personal Access Token (Fine-grained)  

---

## 🎯 PHASE 2A OBJECTIVES

1. **Remove localStorage dependency** — Clean up all localStorage code from v1
2. **GitHub API integration** — Fetch & persist resources via GitHub API
3. **Seamless UX** — Users don't need GitHub account; token handles auth
4. **Data persistence** — Resources stored in `src/data/resources.json` in repo
5. **Real-time sync** — AddResourceForm calls GitHub API directly

---

## 📊 ARCHITECTURE OVERVIEW

### Data Flow (Phase 2A)
```
User adds resource
  ↓
AddResourceForm.astro (client-side)
  ↓
src/utils/github-api.ts (GitHub API handler)
  ↓
GitHub API REST (read + write src/data/resources.json)
  ↓
Repo file updated
  ↓
Page reloads → ResourceTable fetches fresh data from GitHub
  ↓
New resource visible in table
```

### GitHub API Endpoints Used
- **GET** `/repos/{owner}/{repo}/contents/{path}` — Fetch resources.json + SHA
- **PUT** `/repos/{owner}/{repo}/contents/{path}` — Write updated resources.json

### Authentication
- **Type:** Personal Access Token (fine-grained)
- **Storage:** `.env.local` (gitignored)
- **Scope:** Token has read+write access to repo content
- **Usage:** `Authorization: Bearer {GITHUB_TOKEN}` header in all requests

---

## 🛠️ TASK BREAKDOWN (8 Tasks)

### ✅ TASK 0: Configuration (.env.local + .env verification)
**Status:** ⏳ In Progress  
**Files:** `.env.local`
**Duration:** 2 min

**Actions:**
- [x] Create `.env.local` with:
  - `GITHUB_TOKEN`
  - `GITHUB_OWNER`
  - `GITHUB_REPO`
  - `GITHUB_BRANCH`
- [x] Verify `.gitignore` includes `.env.local` ✓

---

### TASK 1: Create GitHub API Utility (src/utils/github-api.ts)
**Status:** ⏳ Pending  
**Files:** `src/utils/github-api.ts` (NEW)  
**Duration:** 15 min

**Goals:**
- Centralized GitHub API handler
- Token from environment variables
- Error handling & response parsing
- Base64 encoding/decoding for file content

**Functions to implement:**
```typescript
// GET resources from GitHub
export async function getResourcesFromGitHub(): Promise<Resource[]>
  • Fetches src/data/resources.json from repo
  • Parses base64 content
  • Returns array of Resource objects
  • Error handling for 404 (first time) or network issues

// GET file metadata (for SHA)
export async function getGitHubFileSHA(): Promise<string>
  • Fetches file info to get SHA (needed for PUT)
  • Returns SHA string

// ADD resource to GitHub
export async function saveResourceToGitHub(newResource: Resource): Promise<boolean>
  • Fetches current resources.json + SHA
  • Adds newResource to array
  • Encodes content to base64
  • PUTs back to GitHub with SHA + commit message
  • Returns success boolean
  • Error handling for conflicts, auth, etc.

// Helper: Base64 encode/decode
• encodeBase64(str: string): string
• decodeBase64(str: string): string
```

**Type definition:**
```typescript
interface Resource {
  id: string;
  source: string;
  comments: string;
  domain: string[];
  content_type: string[];
  topic: string[];
  access_model: string[];
  origin: string[];
  publisher_type: string[];
  trust_level: number;
  last_updated: string;
}
```

---

### TASK 2: Create new AddResourceForm.astro (v2 - GitHub API)
**Status:** ⏳ Pending  
**Files:** `src/components/AddResourceForm.astro` (REPLACE)  
**Duration:** 15 min

**Changes from v1:**
- Remove localStorage calls
- Import `saveResourceToGitHub` from utils
- Change `addResource()` to async
- Call `saveResourceToGitHub(newResource)` instead of `localStorage.setItem()`
- Add loading state during API call (button text: "Adding...")
- Handle GitHub API errors (show alert)
- Reload page on success (or trigger table refresh)
- Keep modal UX from v1 (same form structure, validation, etc.)

**Key differences:**
```javascript
// OLD (localStorage)
localStorage.setItem('uex-resources', JSON.stringify(existing));

// NEW (GitHub API)
const success = await saveResourceToGitHub(newResource);
if (!success) {
  alert('❌ Failed to add resource. Check your connection.');
  return;
}
```

---

### TASK 3: Update ResourceTable.astro (load from GitHub API)
**Status:** ⏳ Pending  
**Files:** `src/components/ResourceTable.astro` (MODIFY)  
**Duration:** 15 min

**Changes:**
- Remove `loadLocalStorageResources()` function (from v1)
- Add script to fetch resources from GitHub API on page load
- Replace server-side resource loading with client-side API call
- Keep search, filter, pagination logic (no changes needed)

**Key changes:**
```javascript
// On page load:
// OLD: Resources loaded server-side from resources.json
// NEW: Fetch from GitHub via getResourcesFromGitHub() + render to table
```

**Workflow:**
1. Page loads (initial HTML has empty table)
2. Script runs `getResourcesFromGitHub()`
3. Parse response, generate table rows
4. Append to `<tbody>`
5. Pagination + search/filter logic runs (same as before)

---

### TASK 4: Update index.astro (integrate new form in modal)
**Status:** ⏳ Pending  
**Files:** `src/pages/index.astro` (NO CHANGES NEEDED)  
**Duration:** 2 min

**Check:**
- Form already in modal ✓
- Modal interactions (open/close) ✓
- No modifications needed for Phase 2A

---

### TASK 5: Update build config (if needed)
**Status:** ⏳ Pending  
**Files:** `astro.config.mjs` (CHECK ONLY)  
**Duration:** 2 min

**Check:**
- `vite.ssr.external` includes `@octokit/rest` (already there)
- Environment variables accessible in Astro `import.meta.env` ✓

---

### TASK 6: Test complete flow (manual)
**Status:** ⏳ Pending  
**Duration:** 20 min

**Test Cases:**
1. **Dev server startup**
   - `npm run dev`
   - Page loads without errors
   - Table displays initial 4 resources ✓

2. **Add resource via form**
   - Click "➕ Add Resource" button
   - Modal opens ✓
   - Fill form (URL, comments, checkboxes)
   - Click "Add Resource"
   - Loading state shows ✓
   - GitHub API call succeeds
   - Page reloads
   - New resource appears in table ✓
   - New resource visible in GitHub repo `src/data/resources.json` ✓

3. **Verify in GitHub**
   - Open repo on GitHub
   - Navigate to `src/data/resources.json`
   - See new resource in JSON ✓

4. **Search & Filter**
   - Search for new resource by URL ✓
   - Filter by domain/type/topic ✓
   - Pagination includes new resource ✓

5. **Error handling**
   - Test with invalid URL in form
   - Test with no domain/type/topic selected
   - Observe validation alerts ✓

---

### TASK 7: Documentation & cleanup
**Status:** ⏳ Pending  
**Duration:** 10 min

**Actions:**
1. Create `PHASE_2A_COMPLETION_LOG.md`
   - Document all changes
   - List commits
   - Verify all tasks ✓
2. Remove old localStorage references
   - Check for any `localStorage` calls remaining
   - Delete if found
3. Git commit + push
   - Commit message: "Phase 2A: GitHub Backend Integration"
   - Push to equipollente/ux-research-database

---

## 📋 FILES TO CREATE/MODIFY

| # | File | Type | Action | Status |
|---|------|------|--------|--------|
| 0 | `.env.local` | Config | CREATE | ✅ DONE |
| 1 | `src/utils/github-api.ts` | NEW | CREATE | ⏳ TODO |
| 2 | `src/components/AddResourceForm.astro` | MODIFY | REPLACE v1 | ⏳ TODO |
| 3 | `src/components/ResourceTable.astro` | MODIFY | Update loading | ⏳ TODO |
| 4 | `src/pages/index.astro` | CHECK | No changes | ⏳ TODO |
| 5 | `astro.config.mjs` | CHECK | No changes | ⏳ TODO |
| 6 | Tests | MANUAL | Test flow | ⏳ TODO |
| 7 | `PHASE_2A_COMPLETION_LOG.md` | DOC | CREATE | ⏳ TODO |

---

## 🚨 CRITICAL NOTES

1. **Token Security**
   - Never commit `.env.local` to repo
   - Token is scoped to this repo only
   - If exposed, can be revoked on GitHub easily

2. **GitHub API Rate Limits**
   - Authenticated requests: 5,000/hour
   - Our usage: ~1-2 API calls per resource add
   - No rate limit issues expected

3. **Base64 Encoding**
   - GitHub returns file content as base64
   - Must decode when parsing JSON
   - Must encode when writing back

4. **SHA Management**
   - GitHub requires file SHA for PUT operations
   - Must fetch current file before updating
   - SHA changes each time file is updated

5. **Error Scenarios**
   - Network down: Show error alert
   - Auth failed: Check token in .env.local
   - File not found (404): Create new file? Or show error?
   - Merge conflict: Handle gracefully (not expected)

---

## ✅ SUCCESS CRITERIA

Phase 2A is complete when:
- [x] `.env.local` created with credentials
- [ ] GitHub API utilities work (test in browser console)
- [ ] Form submits to GitHub (check repo after adding resource)
- [ ] Table loads resources from GitHub (no localStorage)
- [ ] All 4 original resources visible
- [ ] New resources persist in GitHub repo
- [ ] Search + filter work on GitHub-loaded resources
- [ ] Pagination includes all resources (server + dynamic)
- [ ] No JavaScript errors in console
- [ ] Build succeeds with 0 warnings
- [ ] Code committed with clear message

---

## 🔗 REFERENCES

- **GitHub API Docs:** https://docs.github.com/en/rest/repos/contents
- **@octokit/rest:** Already in package.json
- **Environment Variables:** astro uses `import.meta.env`
- **Previous Completion:** TEMPS_1_COMPLETION_LOG.md

---

**Next Phase:** Phase 2B (Additional Taxonomies - 6 total fields)

