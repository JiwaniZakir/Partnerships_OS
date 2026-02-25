import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';
import neo4j from 'neo4j-driver';
import OpenAI from 'openai';

const prisma = new PrismaClient();

async function seed() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.interaction.deleteMany();
  await prisma.contactOrganization.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.contact.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.member.deleteMany();

  // Create members
  const members = await Promise.all([
    prisma.member.create({
      data: { id: randomUUID(), email: 'zakir@foundryphl.com', name: 'Zakir Jiwani', role: 'President', googleId: 'google_zakir', isAdmin: true },
    }),
    prisma.member.create({
      data: { id: randomUUID(), email: 'admin@foundryphl.com', name: 'Sarah Chen', role: 'VP Partnerships', googleId: 'google_sarah', isAdmin: true },
    }),
    prisma.member.create({
      data: { id: randomUUID(), email: 'michael@foundryphl.com', name: 'Michael Roberts', role: 'Director of Events', googleId: 'google_michael', isAdmin: false },
    }),
    prisma.member.create({
      data: { id: randomUUID(), email: 'priya@foundryphl.com', name: 'Priya Patel', role: 'VP Sponsorships', googleId: 'google_priya', isAdmin: false },
    }),
    prisma.member.create({
      data: { id: randomUUID(), email: 'james@foundryphl.com', name: 'James Wilson', role: 'Director of Outreach', googleId: 'google_james', isAdmin: false },
    }),
  ]);

  console.log(`Created ${members.length} members`);

  const contactData = [
    // Investors (15)
    { fullName: 'David Kim', title: 'Managing Partner', organization: 'Sequoia Capital', contactType: 'INVESTOR' as const, seniority: 'PARTNER' as const, genres: ['fintech', 'AI/ML'], warmthScore: 0.9 },
    { fullName: 'Lisa Zhang', title: 'Partner', organization: 'Andreessen Horowitz', contactType: 'INVESTOR' as const, seniority: 'PARTNER' as const, genres: ['web3', 'AI/ML'], warmthScore: 0.8 },
    { fullName: 'Robert Chen', title: 'General Partner', organization: 'Accel Partners', contactType: 'INVESTOR' as const, seniority: 'PARTNER' as const, genres: ['SaaS', 'enterprise'], warmthScore: 0.7 },
    { fullName: 'Amanda Foster', title: 'Principal', organization: 'Bessemer Venture Partners', contactType: 'INVESTOR' as const, seniority: 'VP' as const, genres: ['healthcare', 'biotech'], warmthScore: 0.6 },
    { fullName: 'Marcus Johnson', title: 'Angel Investor', organization: 'Johnson Capital', contactType: 'INVESTOR' as const, seniority: 'FOUNDER' as const, genres: ['fintech', 'proptech'], warmthScore: 0.85 },
    { fullName: 'Sarah Mitchell', title: 'Partner', organization: 'First Round Capital', contactType: 'INVESTOR' as const, seniority: 'PARTNER' as const, genres: ['consumer', 'marketplace'], warmthScore: 0.75 },
    { fullName: 'Kevin Park', title: 'Managing Director', organization: 'Goldman Sachs Growth', contactType: 'INVESTOR' as const, seniority: 'C_SUITE' as const, genres: ['fintech', 'infrastructure'], warmthScore: 0.65 },
    { fullName: 'Emily Thompson', title: 'Venture Partner', organization: 'NEA', contactType: 'INVESTOR' as const, seniority: 'PARTNER' as const, genres: ['healthcare', 'AI/ML'], warmthScore: 0.5 },
    { fullName: 'Alex Rivera', title: 'Founding Partner', organization: 'Harlem Capital', contactType: 'INVESTOR' as const, seniority: 'FOUNDER' as const, genres: ['diversity', 'consumer'], warmthScore: 0.9 },
    { fullName: 'Jennifer Wu', title: 'GP', organization: 'Lightspeed Ventures', contactType: 'INVESTOR' as const, seniority: 'PARTNER' as const, genres: ['enterprise', 'cybersecurity'], warmthScore: 0.55 },
    { fullName: 'Daniel Brown', title: 'Partner', organization: 'Union Square Ventures', contactType: 'INVESTOR' as const, seniority: 'PARTNER' as const, genres: ['web3', 'climate'], warmthScore: 0.7 },
    { fullName: 'Rachel Green', title: 'Associate', organization: 'Benchmark', contactType: 'INVESTOR' as const, seniority: 'IC' as const, genres: ['consumer', 'social'], warmthScore: 0.4 },
    { fullName: 'Chris Taylor', title: 'Angel Investor', organization: 'Independent', contactType: 'INVESTOR' as const, seniority: 'FOUNDER' as const, genres: ['edtech', 'AI/ML'], warmthScore: 0.8 },
    { fullName: 'Natalie Wang', title: 'VP Investments', organization: 'SoftBank Vision', contactType: 'INVESTOR' as const, seniority: 'VP' as const, genres: ['AI/ML', 'robotics'], warmthScore: 0.45 },
    { fullName: 'Tom Harris', title: 'Seed Investor', organization: 'Y Combinator', contactType: 'INVESTOR' as const, seniority: 'PARTNER' as const, genres: ['B2B', 'developer tools'], warmthScore: 0.7 },

    // Corporate Partners (10)
    { fullName: 'Michelle Adams', title: 'Head of Partnerships', organization: 'Google', contactType: 'CORPORATE_PARTNER' as const, seniority: 'DIRECTOR' as const, genres: ['AI/ML', 'cloud'], warmthScore: 0.85 },
    { fullName: 'Brian Lee', title: 'Director of Innovation', organization: 'JPMorgan Chase', contactType: 'CORPORATE_PARTNER' as const, seniority: 'DIRECTOR' as const, genres: ['fintech'], warmthScore: 0.7 },
    { fullName: 'Jessica Nguyen', title: 'VP University Relations', organization: 'Microsoft', contactType: 'CORPORATE_PARTNER' as const, seniority: 'VP' as const, genres: ['AI/ML', 'cloud', 'developer tools'], warmthScore: 0.8 },
    { fullName: 'Ryan Cooper', title: 'Head of Startup Programs', organization: 'AWS', contactType: 'CORPORATE_PARTNER' as const, seniority: 'DIRECTOR' as const, genres: ['cloud', 'infrastructure'], warmthScore: 0.75 },
    { fullName: 'Lauren Miller', title: 'Campus Recruiting Lead', organization: 'Goldman Sachs', contactType: 'CORPORATE_PARTNER' as const, seniority: 'MANAGER' as const, genres: ['fintech', 'trading'], warmthScore: 0.6 },
    { fullName: 'Andrew Park', title: 'Director of Ventures', organization: 'Comcast NBCUniversal', contactType: 'CORPORATE_PARTNER' as const, seniority: 'DIRECTOR' as const, genres: ['media', 'entertainment'], warmthScore: 0.9 },
    { fullName: 'Diana Cruz', title: 'Head of DEI Partnerships', organization: 'Meta', contactType: 'CORPORATE_PARTNER' as const, seniority: 'DIRECTOR' as const, genres: ['social', 'VR/AR'], warmthScore: 0.5 },
    { fullName: 'Steven Chang', title: 'Startup Program Manager', organization: 'Stripe', contactType: 'CORPORATE_PARTNER' as const, seniority: 'MANAGER' as const, genres: ['fintech', 'payments'], warmthScore: 0.65 },
    { fullName: 'Maria Rodriguez', title: 'VP Strategic Partnerships', organization: 'Salesforce', contactType: 'CORPORATE_PARTNER' as const, seniority: 'VP' as const, genres: ['SaaS', 'CRM'], warmthScore: 0.55 },
    { fullName: 'Patrick O'\''Brien', title: 'Innovation Lab Director', organization: 'Vanguard', contactType: 'CORPORATE_PARTNER' as const, seniority: 'DIRECTOR' as const, genres: ['fintech', 'wealth management'], warmthScore: 0.7 },

    // Speakers (8)
    { fullName: 'Dr. Maya Patel', title: 'Professor of Entrepreneurship', organization: 'Wharton School', contactType: 'SPEAKER' as const, seniority: 'OTHER' as const, genres: ['entrepreneurship', 'education'], warmthScore: 0.85 },
    { fullName: 'Jason Scott', title: 'CEO', organization: 'TechCrunch', contactType: 'SPEAKER' as const, seniority: 'C_SUITE' as const, genres: ['media', 'startups'], warmthScore: 0.6 },
    { fullName: 'Aisha Williams', title: 'Founder & CEO', organization: 'NovaTech AI', contactType: 'SPEAKER' as const, seniority: 'FOUNDER' as const, genres: ['AI/ML', 'diversity'], warmthScore: 0.9 },
    { fullName: 'Carlos Mendez', title: 'CTO', organization: 'Rappi', contactType: 'SPEAKER' as const, seniority: 'C_SUITE' as const, genres: ['marketplace', 'latam'], warmthScore: 0.5 },
    { fullName: 'Hannah Kim', title: 'Author & Speaker', organization: 'Independent', contactType: 'SPEAKER' as const, seniority: 'OTHER' as const, genres: ['leadership', 'diversity'], warmthScore: 0.75 },
    { fullName: 'Derek Foster', title: 'Head of Product', organization: 'Figma', contactType: 'SPEAKER' as const, seniority: 'VP' as const, genres: ['design', 'product'], warmthScore: 0.65 },
    { fullName: 'Nina Sharma', title: 'VP Engineering', organization: 'Coinbase', contactType: 'SPEAKER' as const, seniority: 'VP' as const, genres: ['web3', 'engineering'], warmthScore: 0.7 },
    { fullName: 'Jordan Blake', title: 'Founder', organization: 'ClimateAI', contactType: 'SPEAKER' as const, seniority: 'FOUNDER' as const, genres: ['climate', 'AI/ML'], warmthScore: 0.8 },

    // Mentors (8)
    { fullName: 'Victoria Lane', title: 'Serial Entrepreneur', organization: 'Independent', contactType: 'MENTOR' as const, seniority: 'FOUNDER' as const, genres: ['entrepreneurship', 'SaaS'], warmthScore: 0.95 },
    { fullName: 'William Foster', title: 'Former CTO', organization: 'Slack', contactType: 'MENTOR' as const, seniority: 'C_SUITE' as const, genres: ['engineering', 'product'], warmthScore: 0.85 },
    { fullName: 'Grace Lee', title: 'Startup Advisor', organization: 'Techstars', contactType: 'MENTOR' as const, seniority: 'PARTNER' as const, genres: ['accelerators', 'B2B'], warmthScore: 0.9 },
    { fullName: 'Samuel Jackson', title: 'Executive Coach', organization: 'Independent', contactType: 'MENTOR' as const, seniority: 'OTHER' as const, genres: ['leadership', 'growth'], warmthScore: 0.8 },
    { fullName: 'Olivia Brown', title: 'VP Product', organization: 'Shopify', contactType: 'MENTOR' as const, seniority: 'VP' as const, genres: ['e-commerce', 'product'], warmthScore: 0.7 },
    { fullName: 'Nathan White', title: 'Founder & Angel', organization: 'WhiteSpace Ventures', contactType: 'MENTOR' as const, seniority: 'FOUNDER' as const, genres: ['fintech', 'seed investing'], warmthScore: 0.75 },
    { fullName: 'Isabella Martinez', title: 'Director of Strategy', organization: 'McKinsey', contactType: 'MENTOR' as const, seniority: 'DIRECTOR' as const, genres: ['strategy', 'consulting'], warmthScore: 0.6 },
    { fullName: 'Ethan Clark', title: 'Former VP Sales', organization: 'HubSpot', contactType: 'MENTOR' as const, seniority: 'VP' as const, genres: ['sales', 'GTM'], warmthScore: 0.65 },

    // Alumni & Other (9)
    { fullName: 'Sophie Anderson', title: 'Founder', organization: 'EduFlow', contactType: 'ALUMNI' as const, seniority: 'FOUNDER' as const, genres: ['edtech', 'AI/ML'], warmthScore: 0.85 },
    { fullName: 'Tyler Brooks', title: 'Co-founder', organization: 'FinStack', contactType: 'ALUMNI' as const, seniority: 'FOUNDER' as const, genres: ['fintech'], warmthScore: 0.8 },
    { fullName: 'Megan Davis', title: 'CEO', organization: 'GreenBuild', contactType: 'ALUMNI' as const, seniority: 'C_SUITE' as const, genres: ['climate', 'proptech'], warmthScore: 0.9 },
    { fullName: 'Luke Harris', title: 'CTO', organization: 'HealthPulse', contactType: 'ALUMNI' as const, seniority: 'C_SUITE' as const, genres: ['healthcare', 'AI/ML'], warmthScore: 0.75 },
    { fullName: 'Emma Wilson', title: 'Reporter', organization: 'Philadelphia Inquirer', contactType: 'MEDIA' as const, seniority: 'IC' as const, genres: ['media', 'local'], warmthScore: 0.6 },
    { fullName: 'Jack Thompson', title: 'Senior Reporter', organization: 'Forbes', contactType: 'MEDIA' as const, seniority: 'IC' as const, genres: ['media', 'startups'], warmthScore: 0.5 },
    { fullName: 'Carmen Vasquez', title: 'Director of Economic Dev', organization: 'City of Philadelphia', contactType: 'GOVERNMENT' as const, seniority: 'DIRECTOR' as const, genres: ['government', 'economic development'], warmthScore: 0.7 },
    { fullName: 'Roger Evans', title: 'Commissioner', organization: 'PA Dept of Commerce', contactType: 'GOVERNMENT' as const, seniority: 'C_SUITE' as const, genres: ['government', 'policy'], warmthScore: 0.55 },
    { fullName: 'Tanya Brooks', title: 'Program Director', organization: 'Kauffman Foundation', contactType: 'SPONSOR' as const, seniority: 'DIRECTOR' as const, genres: ['entrepreneurship', 'grants'], warmthScore: 0.8 },
  ];

  const contacts = [];
  for (let i = 0; i < contactData.length; i++) {
    const d = contactData[i];
    const member = members[i % members.length];
    const contact = await prisma.contact.create({
      data: {
        fullName: d.fullName,
        title: d.title,
        organization: d.organization,
        contactType: d.contactType,
        seniority: d.seniority,
        genres: d.genres,
        warmthScore: d.warmthScore,
        onboardedById: member.id,
        organizationType: d.organization.includes('Capital') || d.organization.includes('Ventures') ? 'VC_FIRM' : d.contactType === 'GOVERNMENT' ? 'GOVERNMENT' : 'COMPANY',
        industry: d.genres[0] || null,
        researchSummary: `${d.fullName} serves as ${d.title} at ${d.organization}. They are well-connected in the ${d.genres.join(' and ')} space and represent a valuable connection for The Foundry's network. Their expertise and position make them an ideal ${d.contactType.toLowerCase().replace('_', ' ')} for our community of East Coast college founders.`,
        researchDepthScore: 0.3,
        keyAchievements: [`${d.title} at ${d.organization}`, `Active in ${d.genres.join(', ')}`],
        potentialValue: `As a ${d.contactType.toLowerCase().replace('_', ' ')}, ${d.fullName} can help The Foundry by providing access to ${d.organization}'s network and resources in the ${d.genres.join('/')} space.`,
      },
    });
    contacts.push(contact);
  }

  console.log(`Created ${contacts.length} contacts`);

  // Create interactions (2-4 per contact)
  const interactionTypes = ['MEETING', 'CALL', 'EMAIL', 'EVENT', 'COFFEE_CHAT'] as const;
  const sentiments = ['VERY_POSITIVE', 'POSITIVE', 'NEUTRAL'] as const;
  let interactionCount = 0;

  for (const contact of contacts) {
    const numInteractions = 2 + Math.floor(Math.random() * 3);
    for (let j = 0; j < numInteractions; j++) {
      const member = members[Math.floor(Math.random() * members.length)];
      const daysAgo = Math.floor(Math.random() * 180);
      const type = interactionTypes[Math.floor(Math.random() * interactionTypes.length)];

      await prisma.interaction.create({
        data: {
          contactId: contact.id,
          memberId: member.id,
          type,
          date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000),
          summary: `${type.charAt(0) + type.slice(1).toLowerCase()} with ${contact.fullName} from ${contact.organization}. Discussed potential collaboration and partnership opportunities with The Foundry.`,
          keyTakeaways: ['Interested in partnering with Foundry', 'Follow up next month'],
          followUpItems: ['Send partnership deck', 'Schedule follow-up call'],
          sentiment: sentiments[Math.floor(Math.random() * sentiments.length)],
        },
      });
      interactionCount++;
    }
  }

  console.log(`Created ${interactionCount} interactions`);

  // ─── Phase 2: Neo4j Graph Seeding ───
  console.log('\n--- Phase 2: Neo4j Graph Seeding ---');

  const neo4jUri = process.env.NEO4J_URI || 'bolt://localhost:7687';
  const neo4jUser = process.env.NEO4J_USER || 'neo4j';
  const neo4jPassword = process.env.NEO4J_PASSWORD || 'password';

  let neo4jDriver: ReturnType<typeof neo4j.driver> | null = null;
  try {
    neo4jDriver = neo4j.driver(neo4jUri, neo4j.auth.basic(neo4jUser, neo4jPassword));
    await neo4jDriver.verifyConnectivity();
    console.log('Connected to Neo4j');

    const session = neo4jDriver.session();
    try {
      // Clear existing graph data
      await session.run('MATCH (n) DETACH DELETE n');
      console.log('Cleared existing Neo4j data');

      // Upsert Member nodes
      for (const member of members) {
        await session.run(
          `MERGE (m:Member {id: $id})
           SET m.name = $name, m.email = $email, m.role = $role`,
          { id: member.id, name: member.name, email: member.email, role: member.role }
        );
      }
      console.log(`Created ${members.length} Member nodes`);

      // Upsert Contact nodes + ONBOARDED relationships
      for (const contact of contacts) {
        await session.run(
          `MERGE (c:Contact {id: $id})
           SET c.name = $name, c.title = $title, c.organization = $organization,
               c.contactType = $contactType, c.warmthScore = $warmthScore`,
          {
            id: contact.id,
            name: contact.fullName,
            title: contact.title,
            organization: contact.organization,
            contactType: contact.contactType,
            warmthScore: contact.warmthScore,
          }
        );

        // Create ONBOARDED relationship
        await session.run(
          `MATCH (m:Member {id: $memberId})
           MATCH (c:Contact {id: $contactId})
           MERGE (m)-[r:ONBOARDED]->(c)
           SET r.date = datetime()`,
          { memberId: contact.onboardedById, contactId: contact.id }
        );
      }
      console.log(`Created ${contacts.length} Contact nodes with ONBOARDED relationships`);

      // Create KNOWS relationships (some contacts know each other)
      const knowsPairs: Array<[number, number, string]> = [
        [0, 1, 'Met at VC conference'],      // David Kim <-> Lisa Zhang
        [0, 5, 'Co-investors'],               // David Kim <-> Sarah Mitchell
        [2, 9, 'Former colleagues'],           // Robert Chen <-> Jennifer Wu
        [4, 10, 'Angel investor network'],     // Marcus Johnson <-> Daniel Brown
        [15, 16, 'Tech industry connections'], // Michelle Adams <-> Brian Lee
        [17, 19, 'Microsoft/AWS partnership'], // Jessica Nguyen <-> Ryan Cooper
        [25, 26, 'Speaker circuit'],           // Dr. Maya Patel <-> Jason Scott
        [27, 32, 'AI community'],              // Aisha Williams <-> Jordan Blake
        [33, 34, 'Entrepreneur network'],      // Victoria Lane <-> William Foster
        [35, 40, 'Startup ecosystem'],         // Grace Lee <-> Nathan White
        [43, 44, 'Alumni founders'],           // Sophie Anderson <-> Tyler Brooks
        [45, 46, 'Alumni founders'],           // Megan Davis <-> Luke Harris
        [20, 21, 'Goldman Sachs colleagues'],  // Lauren Miller <-> Kevin Park (via GS)
        [3, 7, 'Healthcare VC network'],       // Amanda Foster <-> Emily Thompson
        [22, 23, 'Corporate innovation'],      // Andrew Park <-> Diana Cruz
      ];

      let knowsCount = 0;
      for (const [idx1, idx2, context] of knowsPairs) {
        if (contacts[idx1] && contacts[idx2]) {
          await session.run(
            `MATCH (c1:Contact {id: $id1})
             MATCH (c2:Contact {id: $id2})
             MERGE (c1)-[r:KNOWS]->(c2)
             SET r.context = $context, r.strength = $strength`,
            {
              id1: contacts[idx1].id,
              id2: contacts[idx2].id,
              context,
              strength: 0.5 + Math.random() * 0.5,
            }
          );
          knowsCount++;
        }
      }
      console.log(`Created ${knowsCount} KNOWS relationships`);

      // Create Genre nodes and IN_GENRE relationships
      const allGenres = new Set<string>();
      for (const contact of contacts) {
        for (const genre of contact.genres) {
          allGenres.add(genre);
        }
      }

      for (const genre of allGenres) {
        await session.run(
          `MERGE (g:Genre {name: $name})`,
          { name: genre }
        );
      }
      console.log(`Created ${allGenres.size} Genre nodes`);

      for (const contact of contacts) {
        if (contact.genres.length > 0) {
          await session.run(
            `MATCH (c:Contact {id: $contactId})
             UNWIND $genres AS genreName
             MERGE (g:Genre {name: genreName})
             MERGE (c)-[:IN_GENRE]->(g)`,
            { contactId: contact.id, genres: contact.genres }
          );
        }
      }
      console.log('Created IN_GENRE relationships for all contacts');
    } finally {
      await session.close();
    }

    console.log('Neo4j graph seeding complete!');
  } catch (err) {
    console.warn('Neo4j seeding skipped or failed:', (err as Error).message);
    console.warn('Ensure NEO4J_URI, NEO4J_USER, NEO4J_PASSWORD are set and Neo4j is running.');
  } finally {
    if (neo4jDriver) {
      await neo4jDriver.close();
    }
  }

  // ─── Phase 3: Embedding Generation ───
  console.log('\n--- Phase 3: Embedding Generation ---');

  const openaiApiKey = process.env.OPENAI_API_KEY;
  if (!openaiApiKey) {
    console.warn('OPENAI_API_KEY not set — skipping embedding generation.');
    console.warn('Run seed again with OPENAI_API_KEY set to generate embeddings.');
  } else {
    const openai = new OpenAI({ apiKey: openaiApiKey, timeout: 30_000 });
    let embeddingCount = 0;
    let embeddingErrors = 0;

    for (const contact of contacts) {
      const text = [
        contact.researchSummary || '',
        ...(contact.keyAchievements || []),
      ].filter(Boolean).join('\n');

      if (!text.trim()) continue;

      try {
        const response = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: text,
          dimensions: 1536,
        });

        const embedding = response.data[0]?.embedding;
        if (embedding) {
          const vectorStr = `[${embedding.join(',')}]`;
          await prisma.$executeRawUnsafe(
            `UPDATE contacts SET profile_embedding = $1::vector WHERE id = $2::uuid`,
            vectorStr,
            contact.id
          );
          embeddingCount++;
        }

        // Small delay to respect OpenAI rate limits
        if (embeddingCount % 10 === 0) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (err) {
        embeddingErrors++;
        console.warn(`Failed to generate embedding for ${contact.fullName}: ${(err as Error).message}`);
      }
    }

    console.log(`Generated ${embeddingCount} embeddings (${embeddingErrors} errors)`);
  }

  console.log('\nSeed complete!');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
