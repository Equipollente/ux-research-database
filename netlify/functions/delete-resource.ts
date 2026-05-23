import type { Handler } from '@netlify/functions';

interface ResourceData {
  taxonomies: Record<string, string[]>;
  resources: Array<{ id: string; [key: string]: unknown }>;
}

const GITHUB_API = 'https://api.github.com';
const FILE_PATH = 'src/data/resources.json';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const password = event.headers['x-admin-password'];
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    return { statusCode: 500, body: 'Server misconfigured: ADMIN_PASSWORD not set' };
  }
  if (!password || password !== expected) {
    return { statusCode: 401, body: 'Unauthorized' };
  }

  let payload: { id?: string };
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { id } = payload;
  if (!id) {
    return { statusCode: 400, body: 'Missing required field: id' };
  }

  const token = process.env.GITHUB_TOKEN;
  const owner = process.env.GITHUB_OWNER;
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';

  if (!token || !owner || !repo) {
    return { statusCode: 500, body: 'Server misconfigured: missing GitHub vars' };
  }

  const apiUrl = `${GITHUB_API}/repos/${owner}/${repo}/contents/${FILE_PATH}`;

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

  const resourceToDelete = current.resources.find((r) => r.id === id);
  if (!resourceToDelete) {
    return { statusCode: 404, body: `Resource not found: ${id}` };
  }

  const updated: ResourceData = {
    ...current,
    resources: current.resources.filter((r) => r.id !== id),
  };

  const newContentBase64 = Buffer.from(JSON.stringify(updated, null, 2)).toString('base64');
  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers: {
      Authorization: `token ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `Delete resource: ${String(resourceToDelete.source ?? id)}`,
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
    body: JSON.stringify({ success: true, id }),
  };
};
