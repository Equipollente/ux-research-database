import type { Handler } from '@netlify/functions';
import {
  checkAdminPassword,
  getGitHubEnv,
  isErrorResponse,
  fetchResourcesFile,
  commitResourcesFile,
  type Resource,
} from './_lib/github';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const authErr = checkAdminPassword(event);
  if (authErr) return authErr;

  let payload: { id?: string; resource?: Resource };
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { id, resource } = payload;
  if (!id || !resource) {
    return { statusCode: 400, body: 'Missing required fields: id, resource' };
  }

  const env = getGitHubEnv();
  if (isErrorResponse(env)) return env;

  const fileResult = await fetchResourcesFile(env);
  if (isErrorResponse(fileResult)) return fileResult;

  const { data: current, sha } = fileResult;

  const index = current.resources.findIndex((r) => r.id === id);
  if (index === -1) {
    return { statusCode: 404, body: `Resource not found: ${id}` };
  }

  const updatedResources = [...current.resources];
  updatedResources[index] = { ...resource, id };

  const updated = { ...current, resources: updatedResources };

  const commitErr = await commitResourcesFile(
    env,
    updated,
    sha,
    `Update resource: ${String(resource.source ?? id)}`
  );
  if (commitErr) return commitErr;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, id }),
  };
};
