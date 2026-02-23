export function contactTypeEmoji(type: string): string {
  const emojiMap: Record<string, string> = {
    SPONSOR: '💰',
    MENTOR: '🧭',
    SPEAKER: '🎤',
    INVESTOR: '📈',
    CORPORATE_PARTNER: '🏢',
    MEDIA: '📰',
    GOVERNMENT: '🏛️',
    ALUMNI: '🎓',
    OTHER: '👤',
  };
  return emojiMap[type] || '👤';
}

export function warmthToStars(score: number): string {
  const stars = Math.round(score * 5);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

export function contactToProperties(contact: any): Record<string, any> {
  return {
    Name: {
      title: [
        {
          text: {
            content: `${contactTypeEmoji(contact.contactType)} ${contact.fullName}`,
          },
        },
      ],
    },
    Organization: {
      rich_text: [{ text: { content: contact.organization || '' } }],
    },
    Title: {
      rich_text: [{ text: { content: contact.title || '' } }],
    },
    Type: {
      select: { name: contact.contactType || 'OTHER' },
    },
    'Organization Type': {
      select: { name: contact.organizationType || 'COMPANY' },
    },
    Industry: {
      rich_text: [{ text: { content: contact.industry || '' } }],
    },
    'Warmth Score': {
      rich_text: [
        { text: { content: warmthToStars(contact.warmthScore || 0) } },
      ],
    },
    Status: {
      select: { name: contact.status || 'ACTIVE' },
    },
    Email: {
      email: contact.email || null,
    },
    Phone: {
      phone_number: contact.phone || null,
    },
    LinkedIn: {
      url: contact.linkedinUrl || null,
    },
    'Created Date': {
      date: contact.createdAt
        ? { start: new Date(contact.createdAt).toISOString().split('T')[0] }
        : null,
    },
    'Research Status': {
      select: {
        name: contact.researchSummary ? 'Complete' : 'Pending',
      },
    },
  };
}

export function interactionToProperties(interaction: any): Record<string, any> {
  return {
    Summary: {
      title: [
        {
          text: {
            content: interaction.summary?.slice(0, 100) || 'Interaction',
          },
        },
      ],
    },
    Type: {
      select: { name: interaction.type || 'OTHER' },
    },
    Date: {
      date: { start: new Date(interaction.date).toISOString().split('T')[0] },
    },
    Sentiment: {
      select: { name: interaction.sentiment || 'NEUTRAL' },
    },
    Contact: {
      rich_text: [
        {
          text: {
            content: interaction.contact?.fullName || '',
          },
        },
      ],
    },
    Member: {
      rich_text: [
        {
          text: {
            content: interaction.member?.name || '',
          },
        },
      ],
    },
  };
}
