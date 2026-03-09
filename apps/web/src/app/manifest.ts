import type { MetadataRoute } from 'next';

import { siteConfig } from '@/shared/lib/site-config';

export default function manifest(): MetadataRoute.Manifest {
  const isRu = siteConfig.forcedLocale === 'ru';

  return {
    name: isRu ? 'MindBridge — AI-компаньон для психического здоровья' : 'MindBridge — AI Companion for Mental Health',
    short_name: 'MindBridge',
    description: isRu ? 'AI-компаньон между сессиями терапии' : 'Your AI companion between therapy sessions',
    lang: isRu ? 'ru' : 'en',
    start_url: '/dashboard',
    id: '/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#FAF9F7',
    theme_color: '#C4856F',
    icons: [
      { src: '/icon-192', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
