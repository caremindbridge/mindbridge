import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 512,
          height: 512,
          borderRadius: 100,
          background: '#C4856F',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 300,
        }}
      >
        🌿
      </div>
    ),
    { width: 512, height: 512 },
  );
}
