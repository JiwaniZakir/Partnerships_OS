import { create } from 'zustand';

interface UIState {
  error: string | null;
  success: string | null;
  setError: (msg: string | null) => void;
  setSuccess: (msg: string | null) => void;
  clearAll: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  error: null,
  success: null,
  setError: (error) => set({ error, success: null }),
  setSuccess: (success) => set({ success, error: null }),
  clearAll: () => set({ error: null, success: null }),
}));
