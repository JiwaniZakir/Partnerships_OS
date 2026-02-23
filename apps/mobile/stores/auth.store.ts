import { create } from 'zustand';

interface Member {
  id: string;
  email: string;
  name: string;
  role: string;
  isAdmin: boolean;
  avatarUrl: string | null;
}

interface AuthState {
  member: Member | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (member: Member, accessToken: string, refreshToken: string) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (loading: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  member: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setAuth: (member, accessToken, refreshToken) =>
    set({
      member,
      accessToken,
      refreshToken,
      isAuthenticated: true,
      isLoading: false,
    }),

  setTokens: (accessToken, refreshToken) =>
    set({ accessToken, refreshToken }),

  setLoading: (isLoading) => set({ isLoading }),

  logout: () =>
    set({
      member: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    }),
}));
