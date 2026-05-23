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
  access_model: string;
  origin: string;
  publisher_type: string;
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

export async function loadResources(): Promise<ResourceData> {
  try {
    const response = await fetch('/data/resources.json');
    if (!response.ok) throw new Error(`Failed to load resources: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error loading resources:', error);
    throw error;
  }
}

export function isValidUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}
