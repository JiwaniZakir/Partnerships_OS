export function buildContactPageBlocks(contact: any): any[] {
  const blocks: any[] = [];

  // Header divider
  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // Quick Info heading
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ text: { content: '📋 Quick Info' } }],
    },
  });

  // Quick Info table
  const infoRows = [
    ['Email', contact.email || 'N/A'],
    ['Phone', contact.phone || 'N/A'],
    ['LinkedIn', contact.linkedinUrl || 'N/A'],
    ['Twitter', contact.twitterUrl || 'N/A'],
    ['Website', contact.personalWebsite || 'N/A'],
    ['Onboarded By', contact.onboardedBy?.name || 'N/A'],
    ['First Contact', contact.createdAt ? new Date(contact.createdAt).toLocaleDateString() : 'N/A'],
    ['Warmth Score', warmthStars(contact.warmthScore)],
  ];

  for (const [label, value] of infoRows) {
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          { text: { content: `${label}: ` }, annotations: { bold: true } },
          { text: { content: value } },
        ],
      },
    });
  }

  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // AI Research Profile
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ text: { content: '🔬 AI Research Profile' } }],
    },
  });

  if (contact.researchSummary) {
    // Split into paragraphs to stay under Notion's 2000-char limit per block
    const paragraphs = splitText(contact.researchSummary, 1900);
    for (const para of paragraphs) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ text: { content: para } }],
        },
      });
    }
  } else {
    blocks.push({
      object: 'block',
      type: 'callout',
      callout: {
        icon: { emoji: '⏳' },
        color: 'yellow_background',
        rich_text: [
          {
            text: {
              content: 'Research pending — profile will be updated once the research pipeline completes.',
            },
          },
        ],
      },
    });
  }

  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // Why They Matter
  if (contact.potentialValue) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '🤝 Why They Matter to the Organization' } }],
      },
    });

    const valueParagraphs = splitText(contact.potentialValue, 1900);
    for (const para of valueParagraphs) {
      blocks.push({
        object: 'block',
        type: 'paragraph',
        paragraph: {
          rich_text: [{ text: { content: para } }],
        },
      });
    }

    blocks.push({ object: 'block', type: 'divider', divider: {} });
  }

  // Key Achievements
  if (contact.keyAchievements?.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '🏆 Key Achievements' } }],
      },
    });

    for (const achievement of contact.keyAchievements) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ text: { content: achievement.slice(0, 1900) } }],
        },
      });
    }

    blocks.push({ object: 'block', type: 'divider', divider: {} });
  }

  // Interaction History
  blocks.push({
    object: 'block',
    type: 'heading_2',
    heading_2: {
      rich_text: [{ text: { content: '📅 Interaction History' } }],
    },
  });

  if (contact.interactions?.length > 0) {
    for (const interaction of contact.interactions) {
      blocks.push({
        object: 'block',
        type: 'toggle',
        toggle: {
          rich_text: [
            {
              text: {
                content: `${new Date(interaction.date).toLocaleDateString()} — ${interaction.type} with ${interaction.member?.name || 'Unknown'}`,
              },
              annotations: { bold: true },
            },
          ],
          children: [
            {
              object: 'block',
              type: 'paragraph',
              paragraph: {
                rich_text: [
                  { text: { content: interaction.summary?.slice(0, 1900) || 'No summary' } },
                ],
              },
            },
            ...(interaction.keyTakeaways?.length > 0
              ? [
                  {
                    object: 'block',
                    type: 'callout',
                    callout: {
                      icon: { emoji: '💡' },
                      color: 'blue_background',
                      rich_text: [
                        {
                          text: {
                            content: `Key Takeaways: ${interaction.keyTakeaways.join('; ')}`.slice(0, 1900),
                          },
                        },
                      ],
                    },
                  },
                ]
              : []),
            ...(interaction.followUpItems?.length > 0
              ? [
                  {
                    object: 'block',
                    type: 'callout',
                    callout: {
                      icon: { emoji: '📌' },
                      color: 'orange_background',
                      rich_text: [
                        {
                          text: {
                            content: `Follow-ups: ${interaction.followUpItems.join('; ')}`.slice(0, 1900),
                          },
                        },
                      ],
                    },
                  },
                ]
              : []),
          ],
        },
      });
    }
  } else {
    blocks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            text: { content: 'No interactions logged yet.' },
            annotations: { italic: true, color: 'gray' },
          },
        ],
      },
    });
  }

  blocks.push({ object: 'block', type: 'divider', divider: {} });

  // Suggested Introductions
  if (contact.suggestedIntroductions?.length > 0) {
    blocks.push({
      object: 'block',
      type: 'heading_2',
      heading_2: {
        rich_text: [{ text: { content: '💡 Suggested Introductions' } }],
      },
    });

    for (const suggestion of contact.suggestedIntroductions) {
      blocks.push({
        object: 'block',
        type: 'bulleted_list_item',
        bulleted_list_item: {
          rich_text: [{ text: { content: suggestion.slice(0, 1900) } }],
        },
      });
    }
  }

  return blocks;
}

function warmthStars(score: number): string {
  const stars = Math.round((score || 0) * 5);
  return '★'.repeat(stars) + '☆'.repeat(5 - stars);
}

function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const parts: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      parts.push(remaining);
      break;
    }
    let splitAt = remaining.lastIndexOf('\n', maxLen);
    if (splitAt === -1 || splitAt < maxLen / 2) {
      splitAt = remaining.lastIndexOf('. ', maxLen);
    }
    if (splitAt === -1 || splitAt < maxLen / 2) {
      splitAt = maxLen;
    }
    parts.push(remaining.slice(0, splitAt + 1));
    remaining = remaining.slice(splitAt + 1);
  }
  return parts;
}
