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
  // All taxonomy fields now use OR logic within the same taxonomy
  // (e.g., Free OR Freemium, or Academic OR Industry)

  // Access Model: if filter selected, resource must have at least one matching value
  if (filters.access_model.length > 0) {
    if (!filters.access_model.some((am) => resource.access_model.includes(am))) {
      return false;
    }
  }

  // Origin: if filter selected, resource must have at least one matching value
  if (filters.origin.length > 0) {
    if (!filters.origin.some((o) => resource.origin.includes(o))) {
      return false;
    }
  }

  // Publisher Type: if filter selected, resource must have at least one matching value
  if (filters.publisher_type.length > 0) {
    if (!filters.publisher_type.some((pt) => resource.publisher_type.includes(pt))) {
      return false;
    }
  }

  // Domain: if filter selected, resource must have at least one matching value
  if (filters.domain.length > 0) {
    if (!filters.domain.some((d) => resource.domain.includes(d))) {
      return false;
    }
  }

  // Content Type: if filter selected, resource must have at least one matching value
  if (filters.content_type.length > 0) {
    if (!filters.content_type.some((ct) => resource.content_type.includes(ct))) {
      return false;
    }
  }

  // Topic: if filter selected, resource must have at least one matching value
  if (filters.topic.length > 0) {
    if (!filters.topic.some((t) => resource.topic.includes(t))) {
      return false;
    }
  }

  return true;
}

export function filterResources(resources: Resource[], filters: FilterState): Resource[] {
  return resources.filter((resource) => {
    return matchesSearch(resource, filters.search) && matchesFilters(resource, filters);
  });
}
