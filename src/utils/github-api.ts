// GitHub API integration for authenticated edits

import type { Resource } from './data-transform';
export type { Resource };

export interface GitHubAuthContext {
  token: string;
  owner: string;
  repo: string;
  branch: string;
}

const GITHUB_API_BASE = 'https://api.github.com';

// Note: These functions use GitHub REST API directly (fetch)
// Octokit will be added later if needed for complex operations

export async function getFileContent(
  auth: GitHubAuthContext,
  filePath: string
): Promise<{ content: string; sha: string }> {
  const url = `${GITHUB_API_BASE}/repos/${auth.owner}/${auth.repo}/contents/${filePath}`;

  const fullResponse = await fetch(url, {
    headers: {
      Authorization: `token ${auth.token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!fullResponse.ok) {
    const errorText = await fullResponse.text();
    throw new Error(`Failed to fetch ${filePath}: ${fullResponse.statusText} - ${errorText}`);
  }

  const data = await fullResponse.json();

  if (!data.content) {
    throw new Error(`No content in GitHub API response for ${filePath}`);
  }

  // Strip whitespace from base64 string (GitHub returns newlines in the encoded content)
  const cleanBase64 = data.content.replace(/\s/g, '');
  const content = atob(cleanBase64); // Decode base64

  return { content, sha: data.sha };
}

export async function commitFile(
  auth: GitHubAuthContext,
  filePath: string,
  content: string,
  message: string,
  sha?: string
): Promise<void> {
  const url = `${GITHUB_API_BASE}/repos/${auth.owner}/${auth.repo}/contents/${filePath}`;

  const payload = {
    message,
    content: btoa(content), // Encode to base64
    branch: auth.branch,
    ...(sha && { sha }), // Include SHA if updating existing file
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `token ${auth.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to commit: ${error.message}`);
  }
}

export function loadAuthFromStorage(): GitHubAuthContext | null {
  const stored = localStorage.getItem('gh_auth');
  if (!stored) return null;
  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

export function saveAuthToStorage(auth: GitHubAuthContext): void {
  localStorage.setItem('gh_auth', JSON.stringify(auth));
}

export function clearAuthFromStorage(): void {
  localStorage.removeItem('gh_auth');
}

// Hardcoded: these are public, invariant identifiers. Avoiding env vars here
// means CI builds work even without .env.local (which is gitignored).
const RAW_RESOURCES_URL =
  'https://raw.githubusercontent.com/equipollente/ux-research-database/main/src/data/resources.json';

export async function getResourcesFromGitHub(): Promise<Resource[]> {
  // Read via raw.githubusercontent.com: public, no token, no CORS issues, no base64.
  const url = RAW_RESOURCES_URL;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch resources: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();
    return data.resources || data || [];
  } catch (error) {
    console.error('Failed to fetch resources from raw GitHub:', error);
    return [];
  }
}
