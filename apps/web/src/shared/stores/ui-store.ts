import { create } from 'zustand';

interface UiState {
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  locale: 'en' | 'ru';
  setLocale: (l: 'en' | 'ru') => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  locale: (typeof document !== 'undefined'
    ? ((document.cookie.match(/locale=(\w+)/)?.[1] as 'en' | 'ru') ?? 'en')
    : 'en') as 'en' | 'ru',
  setLocale: (locale) => {
    document.cookie = `locale=${locale};path=/;max-age=31536000`;
    set({ locale });
    window.location.reload();
  },
}));
