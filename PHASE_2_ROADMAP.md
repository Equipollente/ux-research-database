# UX Research Database - Phase 2 Complete Roadmap

**Created:** 2026-05-23  
**Status:** 🎯 Ready to Implement  
**Duration:** ~4-5 sessions (2-3 weeks)

---

## 📋 Phase 2 Overview

**Phase 1 Achievement:** ✅ Complete UI + Search + Filters + Pagination  
**Phase 2 Goal:** ✅ Persistent data management + GitHub backend + Full feature set

### Phase 2 Structure: 2 Times + 6 Sub-phases

```
TEMPS 1 (Immediate - 25 min)
├── 📝 MVP: Add Resource Form
│   └── Domain, Content Type, Topic taxonomies
│   └── localStorage persistence
│   └── Export to JSON
│
TEMPS 2 (Sessions 2-5)
├── Phase 2A: GitHub Backend Integration (1 session)
├── Phase 2B: Full Resource Form (1 session)
├── Phase 2C: Edit & Delete (0.5 session)
├── Phase 2D: Import/Export (0.5 session)
├── Phase 2E: Advanced Search (0.5 session)
└── Phase 2F: Collections & Tags (0.5-1 session)
```

---

# ⏱️ TEMPS 1: MVP Add Resource (25 min)

## 🎯 Objective
Add a resource with 3 taxonomies and export to resources.json for persistence

## 📋 Tasks

### 1.1 Create AddResourceForm Component (8 min)

**File:** `src/components/AddResourceForm.astro`

```astro
---
// Import data for dropdown options
import { domains, contentTypes, topics } from '../data/taxonomies.ts';
---

<div class="add-resource-form">
  <h2>Add New Resource</h2>
  <form id="addResourceForm">
    <!-- Source URL (required) -->
    <div class="form-group">
      <label for="source">Source URL *</label>
      <input 
        type="url" 
        id="source" 
        name="source" 
        required 
        placeholder="https://..."
      />
    </div>

    <!-- Comments (optional) -->
    <div class="form-group">
      <label for="comments">Comments</label>
      <textarea 
        id="comments" 
        name="comments" 
        rows="3"
        placeholder="Notes about this resource..."
      ></textarea>
    </div>

    <!-- Domain (multiples - checkboxes) -->
    <div class="form-group">
      <label>Domains *</label>
      <div class="checkbox-group">
        {domains.map(domain => (
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              name="domain" 
              value={domain}
            />
            {domain}
          </label>
        ))}
      </div>
    </div>

    <!-- Content Type (multiples - checkboxes) -->
    <div class="form-group">
      <label>Content Types *</label>
      <div class="checkbox-group">
        {contentTypes.map(type => (
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              name="content_type" 
              value={type}
            />
            {type}
          </label>
        ))}
      </div>
    </div>

    <!-- Topic (multiples - checkboxes) -->
    <div class="form-group">
      <label>Topics *</label>
      <div class="checkbox-group">
        {topics.map(topic => (
          <label class="checkbox-label">
            <input 
              type="checkbox" 
              name="topic" 
              value={topic}
            />
            {topic}
          </label>
        ))}
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="form-actions">
      <button type="submit" class="btn btn-primary">Add Resource</button>
      <button type="reset" class="btn btn-secondary">Clear</button>
      <button type="button" id="exportBtn" class="btn btn-secondary">
        💾 Export to JSON
      </button>
    </div>
  </form>

  <!-- Success message -->
  <div id="successMsg" class="success-message" style="display: none;">
    ✅ Resource added! Scroll down to see it in the table.
  </div>
</div>

<style>
  .add-resource-form {
    max-width: 600px;
    margin: 2rem auto;
    padding: 2rem;
    background: #f9fafb;
    border-radius: 8px;
    border: 1px solid #e5e7eb;
  }

  h2 {
    margin-top: 0;
    color: #1f2937;
    margin-bottom: 1.5rem;
  }

  .form-group {
    margin-bottom: 1.5rem;
  }

  label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  input[type="url"],
  input[type="text"],
  textarea {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 4px;
    font-size: 1rem;
    font-family: inherit;
    box-sizing: border-box;
  }

  input[type="url"]:focus,
  textarea:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .checkbox-group {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 0.75rem;
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: normal;
    cursor: pointer;
  }

  input[type="checkbox"] {
    cursor: pointer;
  }

  .form-actions {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }

  .btn {
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    font-weight: 500;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    background: #e5e7eb;
    color: #374151;
  }

  .btn-secondary:hover {
    background: #d1d5db;
  }

  .success-message {
    margin-top: 1rem;
    padding: 1rem;
    background: #d1fae5;
    color: #065f46;
    border-radius: 4px;
    border: 1px solid #6ee7b7;
  }

  @media (max-width: 768px) {
    .add-resource-form {
      margin: 1rem;
      padding: 1.5rem;
    }

    .checkbox-group {
      grid-template-columns: 1fr;
    }

    .form-actions {
      flex-direction: column;
    }
  }
</style>

<script>
  const form = document.getElementById('addResourceForm');
  const exportBtn = document.getElementById('exportBtn');
  const successMsg = document.getElementById('successMsg');

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    addResource();
  });

  exportBtn.addEventListener('click', () => {
    exportToJSON();
  });

  function addResource() {
    // Get form data
    const source = document.getElementById('source').value;
    const comments = document.getElementById('comments').value;
    
    const domains = Array.from(document.querySelectorAll('input[name="domain"]:checked'))
      .map(el => el.value);
    const contentTypes = Array.from(document.querySelectorAll('input[name="content_type"]:checked'))
      .map(el => el.value);
    const topics = Array.from(document.querySelectorAll('input[name="topic"]:checked'))
      .map(el => el.value);

    // Validation
    if (!source) {
      alert('❌ Source URL is required');
      return;
    }
    if (domains.length === 0 || contentTypes.length === 0 || topics.length === 0) {
      alert('❌ Please select at least one Domain, Content Type, and Topic');
      return;
    }

    // Create resource object
    const newResource = {
      id: `r-${Date.now()}`,
      source,
      comments: comments || '',
      domain: domains,
      content_type: contentTypes,
      topic: topics,
      access_model: [], // Empty for now (Phase 2B)
      origin: [],       // Empty for now (Phase 2B)
      publisher_type: [],  // Empty for now (Phase 2B)
      trust_level: 50,  // Default (Phase 2B: make configurable)
      last_updated: new Date().toISOString().split('T')[0],
    };

    // Get existing resources from localStorage
    const existing = JSON.parse(localStorage.getItem('uex-resources') || '[]');
    existing.push(newResource);
    localStorage.setItem('uex-resources', JSON.stringify(existing));

    // Show success message
    successMsg.style.display = 'block';
    form.reset();

    // Hide after 3 seconds
    setTimeout(() => {
      successMsg.style.display = 'none';
    }, 3000);

    // Trigger page reload to show new resource in table
    setTimeout(() => {
      window.location.reload();
    }, 1500);
  }

  function exportToJSON() {
    const resources = JSON.parse(localStorage.getItem('uex-resources') || '[]');
    
    if (resources.length === 0) {
      alert('❌ No resources to export. Add some first!');
      return;
    }

    const dataStr = JSON.stringify(resources, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'resources-export.json';
    link.click();
    URL.revokeObjectURL(url);
  }
</script>
```

### 1.2 Create Taxonomies Helper (2 min)

**File:** `src/data/taxonomies.ts`

```typescript
export const domains = [
  "UX Design",
  "UX Research",
  "Digital Product",
  "Behavioral Science",
  "Sociology",
  "Psychology",
  "Multidisciplinary",
];

export const contentTypes = [
  "Article",
  "Blog Post",
  "Case Study",
  "Research Paper",
  "Tool",
  "Template",
  "Framework",
  "Study",
  "Benchmark",
  "Audit",
  "Dataset",
  "Trend Report",
  "Encyclopedic",
];

export const topics = [
  "Cognition",
  "Emotion & Affect",
  "Social Behavior",
  "Culture & Identity",
  "Communication",
  "Ethics & Values",
  "Perception",
  "Attention",
  "Memory",
  "Decision Making",
  "Problem Solving",
  "Creativity",
  "Reasoning",
  "Motivation & Engagement",
  "Trust",
  "Technology & Society",
  "Interaction",
  "Usability",
  "Research Practice",
  "Design Process",
];
```

### 1.3 Integrate Form in Page (5 min)

**File:** `src/pages/index.astro`

```astro
---
import BaseLayout from '../layouts/BaseLayout.astro';
import AddResourceForm from '../components/AddResourceForm.astro';
import ResourceTable from '../components/ResourceTable.astro';
---

<BaseLayout title="UX Research Database">
  <main>
    <AddResourceForm />
    <hr style="margin: 3rem 0; border: none; border-top: 2px solid #e5e7eb;" />
    <ResourceTable />
  </main>
</BaseLayout>

<style>
  main {
    max-width: 1400px;
    margin: 0 auto;
    padding: 2rem 1rem;
  }
</style>
```

### 1.4 Update ResourceTable to Use localStorage (10 min)

**File:** `src/components/ResourceTable.astro`

Modify the data loading section to merge localStorage with resources.json:

```astro
---
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const resourcesPath = join(__dirname, '../data/resources.json');
const fileData = JSON.parse(readFileSync(resourcesPath, 'utf-8'));

// This will load localStorage data on client-side
// On server, use only resources.json
const initialResources = fileData;
---

<!-- In the <script> section, add: -->
<script define:vars={{ initialResources }}>
  // Merge server resources + localStorage
  const serverResources = initialResources;
  const localStorageResources = JSON.parse(localStorage.getItem('uex-resources') || '[]');
  const allResources = [...serverResources, ...localStorageResources];
  
  // Rest of ResourceTable logic uses allResources
</script>
```

### 1.5 Test & Validate (5 min)

- [ ] `npm run dev`
- [ ] Add 2-3 test resources
- [ ] Verify they appear in the table
- [ ] Click "Export to JSON"
- [ ] Check downloaded file contains resources
- [ ] Copy contents to `src/data/resources.json`
- [ ] Commit to GitHub

---

## ✅ Temps 1 Completion Checklist

- [ ] `AddResourceForm.astro` created with 3 taxonomies
- [ ] Form fields: Source, Comments, Domain, Content Type, Topic
- [ ] localStorage persistence working
- [ ] Resources appear in ResourceTable
- [ ] Export to JSON button working
- [ ] Resources.json updated with new data
- [ ] npm run build succeeds (0 errors)
- [ ] Committed to GitHub

**Result:** ✅ MVP complete, can add resources and persist data

---

---

# 📚 TEMPS 2: Full Feature Implementation

## Phase 2A: GitHub Backend Integration (Session 2 - 2-3 hours)

### 🎯 Objective
Replace localStorage with GitHub API for persistent, shared data

### 📋 Tasks

#### 2A.1 Setup GitHub App & Auth

**Files:** `.env.local`, `src/utils/github-auth.ts`

```typescript
// src/utils/github-auth.ts
export async function getGitHubToken() {
  // Option 1: Use personal access token from .env
  return import.meta.env.GITHUB_TOKEN;
  
  // Option 2: OAuth flow (future enhancement)
}

export async function getRepoContext() {
  return {
    owner: import.meta.env.GITHUB_OWNER,
    repo: import.meta.env.GITHUB_REPO,
    branch: import.meta.env.GITHUB_BRANCH || 'main',
  };
}
```

**Setup:**
- [ ] Create GitHub Personal Access Token (Settings → Developer Settings → Tokens)
- [ ] Scopes: `repo`, `workflow` (full control)
- [ ] Add to `.env.local`:
  ```
  GITHUB_TOKEN=ghp_xxxxxxxxxxxx
  GITHUB_OWNER=judith-h
  GITHUB_REPO=ux-research-database
  GITHUB_BRANCH=main
  ```
- [ ] Add `.env.local` to `.gitignore`

#### 2A.2 Create GitHub Save Function

**File:** `src/utils/github-api.ts` (extends existing)

```typescript
import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: import.meta.env.GITHUB_TOKEN,
});

const OWNER = import.meta.env.GITHUB_OWNER;
const REPO = import.meta.env.GITHUB_REPO;
const BRANCH = import.meta.env.GITHUB_BRANCH || 'main';

export async function saveResourcesToGitHub(resources: any[]) {
  try {
    // Get current file SHA (needed for updates)
    const { data: fileData } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: 'src/data/resources.json',
      ref: BRANCH,
    });

    const sha = fileData.sha;
    const content = Buffer.from(JSON.stringify(resources, null, 2)).toString('base64');

    // Update or create file
    const { data: commitData } = await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: 'src/data/resources.json',
      message: `[Auto] Add/update resources via UI`,
      content: content,
      sha: sha,
      branch: BRANCH,
    });

    return {
      success: true,
      sha: commitData.commit.sha,
      message: 'Resources saved to GitHub',
    };
  } catch (error) {
    console.error('GitHub save error:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

export async function loadResourcesFromGitHub() {
  try {
    const { data } = await octokit.repos.getContent({
      owner: OWNER,
      repo: REPO,
      path: 'src/data/resources.json',
      ref: BRANCH,
    });

    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    return JSON.parse(content);
  } catch (error) {
    console.error('GitHub load error:', error);
    return [];
  }
}
```

#### 2A.3 Update AddResourceForm for GitHub

```typescript
// In AddResourceForm.astro <script>
async function addResource() {
  // ... validation code ...

  const newResource = { /* ... */ };

  // Get all resources
  const response = await fetch('/api/resources');
  const existing = await response.json();
  const updated = [...existing, newResource];

  // Save to GitHub
  const saveResponse = await fetch('/api/resources', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updated),
  });

  if (saveResponse.ok) {
    showSuccess('✅ Resource saved to GitHub!');
  } else {
    showError('❌ Failed to save to GitHub');
  }
}
```

#### 2A.4 Create API Routes

**File:** `src/pages/api/resources.ts` (GET/POST)

```typescript
import type { APIRoute } from 'astro';
import { saveResourcesToGitHub, loadResourcesFromGitHub } from '../../utils/github-api';

export const GET: APIRoute = async () => {
  const resources = await loadResourcesFromGitHub();
  return new Response(JSON.stringify(resources), {
    headers: { 'Content-Type': 'application/json' },
  });
};

export const POST: APIRoute = async ({ request }) => {
  const resources = await request.json();
  const result = await saveResourcesToGitHub(resources);

  if (result.success) {
    return new Response(JSON.stringify(result), { status: 200 });
  } else {
    return new Response(JSON.stringify(result), { status: 500 });
  }
};
```

### 2A Checklist

- [ ] GitHub Personal Access Token created
- [ ] `.env.local` configured with token
- [ ] `github-api.ts` functions implemented
- [ ] `api/resources.ts` routes created
- [ ] AddResourceForm updated to use API
- [ ] Test: Add resource → appears in table
- [ ] Test: Refresh page → resource persists
- [ ] Test: Commit history shows auto commits
- [ ] localStorage cleared (can phase out)

**Result:** ✅ GitHub backend working, persistent shared data

---

## Phase 2B: Full Resource Form (Session 2 - 1.5 hours)

### 🎯 Objective
Add remaining 3 taxonomies + Trust Level + Last Updated fields

### 📋 Tasks

#### 2B.1 Extend AddResourceForm

Add to `AddResourceForm.astro`:

```astro
<!-- Access Model -->
<div class="form-group">
  <label>Access Models *</label>
  <div class="checkbox-group">
    {accessModels.map(model => (
      <label class="checkbox-label">
        <input type="checkbox" name="access_model" value={model} />
        {model}
      </label>
    ))}
  </div>
</div>

<!-- Origin -->
<div class="form-group">
  <label>Origins *</label>
  <div class="checkbox-group">
    {origins.map(origin => (
      <label class="checkbox-label">
        <input type="checkbox" name="origin" value={origin} />
        {origin}
      </label>
    ))}
  </div>
</div>

<!-- Publisher Type -->
<div class="form-group">
  <label>Publisher Types *</label>
  <div class="checkbox-group">
    {publisherTypes.map(type => (
      <label class="checkbox-label">
        <input type="checkbox" name="publisher_type" value={type} />
        {type}
      </label>
    ))}
  </div>
</div>

<!-- Trust Level Slider -->
<div class="form-group">
  <label for="trustLevel">Trust Level (0-100): <span id="trustValue">50</span></label>
  <input 
    type="range" 
    id="trustLevel" 
    name="trust_level" 
    min="0" 
    max="100" 
    value="50"
    style="width: 100%;"
  />
</div>
```

#### 2B.2 Update Taxonomies Data

**File:** `src/data/taxonomies.ts` - add:

```typescript
export const accessModels = [
  "Free",
  "Freemium",
  "Paid",
  "Institutional",
];

export const origins = [
  "Academic",
  "Industry",
  "Independent",
  "Community",
  "Institutional",
];

export const publisherTypes = [
  "Individual",
  "Collective",
  "Organization",
];
```

#### 2B.3 Update Form Script

```typescript
// In form submission, capture all 6 taxonomies:
const newResource = {
  // ... previous fields ...
  access_model: Array.from(document.querySelectorAll('input[name="access_model"]:checked')).map(el => el.value),
  origin: Array.from(document.querySelectorAll('input[name="origin"]:checked')).map(el => el.value),
  publisher_type: Array.from(document.querySelectorAll('input[name="publisher_type"]:checked')).map(el => el.value),
  trust_level: parseInt(document.getElementById('trustLevel').value),
  last_updated: new Date().toISOString().split('T')[0],
};
```

### 2B Checklist

- [ ] AddResourceForm extended with 3 new taxonomies
- [ ] Trust Level slider added with live value display
- [ ] All 6 taxonomies working in form
- [ ] Test: Add resource with all fields
- [ ] Test: GitHub save includes all fields
- [ ] Form validation updated (all required)
- [ ] Taxonomies data file updated

**Result:** ✅ Full form complete, all fields captured

---

## Phase 2C: Edit & Delete (Session 3 - 1 hour)

### 🎯 Objective
Allow editing and deleting resources

### 📋 Tasks

#### 2C.1 Add Edit Button to ResourceTable

In `ResourceTable.astro`, add edit/delete icons to each row:

```astro
<td class="actions">
  <button class="btn-edit" data-id="{resource.id}">✏️ Edit</button>
  <button class="btn-delete" data-id="{resource.id}">🗑️ Delete</button>
</td>
```

#### 2C.2 Create EditResourceForm Component

**File:** `src/components/EditResourceForm.astro`

```astro
---
// Similar to AddResourceForm, but pre-fills with existing data
// Props: resourceId, initialData
---

<!-- Form similar to AddResourceForm -->
<!-- On submit: updates via API -->
```

#### 2C.3 Add Delete Confirmation Modal

```typescript
function deleteResource(resourceId) {
  const confirmed = confirm('Are you sure? This cannot be undone.');
  if (!confirmed) return;

  fetch(`/api/resources/${resourceId}`, {
    method: 'DELETE',
  }).then(() => window.location.reload());
}
```

#### 2C.4 Create API Routes

**Files:** `src/pages/api/resources/[id].ts`

```typescript
export const PUT: APIRoute = async ({ params, request }) => {
  const resourceId = params.id;
  const updated = await request.json();
  // Load all, find & replace, save back
};

export const DELETE: APIRoute = async ({ params }) => {
  const resourceId = params.id;
  // Load all, filter out, save back
};
```

### 2C Checklist

- [ ] Edit button added to ResourceTable
- [ ] Delete button with confirmation
- [ ] EditResourceForm component created
- [ ] API routes for PUT/DELETE working
- [ ] Test: Edit resource, changes persisted
- [ ] Test: Delete resource, removed from table
- [ ] Test: GitHub commit history shows changes

**Result:** ✅ Full CRUD operations working

---

## Phase 2D: Import/Export (Session 3 - 1 hour)

### 🎯 Objective
Bulk import CSV/JSON, export all resources

### 📋 Tasks

#### 2D.1 Create Import Component

**File:** `src/components/ImportResources.astro`

```astro
<div class="import-section">
  <h3>Bulk Import</h3>
  <input type="file" id="importFile" accept=".json,.csv" />
  <button id="importBtn">Import</button>
</div>

<script>
  function importResources() {
    const file = document.getElementById('importFile').files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      let resources;
      
      if (file.name.endsWith('.json')) {
        resources = JSON.parse(e.target.result);
      } else if (file.name.endsWith('.csv')) {
        resources = parseCSV(e.target.result);
      }

      // Save to GitHub
      const response = await fetch('/api/resources/import', {
        method: 'POST',
        body: JSON.stringify(resources),
      });

      if (response.ok) {
        window.location.reload();
      }
    };
    reader.readAsText(file);
  }

  function parseCSV(csv) {
    // Parse CSV into resources array
  }
</script>
```

#### 2D.2 Export Button (already done in Temps 1)

Enhanced version:

```typescript
function exportResources(format = 'json') {
  fetch('/api/resources')
    .then(r => r.json())
    .then(resources => {
      let content, filename, type;

      if (format === 'json') {
        content = JSON.stringify(resources, null, 2);
        filename = 'resources.json';
        type = 'application/json';
      } else if (format === 'csv') {
        content = convertToCSV(resources);
        filename = 'resources.csv';
        type = 'text/csv';
      }

      const blob = new Blob([content], { type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
    });
}

function convertToCSV(resources) {
  const headers = ['id', 'source', 'comments', 'domain', 'content_type', 'topic', 'access_model', 'origin', 'publisher_type', 'trust_level', 'last_updated'];
  const csv = [
    headers.join(','),
    ...resources.map(r => [
      r.id,
      `"${r.source}"`,
      `"${r.comments}"`,
      r.domain.join(';'),
      r.content_type.join(';'),
      r.topic.join(';'),
      r.access_model.join(';'),
      r.origin.join(';'),
      r.publisher_type.join(';'),
      r.trust_level,
      r.last_updated,
    ].join(',')),
  ].join('\n');
  return csv;
}
```

### 2D Checklist

- [ ] ImportResources component created
- [ ] JSON import working
- [ ] CSV import parsing working
- [ ] Export to JSON working
- [ ] Export to CSV working
- [ ] Test: Import → resources appear
- [ ] Test: Export → file matches source

**Result:** ✅ Bulk import/export complete

---

## Phase 2E: Advanced Search (Session 4 - 1.5 hours)

### 🎯 Objective
Add date range filters and trust level slider to search

### 📋 Tasks

#### 2E.1 Extend Filter Bar

Add to filter accordion:

```astro
<!-- Date Range Filter -->
<div class="filter-section">
  <h4>Last Updated</h4>
  <input type="date" id="dateFrom" />
  <span>to</span>
  <input type="date" id="dateTo" />
</div>

<!-- Trust Level Range -->
<div class="filter-section">
  <h4>Trust Level</h4>
  <div class="range-slider">
    <input type="range" id="trustMin" min="0" max="100" value="0" />
    <input type="range" id="trustMax" min="0" max="100" value="100" />
  </div>
  <span id="trustRange">0 - 100</span>
</div>
```

#### 2E.2 Update Filter Logic

```typescript
function matchesDateRange(resource, fromDate, toDate) {
  const resourceDate = new Date(resource.last_updated);
  if (fromDate && resourceDate < fromDate) return false;
  if (toDate && resourceDate > toDate) return false;
  return true;
}

function matchesTrustRange(resource, minTrust, maxTrust) {
  return resource.trust_level >= minTrust && resource.trust_level <= maxTrust;
}

// Update getVisibleRows to include these checks
```

#### 2E.3 Save Filter State

```typescript
function saveFilterState() {
  const filters = {
    dateFrom: document.getElementById('dateFrom').value,
    dateTo: document.getElementById('dateTo').value,
    trustMin: document.getElementById('trustMin').value,
    trustMax: document.getElementById('trustMax').value,
  };
  localStorage.setItem('uex-filters', JSON.stringify(filters));
}

function loadFilterState() {
  const saved = JSON.parse(localStorage.getItem('uex-filters') || '{}');
  if (saved.dateFrom) document.getElementById('dateFrom').value = saved.dateFrom;
  if (saved.dateTo) document.getElementById('dateTo').value = saved.dateTo;
  if (saved.trustMin) document.getElementById('trustMin').value = saved.trustMin;
  if (saved.trustMax) document.getElementById('trustMax').value = saved.trustMax;
}
```

### 2E Checklist

- [ ] Date range filter added to UI
- [ ] Trust level range slider added
- [ ] Filter logic updated for dates & trust
- [ ] Filters persist in localStorage
- [ ] Test: Filter by date range
- [ ] Test: Filter by trust level
- [ ] Test: Combination filters work
- [ ] Test: Reload → filters restored

**Result:** ✅ Advanced search complete

---

## Phase 2F: Collections & Tags (Session 4-5 - 1.5 hours)

### 🎯 Objective
Add Collections/Categories and Tags (distinct from taxonomies)

### 📋 Tasks

#### 2F.1 Update Data Model

**File:** `src/data/schema.json`

```json
{
  "collections": [
    "Foundational Theory",
    "Methods & Tools",
    "Industry Practice",
    "Emerging Topics",
    "Case Studies"
  ],
  "resource": {
    "collection": "string",
    "tags": ["array", "of", "strings"]
  }
}
```

#### 2F.2 Add Collection Field to Form

```astro
<div class="form-group">
  <label for="collection">Collection</label>
  <select id="collection" name="collection">
    <option value="">--Select--</option>
    {collections.map(c => (
      <option value={c}>{c}</option>
    ))}
  </select>
</div>

<div class="form-group">
  <label for="tags">Tags (comma-separated)</label>
  <input 
    type="text" 
    id="tags" 
    name="tags"
    placeholder="e.g., important, read-later, reference"
  />
</div>
```

#### 2F.3 Add Collection Filter

```astro
<!-- In ResourceTable filter accordion -->
<div class="filter-section">
  <h4>Collections</h4>
  {collections.map(collection => (
    <label class="filter-pill">
      <input type="checkbox" name="collection" value={collection} />
      {collection}
    </label>
  ))}
</div>
```

#### 2F.4 Tag Display in Table

```astro
<!-- Add tags column to table -->
<td class="tags">
  {resource.tags?.map(tag => (
    <span class="tag tag-custom">{tag}</span>
  ))}
</td>

<style>
  .tag-custom {
    background: #f3e8ff;
    color: #6d28d9;
    border: 1px solid #c4b5fd;
  }
</style>
```

#### 2F.5 Collection Stats

```typescript
function getCollectionStats() {
  const stats = {};
  resources.forEach(r => {
    const col = r.collection || 'Uncategorized';
    stats[col] = (stats[col] || 0) + 1;
  });
  return stats;
}

// Display in sidebar or dashboard
```

### 2F Checklist

- [ ] Collections field added to resources
- [ ] Tags field added to resources
- [ ] Form updated with collection select
- [ ] Form updated with tags input
- [ ] Collection filter added to table
- [ ] Tags column displays in table
- [ ] Collection stats working
- [ ] Test: Add resource to collection
- [ ] Test: Filter by collection
- [ ] Test: Search within collection

**Result:** ✅ Collections & Tags system complete

---

---

# 📊 Phase 2 Summary

## Implementation Order

```
Session 1 (25 min): TEMPS 1 MVP
├── AddResourceForm (Domain, Content Type, Topic)
├── localStorage persistence
└── Export to JSON

Session 2 (3-4 hours): Phase 2A + 2B
├── 2A: GitHub Backend Integration
└── 2B: Full Resource Form (all 6 taxonomies)

Session 3 (2-3 hours): Phase 2C + 2D
├── 2C: Edit & Delete
└── 2D: Import/Export

Session 4-5 (2-3 hours): Phase 2E + 2F
├── 2E: Advanced Search
└── 2F: Collections & Tags
```

## Key Files to Create/Modify

### New Files
- `src/components/AddResourceForm.astro` (MVP)
- `src/components/EditResourceForm.astro` (2C)
- `src/components/ImportResources.astro` (2D)
- `src/data/taxonomies.ts` (MVP)
- `src/utils/github-api.ts` (2A - extends existing)
- `src/pages/api/resources.ts` (2A)
- `src/pages/api/resources/[id].ts` (2C)

### Modified Files
- `src/pages/index.astro` (add form component)
- `src/components/ResourceTable.astro` (add localStorage merge, edit/delete buttons)
- `src/data/resources.json` (populated via Temps 1 export)
- `src/data/schema.json` (update with new fields)

## Success Criteria for Each Phase

### Phase 2A ✅
- [ ] Resources persist via GitHub API
- [ ] Multiple users can see same data
- [ ] Commit history shows auto-commits

### Phase 2B ✅
- [ ] Form has all 6 taxonomies
- [ ] Trust level configurable
- [ ] All fields saved to GitHub

### Phase 2C ✅
- [ ] Edit button functional
- [ ] Delete with confirmation
- [ ] Changes reflected immediately

### Phase 2D ✅
- [ ] Import JSON/CSV works
- [ ] Export JSON/CSV works
- [ ] Data integrity maintained

### Phase 2E ✅
- [ ] Date range filters work
- [ ] Trust level filters work
- [ ] Filters persist in localStorage

### Phase 2F ✅
- [ ] Collections accessible
- [ ] Tags displayable
- [ ] Collection filters work

---

## 🎯 Phase 2 Final Status

**READY TO IMPLEMENT** ✅

Each phase is:
- ✅ Clearly defined
- ✅ Divided into small tasks
- ✅ Has specific success criteria
- ✅ Estimated time (1-2 hours each)
- ✅ Backwards compatible

**Next Step:** Begin Temps 1 MVP (25 min) to get to "can add resources" ✅

---

**Created:** 2026-05-23  
**Last Updated:** 2026-05-23  
**Status:** Ready for Implementation
