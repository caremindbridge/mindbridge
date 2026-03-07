import { ImageResponse } from 'next/og';

export const alt = 'MindBridge — Anxiety doesn\'t wait. Neither does Mira.';
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
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          padding: '0 80px',
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: '#C4856F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 40,
            marginBottom: 28,
          }}
        >
          🌿
        </div>

        {/* Brand */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: '#7A6F65',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 20,
          }}
        >
          MindBridge
        </div>

        {/* Headline */}
        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#2B2320',
            letterSpacing: '-0.02em',
            textAlign: 'center',
            lineHeight: 1.2,
            maxWidth: 800,
          }}
        >
          Anxiety doesn't wait for your next session.
        </div>

        <div
          style={{
            fontSize: 52,
            fontWeight: 700,
            color: '#C4856F',
            letterSpacing: '-0.02em',
            textAlign: 'center',
            lineHeight: 1.2,
            marginTop: 8,
          }}
        >
          Neither does Mira.
        </div>

        {/* Subline */}
        <div
          style={{
            fontSize: 22,
            color: '#7A6F65',
            marginTop: 28,
            textAlign: 'center',
            maxWidth: 680,
            lineHeight: 1.5,
          }}
        >
          Talk to Mira when it's hard. Free 7-day trial, no card needed.
        </div>

        {/* Bridge tags */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 40,
          }}
        >
          {['💬 You', '→', '🌿 Mira', '→', '🧑‍⚕️ Therapist'].map((item, i) => (
            <div
              key={i}
              style={{
                fontSize: item === '→' ? 20 : 16,
                color: item === '→' ? '#C4856F' : '#2B2320',
                background: item === '→' ? 'transparent' : i === 2 ? '#F5E8E4' : '#F0EDEB',
                padding: item === '→' ? '0 4px' : '8px 18px',
                borderRadius: 24,
                fontWeight: item === '→' ? 400 : 500,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              {item}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
