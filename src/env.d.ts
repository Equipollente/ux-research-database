/// <reference types="astro/client" />

// No project-specific env vars are exposed to the client.
// Writes go through netlify/functions/add-resource.ts, which reads its
// secrets (GITHUB_TOKEN, ADMIN_PASSWORD, GITHUB_OWNER/REPO/BRANCH) from
// Netlify's server-side environment — never bundled into the client.
//
// Reads are unauthenticated against raw.githubusercontent.com with a
// hardcoded URL in src/utils/github-api.ts.
