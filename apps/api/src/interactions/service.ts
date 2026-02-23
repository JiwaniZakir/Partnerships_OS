import { getPrisma } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';
import type { Prisma } from '@prisma/client';

export interface InteractionListOptions {
  page: number;
  limit: number;
  contactId?: string;
  memberId?: string;
  type?: string;
  startDate?: string;
  endDate?: string;
}

export async function listInteractions(options: InteractionListOptions) {
  const prisma = getPrisma();
  const { page, limit, contactId, memberId, type, startDate, endDate } = options;

  const where: Prisma.InteractionWhereInput = {};
  if (contactId) where.contactId = contactId;
  if (memberId) where.memberId = memberId;
  if (type) where.type = type as any;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }

  const [interactions, total] = await Promise.all([
    prisma.interaction.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { date: 'desc' },
      include: {
        contact: { select: { id: true, fullName: true, organization: true } },
        member: { select: { id: true, name: true } },
      },
    }),
    prisma.interaction.count({ where }),
  ]);

  return {
    interactions,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getInteraction(id: string) {
  const prisma = getPrisma();
  const interaction = await prisma.interaction.findUnique({
    where: { id },
    include: {
      contact: {
        select: {
          id: true,
          fullName: true,
          organization: true,
          title: true,
          contactType: true,
        },
      },
      member: { select: { id: true, name: true, email: true } },
    },
  });

  if (!interaction) throw new NotFoundError('Interaction', id);
  return interaction;
}

export async function createInteraction(
  data: {
    contactId: string;
    type: string;
    date?: string;
    summary: string;
    rawTranscript?: string;
    keyTakeaways?: string[];
    followUpItems?: string[];
    sentiment?: string;
  },
  memberId: string
) {
  const prisma = getPrisma();

  // Verify contact exists
  const contact = await prisma.contact.findUnique({
    where: { id: data.contactId },
  });
  if (!contact) throw new NotFoundError('Contact', data.contactId);

  const interaction = await prisma.interaction.create({
    data: {
      contactId: data.contactId,
      memberId,
      type: (data.type as any) || 'OTHER',
      date: data.date ? new Date(data.date) : new Date(),
      summary: data.summary,
      rawTranscript: data.rawTranscript,
      keyTakeaways: data.keyTakeaways || [],
      followUpItems: data.followUpItems || [],
      sentiment: (data.sentiment as any) || 'NEUTRAL',
    },
    include: {
      contact: { select: { id: true, fullName: true, organization: true } },
      member: { select: { id: true, name: true } },
    },
  });

  // Update contact warmth score (slight boost per interaction)
  const newWarmth = Math.min(1, contact.warmthScore + 0.05);
  await prisma.contact.update({
    where: { id: data.contactId },
    data: { warmthScore: newWarmth },
  });

  return interaction;
}
