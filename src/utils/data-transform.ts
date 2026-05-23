// Parse and transform resources.json data

export interface Taxonomies {
  access_model: string[];
  origin: string[];
  publisher_type: string[];
  domain: string[];
  content_type: string[];
  topic: string[];
}

export interface Resource {
  id: string;
  source: string;
  access_model: string[];
  origin: string[];
  publisher_type: string[];
  domain: string[];
  content_type: string[];
  topic: string[];
  trust_level: number;
  comments?: string;
  last_updated: string;
}

export interface ResourceData {
  taxonomies: Taxonomies;
  resources: Resource[];
}

export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
