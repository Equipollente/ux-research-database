// Search and filter logic for resources

import type { Resource } from './data-transform';

export interface FilterState {
  search: string;
  access_model: string[];
  origin: string[];
  publisher_type: string[];
  domain: string[];
  content_type: string[];
  topic: string[];
}

export function normalizeSearch(str: string): string {
  return str.toLowerCase().replace(/[àâäéèêëïîôùûüœæ]/g, (c) => ({
    'à': 'a', 'â': 'a', 'ä': 'a',
    'é': 'e', 'è': 'e', 'ê': 'e', 'ë': 'e',
    'ï': 'i', 'î': 'i',
    'ô': 'o',
    'ù': 'u', 'û': 'u', 'ü': 'u',
    'œ': 'oe', 'æ': 'ae'
  }[c] || c));
}

export function matchesSearch(resource: Resource, query: string): boolean {
  if (!query.trim()) return true;
  const normalized = normalizeSearch(query);
  const source = normalizeSearch(resource.source);
  const comments = normalizeSearch(resource.comments || '');
  return source.includes(normalized) || comments.includes(normalized);
}

export function matchesFilters(resource: Resource, filters: FilterState): boolean {
  // Mono-value filters: OR logic (Free OR Freemium)
  if (filters.access_model.length > 0 && !filters.access_model.includes(resource.access_model)) {
    return false;
  }
  if (filters.origin.length > 0 && !filters.origin.includes(resource.origin)) {
    return false;
  }
  if (filters.publisher_type.length > 0 && !filters.publisher_type.includes(resource.publisher_type)) {
    return false;
  }

  // Multi-value filters: AND logic (superset matching)
  // Resource must contain ALL selected values
  if (filters.domain.length > 0) {
    if (!filters.domain.every((d) => resource.domain.includes(d))) return false;
  }
  if (filters.content_type.length > 0) {
    if (!filters.content_type.every((ct) => resource.content_type.includes(ct))) return false;
  }
  if (filters.topic.length > 0) {
    if (!filters.topic.every((t) => resource.topic.includes(t))) return false;
  }

  return true;
}

export function filterResources(resources: Resource[], filters: FilterState): Resource[] {
  return resources.filter((resource) => {
    return matchesSearch(resource, filters.search) && matchesFilters(resource, filters);
  });
}
