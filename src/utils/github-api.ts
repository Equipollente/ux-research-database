// Client-side reads of resources.json from the public GitHub mirror.
// Writes go through the Netlify Function at /api/add-resource (see
// netlify/functions/add-resource.ts) — never call the GitHub API
// directly from this file or any client code, because that would require
// exposing a token in the bundle.

import type { Resource } from './data-transform';
export type { Resource };

// Hardcoded: these are public, invariant identifiers. Using env vars here
// would break CI builds (.env.local is gitignored, so CI has no values).
// Owner uses lowercase: github is case-insensitive on owner names.
const RAW_RESOURCES_URL =
  'https://raw.githubusercontent.com/equipollente/ux-research-database/main/src/data/resources.json';

export async function getResourcesFromGitHub(): Promise<{
  resources: Resource[];
  taxonomies: Record<string, string[]>;
}> {
  // Cache-buster: raw.githubusercontent.com sets Cache-Control max-age=300,
  // which would otherwise hide new resources for ~5 min after a commit.
  // The query string is ignored by GitHub's server but treated as a unique
  // URL by browsers and CDN edge caches, forcing a fresh fetch every time.
  const url = `${RAW_RESOURCES_URL}?t=${Date.now()}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch resources: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return {
      resources: data.resources || [],
      taxonomies: data.taxonomies || {},
    };
  } catch (error) {
    console.error('Failed to fetch resources from raw GitHub:', error);
    return { resources: [], taxonomies: {} };
  }
}
