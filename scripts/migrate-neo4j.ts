import neo4j from 'neo4j-driver';

const NEO4J_URI = process.env.NEO4J_URI || 'bolt://localhost:7687';
const NEO4J_USER = process.env.NEO4J_USER || 'neo4j';
const NEO4J_PASSWORD = process.env.NEO4J_PASSWORD || 'fpos_dev_password';

async function migrate() {
  const driver = neo4j.driver(NEO4J_URI, neo4j.auth.basic(NEO4J_USER, NEO4J_PASSWORD));
  const session = driver.session();

  console.log('Initializing Neo4j schema...');

  const commands = [
    'CREATE CONSTRAINT member_id IF NOT EXISTS FOR (m:Member) REQUIRE m.id IS UNIQUE',
    'CREATE CONSTRAINT contact_id IF NOT EXISTS FOR (c:Contact) REQUIRE c.id IS UNIQUE',
    'CREATE CONSTRAINT organization_id IF NOT EXISTS FOR (o:Organization) REQUIRE o.id IS UNIQUE',
    'CREATE CONSTRAINT tag_name IF NOT EXISTS FOR (t:Tag) REQUIRE t.name IS UNIQUE',
    'CREATE CONSTRAINT genre_name IF NOT EXISTS FOR (g:Genre) REQUIRE g.name IS UNIQUE',
    'CREATE CONSTRAINT event_id IF NOT EXISTS FOR (e:Event) REQUIRE e.id IS UNIQUE',
    'CREATE INDEX contact_name IF NOT EXISTS FOR (c:Contact) ON (c.name)',
    'CREATE INDEX contact_org IF NOT EXISTS FOR (c:Contact) ON (c.organization)',
    'CREATE INDEX org_name IF NOT EXISTS FOR (o:Organization) ON (o.name)',
    'CREATE FULLTEXT INDEX contact_search IF NOT EXISTS FOR (c:Contact) ON EACH [c.name, c.title, c.organization]',
  ];

  for (const cmd of commands) {
    try {
      await session.run(cmd);
      console.log(`  OK: ${cmd.slice(0, 60)}...`);
    } catch (err: any) {
      if (err.message?.includes('already exists')) {
        console.log(`  SKIP: ${cmd.slice(0, 60)}... (already exists)`);
      } else {
        console.error(`  FAIL: ${cmd.slice(0, 60)}...`, err.message);
      }
    }
  }

  await session.close();
  await driver.close();
  console.log('Neo4j schema migration complete.');
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
