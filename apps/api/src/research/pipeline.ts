import { getPrisma } from '../config/database.js';
import { searchPerson } from './enrichers/web-search.js';
import { enrichLinkedIn } from './enrichers/linkedin.js';
import { enrichSocial } from './enrichers/social.js';
import { getRecentNews } from './enrichers/news.js';
import { synthesizeResearch } from './synthesizer.js';
import { updateContactEmbedding } from './embeddings.js';
import * as neo4jService from '../graph/neo4j.service.js';
import { logger } from '../utils/logger.js';

export async function runResearchPipeline(contactId: string): Promise<void> {
  const prisma = getPrisma();

  const contact = await prisma.contact.findUnique({
    where: { id: contactId },
  });

  if (!contact) {
    logger.warn({ contactId }, 'Contact not found for research');
    return;
  }

  logger.info(
    { contactId, name: contact.fullName },
    'Starting research pipeline'
  );

  // Step 1: Run all enrichers in parallel (error-isolated)
  const [webResults, linkedinProfile, socialProfiles, newsArticles] =
    await Promise.allSettled([
      searchPerson(contact.fullName, contact.organization),
      enrichLinkedIn(contact.linkedinUrl, contact.email),
      enrichSocial(contact.twitterUrl, contact.personalWebsite),
      getRecentNews(contact.fullName, contact.organization),
    ]);

  const enricherData = {
    webResults:
      webResults.status === 'fulfilled' ? webResults.value : [],
    linkedinProfile:
      linkedinProfile.status === 'fulfilled'
        ? linkedinProfile.value
        : null,
    socialProfiles:
      socialProfiles.status === 'fulfilled' ? socialProfiles.value : [],
    newsArticles:
      newsArticles.status === 'fulfilled' ? newsArticles.value : [],
  };

  // Compute research depth score
  let depthScore = 0.1; // base score for having the contact
  if (enricherData.webResults.length > 0) depthScore += 0.2;
  if (enricherData.linkedinProfile) depthScore += 0.3;
  if (enricherData.socialProfiles.length > 0) depthScore += 0.1;
  if (enricherData.newsArticles.length > 0) depthScore += 0.1;

  // Step 2: AI Synthesis
  let synthesis;
  try {
    synthesis = await synthesizeResearch({
      name: contact.fullName,
      title: contact.title,
      organization: contact.organization,
      ...enricherData,
    });
    if (synthesis.researchSummary) depthScore += 0.2;
  } catch (err) {
    logger.error({ err, contactId }, 'AI synthesis failed');
    synthesis = {
      researchSummary: null,
      keyAchievements: [],
      mutualInterestsWithFoundry: [],
      potentialValue: null,
      suggestedIntroductions: [],
    };
  }

  // Step 3: Update PostgreSQL
  await prisma.contact.update({
    where: { id: contactId },
    data: {
      researchSummary: synthesis.researchSummary,
      researchRaw: enricherData as any,
      researchLastUpdated: new Date(),
      researchDepthScore: Math.min(1, depthScore),
      keyAchievements: synthesis.keyAchievements,
      mutualInterestsWithFoundry: synthesis.mutualInterestsWithFoundry,
      potentialValue: synthesis.potentialValue,
      suggestedIntroductions: synthesis.suggestedIntroductions,
    },
  });

  // Step 4: Update embeddings
  if (synthesis.researchSummary) {
    try {
      await updateContactEmbedding(
        contactId,
        synthesis.researchSummary,
        synthesis.keyAchievements,
      );
    } catch (err) {
      logger.error({ err, contactId }, 'Embedding update failed');
    }
  }

  // Step 5: Update Neo4j
  try {
    await neo4jService.upsertContactNode({
      id: contact.id,
      name: contact.fullName,
      title: contact.title,
      organization: contact.organization,
      contactType: contact.contactType,
      warmthScore: contact.warmthScore,
      researchSummary: synthesis.researchSummary,
    });

    if (contact.tags.length > 0) {
      await neo4jService.createTagRelations(contactId, contact.tags);
    }
    if (contact.genres.length > 0) {
      await neo4jService.createGenreRelations(contactId, contact.genres);
    }
  } catch (err) {
    logger.error({ err, contactId }, 'Neo4j update failed');
  }

  logger.info(
    { contactId, depthScore },
    'Research pipeline completed'
  );
}
