import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AdminUser, LoginForm } from '../types';
import { authApi } from '../api/admin';

interface AuthState {
  // 状态
  token: string | null;
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // 方法
  login: (form: LoginForm) => Promise<void>;
  logout: () => void;
  fetchProfile: () => Promise<void>;
  setToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,

      login: async (form: LoginForm) => {
        set({ isLoading: true });
        try {
          const { token, user } = await authApi.login(form);
          
          if (form.remember) {
            localStorage.setItem('admin_token', token);
          } else {
            sessionStorage.setItem('admin_token', token);
          }
          
          set({ token, user, isAuthenticated: true });
        } finally {
          set({ isLoading: false });
        }
      },

      logout: () => {
        authApi.logout().catch(() => {});
        localStorage.removeItem('admin_token');
        sessionStorage.removeItem('admin_token');
        set({ token: null, user: null, isAuthenticated: false });
      },

      fetchProfile: async () => {
        try {
          const user = await authApi.getProfile();
          set({ user });
        } catch {
          get().logout();
        }
      },

      setToken: (token: string) => {
        set({ token, isAuthenticated: true });
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({ token: state.token, user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
