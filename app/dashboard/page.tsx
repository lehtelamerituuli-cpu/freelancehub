'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Sidebar } from '@/app/components/Sidebar'
import { useIsMobile } from '@/app/hooks/useIsMobile'

const MONTHS = ['Tammikuu','Helmikuu','Maaliskuu','Huhtikuu','Toukokuu','Kesäkuu','Heinäkuu','Elokuu','Syyskuu','Lokakuu','Marraskuu','Joulukuu']

const IcoFolder = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
)
const IcoTrend = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
  </svg>
)
const IcoClock = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
)
const IcoMap = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
)
const IcoWarn = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>
)
const IcoWeek = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
  </svg>
)

function StatCard({
  label, value, sub, icon, iconBg, iconColor, trend,
}: {
  label: string; value: string | number; sub: string
  icon: React.ReactNode; iconBg: string; iconColor: string
  trend?: number | null
}) {
  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
        <span style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, letterSpacing: '0.2px' }}>{label}</span>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: iconBg, color: iconColor, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {icon}
        </div>
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, color: 'var(--text)', lineHeight: 1, marginBottom: 10 }}>{value}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {trend !== null && trend !== undefined && (
          <span style={{ color: trend >= 0 ? '#4ade80' : '#f87171', fontSize: 12, fontWeight: 600 }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </span>
        )}
        <span style={{ fontSize: 12, color: 'var(--faint)' }}>{sub}</span>
      </div>
    </div>
  )
}

const sel: React.CSSProperties = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 8, padding: '7px 12px', color: 'var(--text)',
  fontSize: 13, fontFamily: 'var(--font-space-grotesk),system-ui',
  cursor: 'pointer', outline: 'none',
}

export default function Dashboard() {
  const now = new Date()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [travelEntries, setTravelEntries] = useState<any[]>([])
  const [expenseEntries, setExpenseEntries] = useState<any[]>([])
  const [filterMonth, setFilterMonth] = useState(now.getMonth())
  const [filterYear, setFilterYear] = useState(now.getFullYear())
  const isMobile = useIsMobile()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      Promise.all([
        supabase.from('projects').select('*').eq('user_id', data.user.id),
        supabase.from('time_entries').select('*').eq('user_id', data.user.id),
        supabase.from('travel_entries').select('*').eq('user_id', data.user.id),
        supabase.from('expenses').select('*').eq('user_id', data.user.id),
      ]).then(([{ data: p }, { data: t }, { data: tr }, { data: ex }]) => {
        setProjects(p || [])
        setTimeEntries(t || [])
        setTravelEntries(tr || [])
        setExpenseEntries(ex || [])
      })
    })
  }, [])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Month filter helpers
  const byMonth = (arr: any[], m: number, y: number) =>
    arr.filter(e => { const d = new Date(e.date); return d.getMonth() === m && d.getFullYear() === y })

  const prevMonth = filterMonth === 0 ? 11 : filterMonth - 1
  const prevYear  = filterMonth === 0 ? filterYear - 1 : filterYear

  const filteredTime   = byMonth(timeEntries, filterMonth, filterYear)
  const prevTime       = byMonth(timeEntries, prevMonth, prevYear)
  const filteredTravel = byMonth(travelEntries, filterMonth, filterYear)

  const filteredRevenue = filteredTime.reduce((s, e) => s + e.hours * e.rate, 0)
  const prevRevenue     = prevTime.reduce((s, e) => s + e.hours * e.rate, 0)
  const revTrend = prevRevenue > 0 ? Math.round((filteredRevenue - prevRevenue) / prevRevenue * 100) : null

  const filteredHours = filteredTime.reduce((s, e) => s + e.hours, 0)
  const prevHours     = prevTime.reduce((s, e) => s + e.hours, 0)
  const hoursTrend = prevHours > 0 ? Math.round((filteredHours - prevHours) / prevHours * 100) : null

  const filteredKm    = filteredTravel.reduce((s, e) => s + e.km, 0)
  const activeProjects = projects.filter(p => p.status === 'active').length

  // Week summary (always current week, independent of filter)
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  weekStart.setHours(0, 0, 0, 0)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  const weekEntries = timeEntries.filter(e => { const d = new Date(e.date); return d >= weekStart && d <= weekEnd })
  const weekHours   = weekEntries.reduce((s, e) => s + e.hours, 0)
  const weekRevenue = weekEntries.reduce((s, e) => s + e.hours * e.rate, 0)
  const fmtDate = (d: Date) => d.toLocaleDateString('fi-FI', { day: 'numeric', month: 'numeric' })

  // Budget alert: total usage per project (time + travel + expenses)
  const projectUsedBudget = (id: string) =>
    timeEntries.filter(e => e.project_id === id).reduce((s, e) => s + e.hours * e.rate, 0) +
    travelEntries.filter(e => e.project_id === id).reduce((s, e) => s + e.km * 0.25, 0) +
    expenseEntries.filter(e => e.project_id === id).reduce((s, e) => s + e.amount, 0)

  // Year options derived from data
  const yearSet = new Set<number>([now.getFullYear()])
  timeEntries.forEach(e => yearSet.add(new Date(e.date).getFullYear()))
  travelEntries.forEach(e => yearSet.add(new Date(e.date).getFullYear()))
  const years = [...yearSet].sort()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-space-grotesk),system-ui,sans-serif' }}>
      {user && <Sidebar user={user} onLogout={logout} />}
      <main style={{ flex: 1, padding: isMobile ? '72px 16px 24px' : '32px 36px', overflow: 'auto' }}>

        {/* Top bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)' }}>
              Hei, {user?.email?.split('@')[0]}!
            </h1>
            <p style={{ color: 'var(--muted-strong)', marginTop: 5, fontSize: 13.5 }}>
              Tässä näkyvissä projektisi yleiskatsaus, aikataulut ja budjetit.
            </p>
          </div>

          {/* Month filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <select value={filterMonth} onChange={e => setFilterMonth(Number(e.target.value))} style={sel}>
              {MONTHS.map((m, i) => <option key={i} value={i}>{m}</option>)}
            </select>
            <select value={filterYear} onChange={e => setFilterYear(Number(e.target.value))} style={sel}>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: 16, marginBottom: 16 }}>
          <StatCard
            label="Aktiiviset projektit"
            value={activeProjects}
            sub={`${projects.length} projektia yhteensä`}
            icon={<IcoFolder />}
            iconBg="rgba(124,58,237,0.15)" iconColor="#a78bfa"
          />
          <StatCard
            label={`Tulot — ${MONTHS[filterMonth].toLowerCase()}`}
            value={`${filteredRevenue.toFixed(0)} €`}
            sub="verrattuna ed. kuuhun"
            icon={<IcoTrend />}
            iconBg="rgba(34,197,94,0.12)" iconColor="#4ade80"
            trend={revTrend}
          />
          <StatCard
            label={`Tunnit — ${MONTHS[filterMonth].toLowerCase()}`}
            value={`${filteredHours.toFixed(1)} h`}
            sub={`${filteredTime.length} kirjausta`}
            icon={<IcoClock />}
            iconBg="rgba(59,130,246,0.12)" iconColor="#60a5fa"
            trend={hoursTrend}
          />
          <StatCard
            label={`Matkakorvaukset — ${MONTHS[filterMonth].toLowerCase()}`}
            value={`${(filteredKm * 0.25).toFixed(0)} €`}
            sub={`${filteredKm} km`}
            icon={<IcoMap />}
            iconBg="rgba(251,146,60,0.12)" iconColor="#fb923c"
          />
        </div>

        {/* Week summary */}
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 14, padding: '16px 22px', marginBottom: 24,
          display: 'flex', alignItems: 'center', gap: 20,
        }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(124,58,237,0.12)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <IcoWeek />
          </div>
          <div>
            <div style={{ fontSize: 11.5, color: 'var(--muted)', fontWeight: 500, marginBottom: 3 }}>
              TÄMÄ VIIKKO · {fmtDate(weekStart)} – {fmtDate(weekEnd)}
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'baseline', gap: 10 }}>
              {weekHours.toFixed(1)} h
              <span style={{ color: 'var(--muted-strong)', fontSize: 14, fontWeight: 500 }}>·</span>
              <span style={{ color: '#4ade80' }}>{weekRevenue.toFixed(0)} €</span>
            </div>
          </div>
          {weekHours === 0 && (
            <div style={{ marginLeft: 'auto', fontSize: 12.5, color: 'var(--faint)', fontStyle: 'italic' }}>
              Ei kirjauksia tälle viikolle vielä
            </div>
          )}
          {weekHours > 0 && (
            <div style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted)', display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'right' }}>
              <span>{weekEntries.length} kirjausta</span>
              <span>{weekHours > 0 ? (weekRevenue / weekHours).toFixed(0) : '—'} €/h keskimäärin</span>
            </div>
          )}
        </div>

        {/* Projects table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 15, fontWeight: 600, margin: 0, color: 'var(--text)' }}>Projektit yhteenveto</h2>
            <Link href="/projects" style={{ color: '#7c3aed', fontSize: 13, textDecoration: 'none', fontWeight: 500 }}>
              + Uusi projekti
            </Link>
          </div>
          {projects.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--faint)', fontSize: 14 }}>
              Ei projekteja vielä.{' '}
              <Link href="/projects" style={{ color: '#7c3aed', textDecoration: 'none' }}>Lisää projekti →</Link>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[
                    { label: 'Projekti', mob: false },
                    { label: 'Tila', mob: false },
                    { label: 'Budjetti', mob: false },
                    { label: 'Käytetty', mob: true },
                    { label: 'Asiakas', mob: true },
                    { label: 'Deadline', mob: true },
                  ].map(({ label, mob }) => (
                    <th key={label} className={mob ? 'mob-hide' : ''} style={{ textAlign: 'left', padding: '12px 18px', color: 'var(--faint-strong)', fontWeight: 500, fontSize: 12 }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {projects.map(p => {
                  const used = projectUsedBudget(p.id)
                  const pct  = p.budget > 0 ? used / p.budget * 100 : 0
                  const alert = p.budget > 0 && pct >= 80
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '14px 18px' }}>
                        <div style={{ fontWeight: 600, color: 'var(--text-soft)', marginBottom: alert ? 4 : 0 }}>{p.name}</div>
                        {alert && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: '#f87171' }}>
                            <IcoWarn />
                            <span style={{ fontSize: 11, fontWeight: 600 }}>Budjetti lähes täynnä ({Math.round(pct)} %)</span>
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{
                          fontSize: 11, padding: '4px 10px', borderRadius: 20, fontWeight: 600,
                          background: p.status === 'active' ? 'rgba(251,146,60,0.15)' : 'rgba(34,197,94,0.12)',
                          color: p.status === 'active' ? '#fb923c' : '#4ade80',
                          border: `1px solid ${p.status === 'active' ? 'rgba(251,146,60,0.35)' : 'rgba(34,197,94,0.2)'}`,
                        }}>
                          {p.status === 'active' ? 'Aktiivinen' : 'Valmis'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 18px', color: 'var(--muted)' }}>{p.budget ? `${p.budget.toLocaleString('fi-FI')} €` : '—'}</td>
                      <td className="mob-hide" style={{ padding: '14px 18px' }}>
                        {p.budget > 0 ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ height: '100%', borderRadius: 2, background: pct >= 100 ? '#f87171' : pct >= 80 ? '#fb923c' : '#4ade80', width: `${Math.min(pct, 100)}%` }} />
                            </div>
                            <span style={{ fontSize: 12, color: pct >= 80 ? '#fb923c' : 'var(--muted)', fontWeight: pct >= 80 ? 600 : 400 }}>
                              {Math.round(pct)} %
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--faint)' }}>—</span>
                        )}
                      </td>
                      <td className="mob-hide" style={{ padding: '14px 18px', color: 'var(--muted)' }}>{p.client || '—'}</td>
                      <td className="mob-hide" style={{ padding: '14px 18px', color: 'var(--muted)' }}>{p.deadline || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

      </main>
    </div>
  )
}
