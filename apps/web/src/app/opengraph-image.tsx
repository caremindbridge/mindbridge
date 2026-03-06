import { ImageResponse } from 'next/og';

export const alt = 'MindBridge — AI Companion for Mental Health';
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
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 20,
            background: '#C4856F',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 48,
            marginBottom: 24,
          }}
        >
          🌿
        </div>

        <div
          style={{
            fontSize: 56,
            fontWeight: 700,
            color: '#2B2320',
            letterSpacing: '-0.02em',
          }}
        >
          MindBridge
        </div>

        <div
          style={{
            fontSize: 24,
            color: '#7A6F65',
            marginTop: 12,
          }}
        >
          Your AI companion between therapy sessions
        </div>

        <div
          style={{
            display: 'flex',
            gap: 32,
            marginTop: 40,
            fontSize: 16,
            color: '#C4856F',
          }}
        >
          <span>💬 AI CBT Therapy</span>
          <span>📊 Mood Tracking</span>
          <span>🤝 Therapist Bridge</span>
        </div>
      </div>
    ),
    { ...size },
  );
}
