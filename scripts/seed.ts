import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

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
  console.log('Seed complete!');
}

seed()
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
