import { getPrisma } from '../config/database.js';
import { NotFoundError } from '../utils/errors.js';

export async function listMembers() {
  const prisma = getPrisma();

  const members = await prisma.member.findMany({
    where: { isActive: true },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      isAdmin: true,
      joinedAt: true,
      _count: {
        select: {
          contactsOnboarded: true,
          interactions: true,
        },
      },
    },
  });

  return members.map((m) => ({
    ...m,
    contactCount: m._count.contactsOnboarded,
    interactionCount: m._count.interactions,
    _count: undefined,
  }));
}

export async function getMember(id: string) {
  const prisma = getPrisma();

  const member = await prisma.member.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      avatarUrl: true,
      isAdmin: true,
      joinedAt: true,
      _count: {
        select: {
          contactsOnboarded: true,
          interactions: true,
        },
      },
    },
  });

  if (!member) throw new NotFoundError('Member', id);

  return {
    ...member,
    contactCount: member._count.contactsOnboarded,
    interactionCount: member._count.interactions,
    _count: undefined,
  };
}

export async function getMemberContacts(
  memberId: string,
  page: number,
  limit: number
) {
  const prisma = getPrisma();

  const member = await prisma.member.findUnique({ where: { id: memberId } });
  if (!member) throw new NotFoundError('Member', memberId);

  const [contacts, total] = await Promise.all([
    prisma.contact.findMany({
      where: { onboardedById: memberId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { interactions: true } },
      },
    }),
    prisma.contact.count({ where: { onboardedById: memberId } }),
  ]);

  return {
    contacts,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getLeaderboard() {
  const prisma = getPrisma();

  const members = await prisma.member.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      role: true,
      avatarUrl: true,
      _count: {
        select: { contactsOnboarded: true },
      },
    },
    orderBy: {
      contactsOnboarded: { _count: 'desc' },
    },
    take: 10,
  });

  return members.map((m, i) => ({
    rank: i + 1,
    id: m.id,
    name: m.name,
    role: m.role,
    avatarUrl: m.avatarUrl,
    contactCount: m._count.contactsOnboarded,
  }));
}
