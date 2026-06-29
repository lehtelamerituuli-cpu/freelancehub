import { ImageResponse } from 'next/og'

export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180, height: 180,
          background: '#09090f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 40,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 66, height: 66, background: '#a78bfa', borderRadius: 16 }} />
            <div style={{ width: 66, height: 66, background: '#7c3aed', borderRadius: 16 }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 66, height: 66, background: '#6d28d9', borderRadius: 16 }} />
            <div style={{ width: 66, height: 66, background: '#4f46e5', borderRadius: 16 }} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
