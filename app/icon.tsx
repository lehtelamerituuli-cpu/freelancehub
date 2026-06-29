import { ImageResponse } from 'next/og'

export const size = { width: 32, height: 32 }
export const contentType = 'image/png'

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32, height: 32,
          background: '#09090f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 7,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', gap: 2 }}>
            <div style={{ width: 11, height: 11, background: '#a78bfa', borderRadius: 3 }} />
            <div style={{ width: 11, height: 11, background: '#7c3aed', borderRadius: 3 }} />
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            <div style={{ width: 11, height: 11, background: '#6d28d9', borderRadius: 3 }} />
            <div style={{ width: 11, height: 11, background: '#4f46e5', borderRadius: 3 }} />
          </div>
        </div>
      </div>
    ),
    { ...size }
  )
}
