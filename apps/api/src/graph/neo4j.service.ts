import { getNeo4j } from '../config/database.js';
import { logger } from '../utils/logger.js';
import type { GraphData, GraphNode, GraphEdge, PathResult } from '@fpos/shared';

export async function initNeo4jSchema(): Promise<void> {
  const driver = getNeo4j();
  const session = driver.session();

  try {
    // Constraints
    await session.run(
      'CREATE CONSTRAINT member_id IF NOT EXISTS FOR (m:Member) REQUIRE m.id IS UNIQUE'
    );
    await session.run(
      'CREATE CONSTRAINT contact_id IF NOT EXISTS FOR (c:Contact) REQUIRE c.id IS UNIQUE'
    );
    await session.run(
      'CREATE CONSTRAINT organization_id IF NOT EXISTS FOR (o:Organization) REQUIRE o.id IS UNIQUE'
    );
    await session.run(
      'CREATE CONSTRAINT tag_name IF NOT EXISTS FOR (t:Tag) REQUIRE t.name IS UNIQUE'
    );
    await session.run(
      'CREATE CONSTRAINT genre_name IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE'
    );

    // Indexes
    await session.run(
      'CREATE INDEX contact_name IF NOT EXISTS FOR (c:Contact) ON (c.name)'
    );
    await session.run(
      'CREATE INDEX org_name IF NOT EXISTS FOR (o:Organization) ON (o.name)'
    );

    // Full-text search index
    await session.run(`
      CREATE FULLTEXT INDEX contact_search IF NOT EXISTS
      FOR (c:Contact) ON EACH [c.name, c.title, c.organization]
    `);

    logger.info('Neo4j schema initialized');
  } finally {
    await session.close();
  }
}

export async function upsertMemberNode(member: {
  id: string;
  name: string;
  email: string;
  role: string;
}): Promise<void> {
  const driver = getNeo4j();
  const session = driver.session();
  try {
    await session.run(
      `MERGE (m:Member {id: $id})
       SET m.name = $name, m.email = $email, m.role = $role`,
      member
    );
  } finally {
    await session.close();
  }
}

export async function upsertContactNode(contact: {
  id: string;
  name: string;
  title: string;
  organization: string;
  contactType: string;
  warmthScore: number;
  researchSummary?: string | null;
}): Promise<void> {
  const driver = getNeo4j();
  const session = driver.session();
  try {
    await session.run(
      `MERGE (c:Contact {id: $id})
       SET c.name = $name,
           c.title = $title,
           c.organization = $organization,
           c.contactType = $contactType,
           c.warmthScore = $warmthScore,
           c.researchSummary = $researchSummary`,
      {
        ...contact,
        researchSummary: contact.researchSummary || null,
      }
    );
  } finally {
    await session.close();
  }
}

export async function upsertOrganizationNode(org: {
  id: string;
  name: string;
  type: string;
  industry?: string | null;
}): Promise<void> {
  const driver = getNeo4j();
  const session = driver.session();
  try {
    await session.run(
      `MERGE (o:Organization {id: $id})
       SET o.name = $name, o.type = $type, o.industry = $industry`,
      { ...org, industry: org.industry || null }
    );
  } finally {
    await session.close();
  }
}

export async function createOnboardedRelation(
  memberId: string,
  contactId: string,
  context?: string
): Promise<void> {
  const driver = getNeo4j();
  const session = driver.session();
  try {
    await session.run(
      `MATCH (m:Member {id: $memberId})
       MATCH (c:Contact {id: $contactId})
       MERGE (m)-[r:ONBOARDED]->(c)
       SET r.date = datetime(), r.context = $context`,
      { memberId, contactId, context: context || null }
    );
  } finally {
    await session.close();
  }
}

export async function createWorksAtRelation(
  contactId: string,
  orgId: string,
  title?: string
): Promise<void> {
  const driver = getNeo4j();
  const session = driver.session();
  try {
    await session.run(
      `MATCH (c:Contact {id: $contactId})
       MATCH (o:Organization {id: $orgId})
       MERGE (c)-[r:WORKS_AT]->(o)
       SET r.title = $title`,
      { contactId, orgId, title: title || null }
    );
  } finally {
    await session.close();
  }
}

export async function createKnowsRelation(
  contactId1: string,
  contactId2: string,
  context?: string,
  strength?: number
): Promise<void> {
  const driver = getNeo4j();
  const session = driver.session();
  try {
    await session.run(
      `MATCH (c1:Contact {id: $id1})
       MATCH (c2:Contact {id: $id2})
       MERGE (c1)-[r:KNOWS]->(c2)
       SET r.context = $context, r.strength = $strength`,
      {
        id1: contactId1,
        id2: contactId2,
        context: context || null,
        strength: strength ?? 0.5,
      }
    );
  } finally {
    await session.close();
  }
}

export async function createTagRelations(
  contactId: string,
  tags: string[]
): Promise<void> {
  if (tags.length === 0) return;
  const driver = getNeo4j();
  const session = driver.session();
  try {
    await session.run(
      `MATCH (c:Contact {id: $contactId})
       UNWIND $tags AS tagName
       MERGE (t:Tag {name: tagName})
       MERGE (c)-[:TAGGED_AS]->(t)`,
      { contactId, tags }
    );
  } finally {
    await session.close();
  }
}

export async function createGenreRelations(
  contactId: string,
  genres: string[]
): Promise<void> {
  if (genres.length === 0) return;
  const driver = getNeo4j();
  const session = driver.session();
  try {
    await session.run(
      `MATCH (c:Contact {id: $contactId})
       UNWIND $genres AS genreName
       MERGE (g:Genre {name: genreName})
       MERGE (c)-[:IN_GENRE]->(g)`,
      { contactId, genres }
    );
  } finally {
    await session.close();
  }
}

export async function getContactNeighborhood(
  contactId: string,
  depth: number = 2
): Promise<GraphData> {
  const driver = getNeo4j();
  const session = driver.session();

  // Use a lookup table to prevent Cypher injection via depth parameter.
  // Only allow known safe depth values (1-5), defaulting to 2.
  const depthQueryMap: Record<number, string> = {
    1: 'MATCH path = (c:Contact {id: $contactId})-[*1..1]-(connected) RETURN path LIMIT 100',
    2: 'MATCH path = (c:Contact {id: $contactId})-[*1..2]-(connected) RETURN path LIMIT 100',
    3: 'MATCH path = (c:Contact {id: $contactId})-[*1..3]-(connected) RETURN path LIMIT 100',
    4: 'MATCH path = (c:Contact {id: $contactId})-[*1..4]-(connected) RETURN path LIMIT 100',
    5: 'MATCH path = (c:Contact {id: $contactId})-[*1..5]-(connected) RETURN path LIMIT 100',
  };

  const safeDepth = Math.max(1, Math.min(5, Math.floor(depth)));
  const query = depthQueryMap[safeDepth] ?? depthQueryMap[2]!;

  try {
    const result = await session.run(query, { contactId });
    return extractGraphData(result.records);
  } finally {
    await session.close();
  }
}

export async function getFullGraph(): Promise<GraphData> {
  const driver = getNeo4j();
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH (n)
       OPTIONAL MATCH (n)-[r]->(m)
       RETURN n, r, m
       LIMIT 1000`
    );

    const nodes = new Map<string, GraphNode>();
    const edges: GraphEdge[] = [];

    for (const record of result.records) {
      const n = record.get('n');
      if (n) {
        const nodeId = n.properties.id as string;
        if (!nodes.has(nodeId)) {
          nodes.set(nodeId, {
            id: nodeId,
            label: n.properties.name as string,
            type: getNodeType(n.labels),
            properties: { ...n.properties },
          });
        }
      }

      const m = record.get('m');
      if (m) {
        const nodeId = m.properties.id as string;
        if (!nodes.has(nodeId)) {
          nodes.set(nodeId, {
            id: nodeId,
            label: m.properties.name as string,
            type: getNodeType(m.labels),
            properties: { ...m.properties },
          });
        }
      }

      const r = record.get('r');
      if (r && n && m) {
        edges.push({
          id: `${n.properties.id}-${r.type}-${m.properties.id}`,
          source: n.properties.id as string,
          target: m.properties.id as string,
          type: r.type,
          properties: { ...r.properties },
        });
      }
    }

    return { nodes: Array.from(nodes.values()), edges };
  } finally {
    await session.close();
  }
}

export async function findShortestPath(
  fromId: string,
  toId: string
): Promise<PathResult | null> {
  const driver = getNeo4j();
  const session = driver.session();
  try {
    const result = await session.run(
      `MATCH path = shortestPath(
         (a {id: $fromId})-[*..6]-(b {id: $toId})
       )
       RETURN path`,
      { fromId, toId }
    );

    if (result.records.length === 0) return null;

    const record = result.records[0]!;
    const path = record.get('path');
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    for (const segment of path.segments) {
      const startNode = segment.start;
      const endNode = segment.end;
      const rel = segment.relationship;

      nodes.push({
        id: startNode.properties.id as string,
        label: startNode.properties.name as string,
        type: getNodeType(startNode.labels),
        properties: { ...startNode.properties },
      });

      nodes.push({
        id: endNode.properties.id as string,
        label: endNode.properties.name as string,
        type: getNodeType(endNode.labels),
        properties: { ...endNode.properties },
      });

      edges.push({
        id: `${startNode.properties.id}-${rel.type}-${endNode.properties.id}`,
        source: startNode.properties.id as string,
        target: endNode.properties.id as string,
        type: rel.type,
        properties: { ...rel.properties },
      });
    }

    // Deduplicate nodes
    const uniqueNodes = Array.from(
      new Map(nodes.map((n) => [n.id, n])).values()
    );

    return { nodes: uniqueNodes, edges, length: path.segments.length };
  } finally {
    await session.close();
  }
}

export async function searchNodes(query: string): Promise<GraphNode[]> {
  const driver = getNeo4j();
  const session = driver.session();
  try {
    const result = await session.run(
      `CALL db.index.fulltext.queryNodes("contact_search", $query)
       YIELD node, score
       RETURN node, score
       ORDER BY score DESC
       LIMIT 20`,
      { query: `${query}~` }
    );

    return result.records.map((record) => {
      const node = record.get('node');
      return {
        id: node.properties.id as string,
        label: node.properties.name as string,
        type: getNodeType(node.labels),
        properties: { ...node.properties, searchScore: record.get('score') },
      };
    });
  } finally {
    await session.close();
  }
}

function getNodeType(labels: string[]): 'member' | 'contact' | 'organization' {
  if (labels.includes('Member')) return 'member';
  if (labels.includes('Organization')) return 'organization';
  return 'contact';
}

function extractGraphData(records: any[]): GraphData {
  const nodes = new Map<string, GraphNode>();
  const edges: GraphEdge[] = [];

  for (const record of records) {
    const path = record.get('path');
    for (const segment of path.segments) {
      const start = segment.start;
      const end = segment.end;
      const rel = segment.relationship;

      if (!nodes.has(start.properties.id)) {
        nodes.set(start.properties.id, {
          id: start.properties.id,
          label: start.properties.name || '',
          type: getNodeType(start.labels),
          properties: { ...start.properties },
        });
      }

      if (!nodes.has(end.properties.id)) {
        nodes.set(end.properties.id, {
          id: end.properties.id,
          label: end.properties.name || '',
          type: getNodeType(end.labels),
          properties: { ...end.properties },
        });
      }

      const edgeId = `${start.properties.id}-${rel.type}-${end.properties.id}`;
      edges.push({
        id: edgeId,
        source: start.properties.id,
        target: end.properties.id,
        type: rel.type,
        properties: { ...rel.properties },
      });
    }
  }

  return { nodes: Array.from(nodes.values()), edges };
}
