import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'MindBridge — AI Companion for Mental Health',
    short_name: 'MindBridge',
    description: 'Your AI companion between therapy sessions',
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
