import { readFileSync } from 'fs';
import { resolve } from 'path';

interface ApprovedMember {
  email: string;
  isAdmin: boolean;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let approvedMembers: ApprovedMember[] | null = null;
let lastLoadedAt: number = 0;
let refreshInProgress = false;

function getFilePath(): string {
  // process.cwd() = /app in Docker, monorepo root in development — both have config/ here
  return resolve(process.cwd(), 'config/approved-members.md');
}

function parseApprovedMembers(content: string): ApprovedMember[] {
  const members: ApprovedMember[] = [];
  let isAdmin = false;

  for (const line of content.split('\n')) {
    if (line.includes('## Admins')) {
      isAdmin = true;
      continue;
    }
    if (line.includes('## Members')) {
      isAdmin = false;
      continue;
    }
    const match = line.match(/^-\s+(\S+@\S+)/);
    if (match) {
      members.push({ email: match[1]!, isAdmin });
    }
  }

  return members;
}

function loadApprovedMembers(): ApprovedMember[] {
  // First load: synchronous, blocking
  if (!approvedMembers) {
    const content = readFileSync(getFilePath(), 'utf-8');
    approvedMembers = parseApprovedMembers(content);
    lastLoadedAt = Date.now();
    return approvedMembers;
  }

  // If cache is stale, trigger a background refresh
  if (Date.now() - lastLoadedAt > CACHE_TTL_MS && !refreshInProgress) {
    refreshInProgress = true;
    // Background refresh — does not block the current call
    Promise.resolve().then(() => {
      try {
        const content = readFileSync(getFilePath(), 'utf-8');
        approvedMembers = parseApprovedMembers(content);
        lastLoadedAt = Date.now();
      } catch {
        // If refresh fails, keep serving the stale cache
      } finally {
        refreshInProgress = false;
      }
    });
  }

  return approvedMembers;
}

export function isApprovedMember(email: string): boolean {
  const members = loadApprovedMembers();
  return members.some((m) => m.email.toLowerCase() === email.toLowerCase());
}

export function isAdminMember(email: string): boolean {
  const members = loadApprovedMembers();
  return members.some(
    (m) => m.email.toLowerCase() === email.toLowerCase() && m.isAdmin
  );
}

export function getApprovedMembers(): ApprovedMember[] {
  return loadApprovedMembers();
}
