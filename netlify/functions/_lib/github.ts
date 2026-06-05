/**
 * Shared helpers for Netlify Functions that read/write resources.json via the GitHub API.
 * The underscore prefix tells Netlify not to treat this file as a Function endpoint.
 */

import type { HandlerEvent } from '@netlify/functions';

export interface Resource {
  id: string;
  source: string;
  comments: string;
  access_model: string[];
  origin: string[];
  publisher_type: string[];
  domain: string[];
  content_type: string[];
  topic: string[];
  trust_level: number;
  last_updated: string;
}

export interface ResourceData {
  taxonomies: Record<string, string[]>;
  resources: Resource[];
}

interface GitHubEnv {
  token: string;
  owner: string;
  repo: string;
  branch: string;
  apiUrl: string;
}

const FILE_PATH = 'src/data/resources.json';
const GITHUB_API = 'https://api.github.com';

// Returns a 401 response object if auth fails, null if OK.
export function checkAdminPassword(
  event: HandlerEvent
): { statusCode: number; body: string } | null {
  const password = event.headers['x-admin-password'];
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { statusCode: 500, body: 'Server misconfigured: ADMIN_PASSWORD not set' };
  }
  if (!password || password !== expected) {
    return { statusCode: 401, body: 'Unauthorized' };
  }
  return null;
}

// Returns env config or a 500 response object.
export function getGitHubEnv(): GitHubEnv | { statusCode: number; body: string } {
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  if (!token || !owner || !repo) {
    return { statusCode: 500, body: 'Server misconfigured: missing GitHub vars' };
  }
  const branch = process.env.GITHUB_BRANCH || 'main';
  const apiUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${FILE_PATH}`;
  return { token, owner, repo, branch, apiUrl };
}

export function isErrorResponse(
  v: unknown
): v is { statusCode: number; body: string } {
  return typeof v === 'object' && v !== null && 'statusCode' in v;
}

// Fetches the current resources.json from GitHub. Returns {data, sha} or a response object.
export async function fetchResourcesFile(
  env: GitHubEnv
): Promise<{ data: ResourceData; sha: string } | { statusCode: number; body: string }> {
  const getRes = await fetch(`${env.apiUrl}?ref=${env.branch}`, {
    headers: {
      Authorization: `token ${env.token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!getRes.ok) {
    return { statusCode: 502, body: `Failed to fetch current file: ${getRes.status}` };
  }

  const fileMeta = await getRes.json();
  const sha: string = fileMeta.sha;
  const raw = Buffer.from(String(fileMeta.content).replace(/\s/g, ''), 'base64').toString('utf-8');

  let data: ResourceData;
  try {
    data = JSON.parse(raw);
  } catch {
    return { statusCode: 502, body: 'Corrupt JSON on server' };
  }

  return { data, sha };
}

// Commits updated data back to GitHub. Returns null on success or a response object on failure.
export async function commitResourcesFile(
  env: GitHubEnv,
  updated: ResourceData,
  sha: string,
  message: string
): Promise<{ statusCode: number; body: string } | null> {
  const content = Buffer.from(JSON.stringify(updated, null, 2)).toString('base64');
  const putRes = await fetch(env.apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${env.token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, content, branch: env.branch, sha }),
  });

  if (!putRes.ok) {
    const errBody = await putRes.text();
    return { statusCode: 502, body: `Failed to commit: ${errBody}` };
  }

  return null;
}
