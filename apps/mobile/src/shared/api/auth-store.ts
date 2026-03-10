import * as SecureStore from 'expo-secure-store';
import { create } from 'zustand';

import { apiClient } from './client';

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: 'patient' | 'therapist';
  emailVerified: boolean;
  avatar?: string | null;
}

interface AuthResponse {
  // API returns snake_case
  access_token: string;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role?: string) => Promise<void>;
  logout: () => Promise<void>;
  initialize: () => Promise<void>;
  setUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  initialized: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const res = await apiClient.post<AuthResponse>('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });
      await SecureStore.setItemAsync('accessToken', res.access_token);
      const user = await apiClient.get<User>('/auth/me');
      set({ user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  register: async (email: string, password: string, role = 'patient') => {
    set({ loading: true });
    try {
      const res = await apiClient.post<AuthResponse>('/auth/register', {
        email: email.trim().toLowerCase(),
        password,
        role,
      });
      await SecureStore.setItemAsync('accessToken', res.access_token);
      const user = await apiClient.get<User>('/auth/me');
      set({ user, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('accessToken');
    set({ user: null });
  },

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('accessToken');
      if (!token) {
        set({ initialized: true });
        return;
      }
      const user = await apiClient.get<User>('/auth/me');
      set({ user, initialized: true });
    } catch {
      await SecureStore.deleteItemAsync('accessToken');
      set({ user: null, initialized: true });
    }
  },

  setUser: (user: User) => set({ user }),
}));
