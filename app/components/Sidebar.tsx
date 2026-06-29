'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'
import { useState, useEffect } from 'react'

const IconGrid = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
    <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
  </svg>
)
const IconFolder = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
)
const IconClock = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IconMapPin = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IconFileText = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
    <polyline points="14 2 14 8 20 8"/>
    <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
  </svg>
)
const IconReceipt = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1z"/>
    <line x1="9" y1="9" x2="15" y2="9"/><line x1="9" y1="13" x2="15" y2="13"/>
  </svg>
)
const IconSparkle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" opacity="0.9"/>
  </svg>
)
const IconCamera = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)
const IconPieChart = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
    <path d="M22 12A10 10 0 0 0 12 2v10z"/>
  </svg>
)
const IconMenu = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
  </svg>
)
const IconX = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
)
const IconSettings = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3"/>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
  </svg>
)
const IconLogout = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
)
const LogoMark = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
    <rect x="1" y="1" width="9" height="9" rx="2.5" fill="#a78bfa"/>
    <rect x="12" y="1" width="9" height="9" rx="2.5" fill="#7c3aed"/>
    <rect x="1" y="12" width="9" height="9" rx="2.5" fill="#6d28d9"/>
    <rect x="12" y="12" width="9" height="9" rx="2.5" fill="#4f46e5" opacity="0.55"/>
  </svg>
)

const NAV = [
  { href: '/dashboard',    label: 'Kojelauta',        Icon: IconGrid },
  { href: '/projects',     label: 'Projektit',         Icon: IconFolder },
  { href: '/time',         label: 'Työajan seuranta',  Icon: IconClock },
  { href: '/travel',       label: 'Matkat',            Icon: IconMapPin },
  { href: '/expenses',     label: 'Kulut',             Icon: IconReceipt },
  { href: '/laskutus',     label: 'Laskutus',          Icon: IconFileText },
  { href: '/receipts',     label: 'Kuitit',            Icon: IconCamera },
  { href: '/tax',          label: 'Verotus',           Icon: IconPieChart },
  { href: '/assistentti',  label: 'AI-apuri',          Icon: IconSparkle },
]

const DARK_VARS: Record<string, string> = {
  '--bg': '#09090f',
  '--surface': '#111120',
  '--surface-raised': '#16162a',
  '--border': '#1c1c30',
  '--border-subtle': '#0f0f1c',
  '--text': '#eeeeff',
  '--text-soft': '#ddddf0',
  '--text-heading': '#c0c0e0',
  '--muted': '#5e5e80',
  '--muted-strong': '#42425e',
  '--faint': '#35354f',
  '--faint-strong': '#3a3a5a',
  '--sidebar-bg': '#0c0c17',
  '--sidebar-border': '#17172a',
  '--color-scheme': 'dark',
}

const LIGHT_VARS: Record<string, string> = {
  '--bg': '#f4f4fb',
  '--surface': '#ffffff',
  '--surface-raised': '#f0f0fa',
  '--border': '#e2e2f0',
  '--border-subtle': '#ebebf8',
  '--text': '#111128',
  '--text-soft': '#222240',
  '--text-heading': '#333358',
  '--muted': '#6868a0',
  '--muted-strong': '#5555a0',
  '--faint': '#a0a0c0',
  '--faint-strong': '#8888aa',
  '--sidebar-bg': '#f0f0fa',
  '--sidebar-border': '#e2e2f0',
  '--color-scheme': 'light',
}

function applyVars(vars: Record<string, string>) {
  const root = document.documentElement
  Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v))
}

export function Sidebar({ user, onLogout }: { user: any; onLogout: () => void }) {
  const pathname = usePathname()
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeTheme, setActiveTheme] = useState<'dark' | 'light'>('dark')
  const [isMobile, setIsMobile] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    const check = () => {
      const mobile = window.innerWidth < 768
      setIsMobile(mobile)
      if (!mobile) setMobileOpen(false)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  useEffect(() => {
    try {
      const saved = localStorage.getItem('fh-theme')
      if (!saved) return
      const { theme } = JSON.parse(saved)
      setActiveTheme(theme === 'light' ? 'light' : 'dark')
      applyVars(theme === 'light' ? LIGHT_VARS : DARK_VARS)
    } catch {}
  }, [])

  function selectTheme(theme: 'dark' | 'light') {
    applyVars(theme === 'light' ? LIGHT_VARS : DARK_VARS)
    setActiveTheme(theme)
    localStorage.setItem('fh-theme', JSON.stringify({ theme }))
  }

  const closeMobile = () => setMobileOpen(false)

  return (
    <>
      {/* Hamburger button — mobile only, when sidebar closed */}
      {isMobile && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            position: 'fixed', top: 14, left: 14, zIndex: 400,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 10, width: 42, height: 42,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', color: 'var(--text)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          }}
        >
          <IconMenu />
        </button>
      )}

      {/* Backdrop — mobile only, when open */}
      {isMobile && mobileOpen && (
        <div
          onClick={closeMobile}
          style={{ position: 'fixed', inset: 0, zIndex: 298, background: 'rgba(0,0,0,0.55)' }}
        />
      )}

      <aside style={{
        width: 230, flexShrink: 0,
        background: 'var(--sidebar-bg)',
        borderRight: '1px solid var(--sidebar-border)',
        display: 'flex', flexDirection: 'column',
        ...(isMobile ? {
          position: 'fixed', top: 0, left: 0,
          height: '100vh', zIndex: 299,
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.24s ease',
          minHeight: 'unset',
        } : {
          minHeight: '100vh',
        }),
      }}>
        {/* Logo */}
        <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid var(--sidebar-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'rgba(124,58,237,0.12)',
              border: '1px solid rgba(124,58,237,0.22)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <LogoMark />
            </div>
            <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', letterSpacing: '-0.3px' }}>
              FreelanceHub
            </span>
          </div>
          {isMobile && (
            <button onClick={closeMobile} style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', padding: 4 }}>
              <IconX />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '10px 10px', display: 'flex', flexDirection: 'column', gap: 1 }}>
          {NAV.map(({ href, label, Icon }) => {
            const active = pathname === href
            return (
              <Link key={href} href={href} onClick={closeMobile} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '9px 12px', borderRadius: 8,
                color: active ? '#c4b5fd' : 'var(--muted)',
                background: active ? 'rgba(124,58,237,0.11)' : 'transparent',
                textDecoration: 'none', fontSize: 13.5,
                fontWeight: active ? 600 : 400,
                borderLeft: active ? '2px solid #7c3aed' : '2px solid transparent',
              }}>
                <Icon />
                {label}
              </Link>
            )
          })}

          <div style={{ height: 1, background: 'var(--sidebar-border)', margin: '8px 4px 4px' }} />

          <button
            onClick={() => setSettingsOpen(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8,
              color: 'var(--muted)', background: 'transparent',
              border: 'none', cursor: 'pointer', fontSize: 13.5,
              fontWeight: 400, width: '100%', textAlign: 'left',
              borderLeft: '2px solid transparent',
            }}
          >
            <IconSettings />
            Asetukset
          </button>
        </nav>

        {/* User */}
        <div style={{
          padding: '14px 16px', borderTop: '1px solid var(--sidebar-border)',
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: 'linear-gradient(135deg,#7c3aed,#4f46e5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff',
          }}>
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, overflow: 'hidden', minWidth: 0 }}>
            <div style={{ fontSize: 12.5, color: 'var(--text-soft)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email?.split('@')[0]}
            </div>
            <div style={{ fontSize: 11, color: 'var(--faint-strong)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>
              {user?.email}
            </div>
          </div>
        </div>
      </aside>

      {/* Settings modal */}
      {settingsOpen && (
        <div
          onClick={() => setSettingsOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.55)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 18, padding: '28px 28px 24px',
              width: 400, maxWidth: '92vw',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: 'rgba(124,58,237,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a78bfa' }}>
                  <IconSettings />
                </div>
                <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Asetukset</h2>
              </div>
              <button
                onClick={() => setSettingsOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 22, lineHeight: 1, padding: '2px 6px', borderRadius: 6 }}
              >
                ×
              </button>
            </div>

            {/* Theme selector */}
            <div style={{ marginBottom: 22 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--muted)', letterSpacing: '0.5px', marginBottom: 10 }}>TEEMA</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <button
                  onClick={() => selectTheme('dark')}
                  style={{
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    background: '#0e0e1a',
                    border: `2px solid ${activeTheme === 'dark' ? '#7c3aed' : 'rgba(255,255,255,0.07)'}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                    <div style={{ width: 20, height: 13, borderRadius: 4, background: '#111120', border: '1px solid #1c1c30' }} />
                    <div style={{ width: 28, height: 13, borderRadius: 4, background: '#16162a' }} />
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#c4b5fd' }}>Tumma</div>
                  <div style={{ fontSize: 11, color: '#5e5e80', marginTop: 2 }}>Tumma tausta</div>
                </button>
                <button
                  onClick={() => selectTheme('light')}
                  style={{
                    padding: '14px 16px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    background: '#ffffff',
                    border: `2px solid ${activeTheme === 'light' ? '#7c3aed' : '#e2e2f0'}`,
                  }}
                >
                  <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
                    <div style={{ width: 20, height: 13, borderRadius: 4, background: '#f4f4fb', border: '1px solid #e2e2f0' }} />
                    <div style={{ width: 28, height: 13, borderRadius: 4, background: '#f0f0fa' }} />
                  </div>
                  <div style={{ fontSize: 12.5, fontWeight: 600, color: '#6d28d9' }}>Vaalea</div>
                  <div style={{ fontSize: 11, color: '#6868a0', marginTop: 2 }}>Vaalea tausta</div>
                </button>
              </div>
            </div>

            <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 20px' }} />

            <button
              onClick={onLogout}
              style={{
                width: '100%', padding: '11px', borderRadius: 10,
                background: 'rgba(239,68,68,0.08)',
                border: '1px solid rgba(239,68,68,0.18)',
                color: '#f87171', fontSize: 13.5, fontWeight: 600,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              <IconLogout />
              Kirjaudu ulos
            </button>
          </div>
        </div>
      )}
    </>
  )
}
