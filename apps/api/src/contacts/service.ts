import { getPrisma } from '../config/database.js';
import { NotFoundError, ForbiddenError, ValidationError } from '../utils/errors.js';
import { encrypt, decrypt, isEncrypted } from '../utils/encryption.js';
import type { Prisma } from '@prisma/client';

const PII_FIELDS = ['email', 'phone', 'linkedinUrl', 'twitterUrl', 'personalWebsite'] as const;

function encryptPiiFields<T extends Record<string, any>>(data: T): T {
  const result = { ...data };
  for (const field of PII_FIELDS) {
    if (field in result && result[field] != null && typeof result[field] === 'string') {
      result[field] = encrypt(result[field]);
    }
  }
  return result;
}

function decryptPiiFields<T extends Record<string, any>>(record: T): T {
  const result = { ...record };
  for (const field of PII_FIELDS) {
    if (field in result && result[field] != null && typeof result[field] === 'string' && isEncrypted(result[field])) {
      try {
        result[field] = decrypt(result[field]);
      } catch {
        // If decryption fails, leave the value as-is (may be plaintext from before encryption was enabled)
      }
    }
  }
  return result;
}

export interface RequestingMember {
  sub: string;
  isAdmin: boolean;
}

export interface ContactListOptions {
  page: number;
  limit: number;
  search?: string;
  contactType?: string;
  organizationType?: string;
  genre?: string;
  onboardedById?: string;
  status?: string;
  minWarmth?: number;
}

export async function listContacts(options: ContactListOptions) {
  const prisma = getPrisma();
  const { page, limit, search, contactType, organizationType, genre, onboardedById, status, minWarmth } = options;

  const where: Prisma.ContactWhereInput = {};

  if (search) {
    where.OR = [
      { fullName: { contains: search, mode: 'insensitive' } },
      { organization: { contains: search, mode: 'insensitive' } },
      { title: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (contactType) where.contactType = contactType as any;
  if (organizationType) where.organizationType = organizationType as any;
  if (genre) where.genres = { has: genre };
  if (onboardedById) where.onboardedById = onboardedById;
  if (status) where.status = status as any;
  if (minWarmth !== undefined) where.warmthScore = { gte: minWarmth };

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        onboardedBy: { select: { id: true, name: true, email: true } },
        _count: { select: { interactions: true } },
      },
    }),
    prisma.contact.count({ where }),
  ]);

  return {
    contacts: contacts.map(decryptPiiFields),
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

export async function getContact(id: string) {
  const prisma = getPrisma();
  const contact = await prisma.contact.findUnique({
    where: { id },
    include: {
      onboardedBy: { select: { id: true, name: true, email: true, role: true } },
      interactions: {
        orderBy: { date: 'desc' },
        take: 20,
        include: {
          member: { select: { id: true, name: true } },
        },
      },
      contactOrganizations: {
        include: { organization: true },
      },
    },
  });

  if (!contact) throw new NotFoundError();
  return decryptPiiFields(contact);
}

export async function createContact(
  data: {
    fullName: string;
    organization: string;
    email?: string;
    phone?: string;
    title?: string;
    organizationType?: string;
    industry?: string;
    seniority?: string;
    contactType?: string;
    tags?: string[];
    genres?: string[];
    linkedinUrl?: string;
    twitterUrl?: string;
    personalWebsite?: string;
    warmthScore?: number;
  },
  onboardedById: string
) {
  const prisma = getPrisma();

  // Duplicate detection: check for existing contact with same name + organization
  const existing = await prisma.contact.findFirst({
    where: {
      fullName: { equals: data.fullName, mode: 'insensitive' },
      organization: { equals: data.organization, mode: 'insensitive' },
    },
    select: { id: true, fullName: true, organization: true, status: true },
  });

  if (existing) {
    throw new ValidationError(
      `A contact named "${existing.fullName}" at "${existing.organization}" already exists (id: ${existing.id}, status: ${existing.status}).`,
      { existingContactId: existing.id }
    );
  }

  // Encrypt PII fields before storing
  const encryptedData = encryptPiiFields({
    email: data.email,
    phone: data.phone,
    linkedinUrl: data.linkedinUrl,
    twitterUrl: data.twitterUrl,
    personalWebsite: data.personalWebsite,
  });

  const contact = await prisma.contact.create({
    data: {
      fullName: data.fullName,
      organization: data.organization,
      email: encryptedData.email,
      phone: encryptedData.phone,
      title: data.title || '',
      organizationType: (data.organizationType as any) || 'COMPANY',
      industry: data.industry,
      seniority: (data.seniority as any) || 'OTHER',
      contactType: (data.contactType as any) || 'OTHER',
      tags: data.tags || [],
      genres: data.genres || [],
      linkedinUrl: encryptedData.linkedinUrl,
      twitterUrl: encryptedData.twitterUrl,
      personalWebsite: encryptedData.personalWebsite,
      warmthScore: data.warmthScore ?? 0.5,
      onboardedById,
    },
    include: {
      onboardedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return decryptPiiFields(contact);
}

export async function updateContact(
  id: string,
  data: Partial<{
    fullName: string;
    email: string;
    phone: string;
    photoUrl: string;
    title: string;
    organization: string;
    organizationType: string;
    industry: string;
    seniority: string;
    contactType: string;
    tags: string[];
    genres: string[];
    linkedinUrl: string;
    twitterUrl: string;
    personalWebsite: string;
    crunchbaseUrl: string;
    githubUrl: string;
    otherUrls: string[];
    status: string;
    warmthScore: number;
  }>,
  requestingMember: RequestingMember
) {
  const prisma = getPrisma();

  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError();

  // Ownership check: only the onboarding member or an admin can update
  if (existing.onboardedById !== requestingMember.sub && !requestingMember.isAdmin) {
    throw new ForbiddenError('You can only update contacts you onboarded');
  }

  // Encrypt PII fields before updating
  const encryptedPii = encryptPiiFields(data);

  // Explicit field mapping instead of `data as any`
  const updateData: Prisma.ContactUpdateInput = {};
  if (data.fullName !== undefined) updateData.fullName = data.fullName;
  if (data.email !== undefined) updateData.email = encryptedPii.email;
  if (data.phone !== undefined) updateData.phone = encryptedPii.phone;
  if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl;
  if (data.title !== undefined) updateData.title = data.title;
  if (data.organization !== undefined) updateData.organization = data.organization;
  if (data.organizationType !== undefined) updateData.organizationType = data.organizationType as any;
  if (data.industry !== undefined) updateData.industry = data.industry;
  if (data.seniority !== undefined) updateData.seniority = data.seniority as any;
  if (data.contactType !== undefined) updateData.contactType = data.contactType as any;
  if (data.tags !== undefined) updateData.tags = data.tags;
  if (data.genres !== undefined) updateData.genres = data.genres;
  if (data.linkedinUrl !== undefined) updateData.linkedinUrl = encryptedPii.linkedinUrl;
  if (data.twitterUrl !== undefined) updateData.twitterUrl = encryptedPii.twitterUrl;
  if (data.personalWebsite !== undefined) updateData.personalWebsite = encryptedPii.personalWebsite;
  if (data.crunchbaseUrl !== undefined) updateData.crunchbaseUrl = data.crunchbaseUrl;
  if (data.githubUrl !== undefined) updateData.githubUrl = data.githubUrl;
  if (data.otherUrls !== undefined) updateData.otherUrls = data.otherUrls;
  if (data.status !== undefined) updateData.status = data.status as any;
  if (data.warmthScore !== undefined) updateData.warmthScore = data.warmthScore;

  const contact = await prisma.contact.update({
    where: { id },
    data: updateData,
    include: {
      onboardedBy: { select: { id: true, name: true, email: true } },
    },
  });

  return decryptPiiFields(contact);
}

export async function archiveContact(id: string, requestingMember: RequestingMember) {
  const prisma = getPrisma();
  const existing = await prisma.contact.findUnique({ where: { id } });
  if (!existing) throw new NotFoundError();

  // Ownership check: only the onboarding member or an admin can archive
  if (existing.onboardedById !== requestingMember.sub && !requestingMember.isAdmin) {
    throw new ForbiddenError('You can only archive contacts you onboarded');
  }

  return prisma.contact.update({
    where: { id },
    data: { status: 'ARCHIVED' },
  });
}

export async function getContactStats() {
  const prisma = getPrisma();

  const [total, byType, byStatus, recentCount] = await Promise.all([
    prisma.contact.count(),
    prisma.contact.groupBy({
      by: ['contactType'],
      _count: true,
    }),
    prisma.contact.groupBy({
      by: ['status'],
      _count: true,
    }),
    prisma.contact.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
  ]);

  return { total, byType, byStatus, addedThisMonth: recentCount };
}
