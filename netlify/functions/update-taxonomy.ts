import type { Handler } from '@netlify/functions';
import {
  checkAdminPassword,
  getGitHubEnv,
  isErrorResponse,
  fetchResourcesFile,
  commitResourcesFile,
  type ResourceData,
} from './_lib/github';

const VALID_TAXONOMY_NAMES = [
  'access_model',
  'origin',
  'publisher_type',
  'domain',
  'content_type',
  'topic',
] as const;

type TaxonomyName = (typeof VALID_TAXONOMY_NAMES)[number];

interface UpdateTaxonomyPayload {
  name: TaxonomyName;
  values: string[];
  renames?: Record<string, string>;
}

function applyRenames(data: ResourceData, name: TaxonomyName, renames: Record<string, string>): ResourceData {
  if (Object.keys(renames).length === 0) return data;

  const updatedResources = data.resources.map((resource) => {
    const fieldValue = resource[name as keyof typeof resource];
    if (!Array.isArray(fieldValue)) return resource;

    const updatedField = (fieldValue as string[]).map((v) => renames[v] ?? v);
    return { ...resource, [name]: updatedField };
  });

  return { ...data, resources: updatedResources };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const authErr = checkAdminPassword(event);
  if (authErr) return authErr;

  let payload: UpdateTaxonomyPayload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { name, values, renames = {} } = payload;

  if (!name || !VALID_TAXONOMY_NAMES.includes(name)) {
    return { statusCode: 400, body: `Invalid taxonomy name: ${name}` };
  }
  if (!Array.isArray(values) || values.length === 0) {
    return { statusCode: 400, body: 'values must be a non-empty array' };
  }

  const env = getGitHubEnv();
  if (isErrorResponse(env)) return env;

  const fileResult = await fetchResourcesFile(env);
  if (isErrorResponse(fileResult)) return fileResult;

  const { data: current, sha } = fileResult;

  const currentValues: string[] = current.taxonomies[name] || [];
  const valuesSet = new Set(values);
  const renameKeys = new Set(Object.keys(renames));

  // Safety check: detect values being deleted that are still in use by resources
  const dropped = currentValues.filter((v) => !valuesSet.has(v) && !renameKeys.has(v));
  if (dropped.length > 0) {
    const usedCounts: Record<string, number> = {};
    for (const resource of current.resources) {
      const field = resource[name as keyof typeof resource];
      if (Array.isArray(field)) {
        for (const v of field as string[]) {
          if (dropped.includes(v)) {
            usedCounts[v] = (usedCounts[v] || 0) + 1;
          }
        }
      }
    }
    const usedDropped = dropped.filter((v) => usedCounts[v] > 0);
    if (usedDropped.length > 0) {
      const detail = usedDropped.map((v) => `"${v}" (${usedCounts[v]} resource(s))`).join(', ');
      return {
        statusCode: 400,
        body: `Cannot delete taxonomy values still used by resources: ${detail}`,
      };
    }
  }

  // Apply renames across all resources
  let updated = applyRenames(current, name, renames);

  // Replace the taxonomy list
  updated = {
    ...updated,
    taxonomies: { ...updated.taxonomies, [name]: values },
  };

  const commitErr = await commitResourcesFile(
    env,
    updated,
    sha,
    `Update taxonomy: ${name} (${Object.keys(renames).length} rename(s), ${values.length} value(s))`
  );
  if (commitErr) return commitErr;

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true, name, values }),
  };
};
