import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const size = Math.min(512, Math.max(16, Number(request.nextUrl.searchParams.get('size') || 192)))
  const maskable = Boolean(request.nextUrl.searchParams.get('maskable'))

  const pad = maskable ? Math.round(size * 0.1) : Math.round(size * 0.12)
  const inner = size - pad * 2
  const gap = Math.max(2, Math.round(inner * 0.055))
  const sq = Math.round((inner - gap) / 2)
  const r = Math.max(2, Math.round(sq * 0.28))

  return new ImageResponse(
    (
      <div
        style={{
          width: size,
          height: size,
          background: maskable ? '#09090f' : 'linear-gradient(145deg,#111120,#09090f)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: maskable ? 0 : Math.round(size * 0.22),
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap }}>
          <div style={{ display: 'flex', gap }}>
            <div style={{ width: sq, height: sq, background: '#a78bfa', borderRadius: r }} />
            <div style={{ width: sq, height: sq, background: '#7c3aed', borderRadius: r }} />
          </div>
          <div style={{ display: 'flex', gap }}>
            <div style={{ width: sq, height: sq, background: '#6d28d9', borderRadius: r }} />
            <div style={{ width: sq, height: sq, background: '#4f46e5', borderRadius: r, opacity: 0.75 }} />
          </div>
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
