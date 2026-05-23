import type { Handler } from '@netlify/functions';
import {
  checkAdminPassword,
  getGitHubEnv,
  isErrorResponse,
  fetchResourcesFile,
  commitResourcesFile,
} from './_lib/github';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const authErr = checkAdminPassword(event);
  if (authErr) return authErr;

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

  const env = getGitHubEnv();
  if (isErrorResponse(env)) return env;

  const fileResult = await fetchResourcesFile(env);
  if (isErrorResponse(fileResult)) return fileResult;

  const { data: current, sha } = fileResult;

  const resourceToDelete = current.resources.find((r) => r.id === id);
  if (!resourceToDelete) {
    return { statusCode: 404, body: `Resource not found: ${id}` };
  }

  const updated = {
    ...current,
    resources: current.resources.filter((r) => r.id !== id),
  };

  const commitErr = await commitResourcesFile(
    env,
    updated,
    sha,
    `Delete resource: ${String(resourceToDelete.source ?? id)}`
  );
  if (commitErr) return commitErr;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, id }),
  };
};
