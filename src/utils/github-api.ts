// GitHub API integration for authenticated edits

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

  const response = await fetch(url, {
    headers: {
      Authorization: `token ${auth.token}`,
      Accept: 'application/vnd.github.v3.raw',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch ${filePath}: ${response.statusText}`);
  }

  // Get SHA from response headers
  const fullResponse = await fetch(url, {
    headers: {
      Authorization: `token ${auth.token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  const data = await fullResponse.json();
  const content = atob(data.content); // Decode base64

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

export interface Resource {
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

export async function getResourcesFromGitHub(): Promise<Resource[]> {
  const auth: GitHubAuthContext = {
    token: import.meta.env.GITHUB_TOKEN,
    owner: import.meta.env.GITHUB_OWNER,
    repo: import.meta.env.GITHUB_REPO,
    branch: import.meta.env.GITHUB_BRANCH,
  };

  try {
    const { content } = await getFileContent(auth, 'src/data/resources.json');
    const data = JSON.parse(content);
    return data.resources || data || [];
  } catch (error) {
    console.error('Failed to fetch resources from GitHub:', error);
    return [];
  }
}
