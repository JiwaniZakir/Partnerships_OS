export interface GraphNode {
  id: string;
  label: string;
  type: 'member' | 'contact' | 'organization';
  properties: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  target: string;
  type: string;
  properties: Record<string, unknown>;
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface PathResult {
  nodes: GraphNode[];
  edges: GraphEdge[];
  length: number;
}

export interface SearchResult {
  id: string;
  type: 'contact' | 'organization';
  name: string;
  title?: string;
  organization?: string;
  score: number;
  snippet?: string;
}

export interface DiscoveryResult {
  contacts: Array<{
    contact: { id: string; fullName: string; organization: string; title: string };
    score: number;
    reason: string;
    introPath?: string[];
  }>;
  gaps?: string[];
  suggestions?: string[];
}
