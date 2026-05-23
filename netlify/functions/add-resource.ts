import type { Handler } from '@netlify/functions';

// Resource shape kept inline (functions run in a separate context from src/).
// If this drifts from src/utils/data-transform.ts, both must be updated.
interface Resource {
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

interface ResourceData {
  taxonomies: Record<string, string[]>;
  resources: Resource[];
}

const GITHUB_API = 'https://api.github.com';
const FILE_PATH = 'src/data/resources.json';

export const handler: Handler = async (event) => {
  // 1. Method gate
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  // 2. Auth gate (constant-time comparison would be ideal, but for a
  //    single-admin scenario simple equality is acceptable)
  const password = event.headers['x-admin-password'];
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { statusCode: 500, body: 'Server misconfigured: ADMIN_PASSWORD not set' };
  }
  if (!password || password !== expected) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  // 3. Parse incoming resource
  let newResource: Resource;
  try {
    newResource = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  if (!newResource.source) {
    return { statusCode: 400, body: 'Missing required field: source' };
  }

  // 4. Server-side GitHub config
  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token || !owner || !repo) {
    return { statusCode: 500, body: 'Server misconfigured: missing GitHub vars' };
  }

  const apiUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${FILE_PATH}`;

  // 5. Fetch current file (need sha + content to update)
  const getRes = await fetch(`${apiUrl}?ref=${branch}`, {
    headers: {
      Authorization: `token ${token}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!getRes.ok) {
    return { statusCode: 502, body: `Failed to fetch current file: ${getRes.status}` };
  }

  const fileMeta = await getRes.json();
  const currentRaw = Buffer.from(
    String(fileMeta.content).replace(/\s/g, ''),
    'base64'
  ).toString('utf-8');

  let current: ResourceData;
  try {
    current = JSON.parse(currentRaw);
  } catch {
    return { statusCode: 502, body: 'Corrupt JSON on server' };
  }

  // 6. Append resource
  const updated: ResourceData = {
    ...current,
    resources: [...(current.resources || []), newResource],
  };

  // 7. Commit
  const newContentBase64 = Buffer.from(JSON.stringify(updated, null, 2)).toString('base64');
  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Add resource: ${newResource.source}`,
      content: newContentBase64,
      branch,
      sha: fileMeta.sha,
    }),
  });

  if (!putRes.ok) {
    const errBody = await putRes.text();
    return { statusCode: 502, body: `Failed to commit: ${errBody}` };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, id: newResource.id }),
  };
};
