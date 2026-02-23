export interface Member {
  id: string;
  email: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  googleId: string;
  joinedAt: Date;
  isAdmin: boolean;
  isActive: boolean;
  totalContactsOnboarded?: number;
  notionPageId: string | null;
}

export interface MemberStats {
  contactCount: number;
  interactionCount: number;
  topGenres: string[];
  recentActivity: Date | null;
}
