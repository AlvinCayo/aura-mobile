import { create } from 'zustand';

interface AuthState {
  isAuthenticated: boolean;
  user: any | null;
  hasSeenOnboarding: boolean;
  setLogin: (user: any) => void;
  setLogout: () => void;
  completeOnboarding: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  user: null,
  hasSeenOnboarding: false, // Cambiar a true para saltar onboarding en pruebas
  setLogin: (user) => set({ isAuthenticated: true, user }),
  setLogout: () => set({ isAuthenticated: false, user: null }),
  completeOnboarding: () => set({ hasSeenOnboarding: true }),
}));