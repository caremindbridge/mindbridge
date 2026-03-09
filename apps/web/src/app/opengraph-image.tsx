import { ImageResponse } from 'next/og';

import { siteConfig } from '@/shared/lib/site-config';

export const runtime = 'edge';

const isRu = siteConfig.forcedLocale === 'ru';

export const alt = isRu ? 'Тревога не ждёт следующей сессии. Мира — тоже.' : "Anxiety doesn't wait for your next session. Neither does Mira.";
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          background: '#FAF9F7',
          display: 'flex',
          flexDirection: 'column',
          padding: '56px 88px',
          position: 'relative',
        }}
      >
        {/* Decorative orb top-right */}
        <div
          style={{
            position: 'absolute',
            top: -120,
            right: -120,
            width: 480,
            height: 480,
            borderRadius: '50%',
            background: 'rgba(196, 133, 111, 0.08)',
            display: 'flex',
          }}
        />
        {/* Decorative orb bottom-left */}
        <div
          style={{
            position: 'absolute',
            bottom: -60,
            left: -60,
            width: 280,
            height: 280,
            borderRadius: '50%',
            background: 'rgba(196, 133, 111, 0.08)',
            display: 'flex',
          }}
        />

        {/* Logo row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 36 }}>🌿</span>
          <span
            style={{
              color: '#2B2320',
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: '0.01em',
            }}
          >
            MindBridge
          </span>
        </div>

        {/* Headline block */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 0,
          }}
        >
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#2B2320',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
          >
            {isRu ? 'Тревога не ждёт' : "Anxiety doesn't wait"}
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#2B2320',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
              marginBottom: 16,
            }}
          >
            {isRu ? 'следующей сессии.' : 'for your next session.'}
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#C4856F',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
          >
            {isRu ? 'Мира — тоже.' : 'Neither does Mira.'}
          </div>
        </div>

        {/* Bottom row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ color: 'rgba(43,35,32,0.45)', fontSize: 20 }}>
            {isRu ? 'Поговори с Мирой когда тяжело. 7 дней бесплатно, без карты.' : "Talk to Mira when it's hard. Free 7-day trial, no card."}
          </span>
          <span
            style={{
              color: 'rgba(43,35,32,0.25)',
              fontSize: 18,
              letterSpacing: '0.02em',
            }}
          >
            {siteConfig.siteUrl.replace('https://', '')}
          </span>
        </div>
      </div>
    ),
    { ...size },
  );
}
