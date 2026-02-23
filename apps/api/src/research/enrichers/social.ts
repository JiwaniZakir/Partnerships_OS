import { lookup } from 'node:dns/promises';
import { logger } from '../../utils/logger.js';
import { isPrivateHost } from '@fpos/shared';

interface SocialProfile {
  platform: string;
  url: string;
  bio: string;
  followers: number;
  recentPosts: string[];
}

/**
 * Validates that a URL does not resolve to a private/internal IP address.
 * This prevents SSRF via DNS rebinding attacks where a public hostname
 * resolves to a private IP.
 */
async function validateUrlNotPrivate(urlStr: string): Promise<boolean> {
  try {
    const parsed = new URL(urlStr);

    // Reject non-HTTP(S) protocols
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      logger.warn({ url: urlStr }, 'SSRF: rejected non-HTTP(S) protocol');
      return false;
    }

    // Check hostname directly against known private patterns
    if (isPrivateHost(parsed.hostname)) {
      logger.warn({ url: urlStr }, 'SSRF: rejected private hostname');
      return false;
    }

    // Resolve DNS and check the actual IP to prevent DNS rebinding
    try {
      const { address } = await lookup(parsed.hostname);
      if (isPrivateHost(address)) {
        logger.warn(
          { url: urlStr, resolvedIp: address },
          'SSRF: hostname resolved to private IP'
        );
        return false;
      }
    } catch {
      // DNS resolution failure — allow the fetch to fail naturally
    }

    return true;
  } catch {
    return false;
  }
}

const FETCH_TIMEOUT_MS = 10_000;

export async function enrichSocial(
  twitterUrl?: string | null,
  personalWebsite?: string | null
): Promise<SocialProfile[]> {
  const profiles: SocialProfile[] = [];

  if (twitterUrl) {
    try {
      if (!(await validateUrlNotPrivate(twitterUrl))) {
        logger.warn({ twitterUrl }, 'Skipping Twitter URL — SSRF check failed');
      } else {
        profiles.push({
          platform: 'twitter',
          url: twitterUrl,
          bio: '',
          followers: 0,
          recentPosts: [],
        });
      }
    } catch (err) {
      logger.warn({ err }, 'Twitter enrichment failed');
    }
  }

  if (personalWebsite) {
    try {
      if (!(await validateUrlNotPrivate(personalWebsite))) {
        logger.warn({ personalWebsite }, 'Skipping website URL — SSRF check failed');
      } else {
        const response = await fetch(personalWebsite, {
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
          redirect: 'manual',
        });
        if (response.ok) {
          const html = await response.text();
          const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
          const descMatch = html.match(
            /<meta[^>]*name=["']description["'][^>]*content=["'](.*?)["']/i
          );

          profiles.push({
            platform: 'website',
            url: personalWebsite,
            bio: descMatch?.[1] || titleMatch?.[1] || '',
            followers: 0,
            recentPosts: [],
          });
        }
      }
    } catch (err) {
      logger.warn({ err }, 'Website scrape failed');
    }
  }

  return profiles;
}
