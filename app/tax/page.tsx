'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/app/components/Sidebar'
import { useIsMobile } from '@/app/hooks/useIsMobile'

const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 5 }, (_, i) => currentYear - i)

function sumBy<T>(arr: T[], fn: (item: T) => number): number {
  return arr.reduce((s, x) => s + fn(x), 0)
}

function groupByCategory<T extends { category: string; amount: number }>(arr: T[]) {
  const map: Record<string, number> = {}
  for (const x of arr) {
    map[x.category] = (map[x.category] || 0) + Number(x.amount)
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1])
}

export default function Tax() {
  const router = useRouter()
  const isMobile = useIsMobile()

  const [user, setUser] = useState<any>(null)
  const [selectedYear, setSelectedYear] = useState(currentYear)
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [travelEntries, setTravelEntries] = useState<any[]>([])
  const [expenseEntries, setExpenseEntries] = useState<any[]>([])
  const [receiptEntries, setReceiptEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      loadData(data.user.id, currentYear)
    })
  }, [])

  async function loadData(uid: string, year: number) {
    setLoading(true)
    const start = `${year}-01-01`
    const end = `${year}-12-31`
    const [{ data: t }, { data: tr }, { data: ex }, { data: rc }] = await Promise.all([
      supabase.from('time_entries').select('*, projects(name)').eq('user_id', uid).gte('date', start).lte('date', end).order('date'),
      supabase.from('travel_entries').select('*, projects(name)').eq('user_id', uid).gte('date', start).lte('date', end).order('date'),
      supabase.from('expenses').select('*, projects(name)').eq('user_id', uid).gte('date', start).lte('date', end).order('date'),
      supabase.from('receipts').select('*, projects(name)').eq('user_id', uid).gte('date', start).lte('date', end).order('date'),
    ])
    setTimeEntries(t || [])
    setTravelEntries(tr || [])
    setExpenseEntries(ex || [])
    setReceiptEntries(rc || [])
    setLoading(false)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function changeYear(year: number) {
    setSelectedYear(year)
    if (user) loadData(user.id, year)
  }

  const totalIncome = sumBy(timeEntries, e => e.hours * e.rate)
  const totalTravel = sumBy(travelEntries, e => e.km * 0.25)
  const totalExpenses = sumBy(expenseEntries, e => Number(e.amount))
  const totalReceipts = sumBy(receiptEntries, e => Number(e.amount))
  const taxableIncome = Math.max(0, totalIncome - totalExpenses - totalReceipts)

  const expensesByCategory = groupByCategory(expenseEntries)
  const receiptsByCategory = groupByCategory(receiptEntries)

  function downloadCSV() {
    const rows: string[][] = [
      [`FreelanceHub verotusyhteenveto ${selectedYear}`],
      [],
      ['TULOT'],
      ['Päivämäärä', 'Projekti', 'Kuvaus', 'Tunnit', '€/h', 'Summa (€)'],
      ...timeEntries.map(e => [
        e.date,
        e.projects?.name || '',
        e.description || '',
        String(e.hours),
        String(e.rate),
        (e.hours * e.rate).toFixed(2),
      ]),
      ['', '', '', '', 'YHTEENSÄ', totalIncome.toFixed(2)],
      [],
      ['MATKAKORVAUKSET (veroton)'],
      ['Päivämäärä', 'Projekti', 'Reitti', 'km', 'Korvaus (€)'],
      ...travelEntries.map(e => [
        e.date,
        e.projects?.name || '',
        e.route || '',
        String(e.km),
        (e.km * 0.25).toFixed(2),
      ]),
      ['', '', '', 'YHTEENSÄ', totalTravel.toFixed(2)],
      [],
      ['KULUKIRJAUKSET'],
      ['Päivämäärä', 'Projekti', 'Kategoria', 'Kuvaus', 'Summa (€)'],
      ...expenseEntries.map(e => [
        e.date,
        e.projects?.name || '',
        e.category,
        e.description || '',
        Number(e.amount).toFixed(2),
      ]),
      ['', '', '', 'YHTEENSÄ', totalExpenses.toFixed(2)],
      [],
      ['TOSITTEET'],
      ['Päivämäärä', 'Projekti', 'Kategoria', 'Kuvaus', 'Summa (€)'],
      ...receiptEntries.map(e => [
        e.date,
        e.projects?.name || '',
        e.category,
        e.description || '',
        Number(e.amount).toFixed(2),
      ]),
      ['', '', '', 'YHTEENSÄ', totalReceipts.toFixed(2)],
      [],
      ['YHTEENVETO'],
      ['', 'Summa (€)'],
      ['Kokonaistulot', totalIncome.toFixed(2)],
      ['Matkakorvaukset (veroton)', totalTravel.toFixed(2)],
      ['Kulukirjaukset (vähennys)', `-${totalExpenses.toFixed(2)}`],
      ['Tositteet (vähennys)', `-${totalReceipts.toFixed(2)}`],
      ['Verotettava tulo (arvio)', taxableIncome.toFixed(2)],
    ]

    const csv = rows.map(r => r.map(cell => `"${cell.replace(/"/g, '""')}"`).join(',')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `verotusyhteenveto-${selectedYear}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const card = (label: string, value: string, sub: string, color: string, highlight = false) => (
    <div style={{
      background: highlight ? 'rgba(124,58,237,0.13)' : 'var(--surface)',
      border: `1px solid ${highlight ? 'rgba(124,58,237,0.3)' : 'var(--border)'}`,
      borderRadius: 14, padding: '20px 22px',
    }}>
      <div style={{ fontSize: 12, color: highlight ? '#a78bfa' : 'var(--muted)', fontWeight: 500, marginBottom: 14 }}>{label}</div>
      <div style={{ fontSize: 26, fontWeight: 700, color, lineHeight: 1, marginBottom: 8 }}>{value}</div>
      <div style={{ fontSize: 12, color: 'var(--faint)' }}>{sub}</div>
    </div>
  )

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>
      {user && <Sidebar user={user} onLogout={logout} />}
      <main style={{ flex: 1, padding: isMobile ? '72px 16px 24px' : '32px 36px', overflow: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Verotusyhteenveto</h1>
            <p style={{ color: 'var(--muted-strong)', marginTop: 5, fontSize: 13.5 }}>Arvio verotettavista tuloista ja vähennyksistä</p>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <select
              value={selectedYear}
              onChange={e => changeYear(Number(e.target.value))}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 13px', color: 'var(--text-soft)', fontSize: 13, cursor: 'pointer' }}
            >
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <button
              onClick={downloadCSV}
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 10, padding: '10px 18px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
              Lataa CSV
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: 'var(--faint)' }}>Ladataan...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(5,1fr)', gap: 14, marginBottom: 24 }}>
              {card('Kokonaistulot', `${totalIncome.toFixed(0)} €`, `${timeEntries.length} kirjausta`, '#60a5fa')}
              {card('Matkakorvaukset', `${totalTravel.toFixed(0)} €`, 'veroton', '#34d399')}
              {card('Kulukirjaukset', `${totalExpenses.toFixed(0)} €`, 'vähennyskelpoinen', '#fb923c')}
              {card('Tositteet', `${totalReceipts.toFixed(0)} €`, 'vähennyskelpoinen', '#f87171')}
              {card('Verotettava tulo', `${taxableIncome.toFixed(0)} €`, 'arvio', '#fff', true)}
            </div>

            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 20 }}>
              <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, marginTop: 0, color: 'var(--text-heading)' }}>Laskelman perusteet</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Kokonaistulot (työtunnit)', value: totalIncome, color: '#60a5fa', sign: '' },
                  { label: 'Matkakorvaukset (veroton, ei vähennä tuloa)', value: totalTravel, color: '#34d399', sign: '' },
                  { label: '− Kulukirjaukset', value: -totalExpenses, color: '#fb923c', sign: '−' },
                  { label: '− Tositteet', value: -totalReceipts, color: '#f87171', sign: '−' },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-subtle)' }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{row.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 600, color: row.color }}>
                      {row.sign}{Math.abs(row.value).toFixed(2)} €
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', marginTop: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Verotettava tulo (arvio)</span>
                  <span style={{ fontSize: 18, fontWeight: 700, color: '#a78bfa' }}>{taxableIncome.toFixed(2)} €</span>
                </div>
              </div>
              <p style={{ fontSize: 12, color: 'var(--faint)', marginBottom: 0, marginTop: 8 }}>
                * Arvio. Tarkista lopullinen verotus Verohallinnon ohjeiden mukaan.
              </p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20 }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, marginTop: 0, color: 'var(--text-heading)' }}>Kulut kategorioittain</h3>
                {expensesByCategory.length === 0 ? (
                  <p style={{ color: 'var(--faint)', fontSize: 13, margin: 0 }}>Ei kulukirjauksia.</p>
                ) : expensesByCategory.map(([cat, sum]) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{cat}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 80, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#fb923c', borderRadius: 3, width: `${Math.min(100, sum / totalExpenses * 100)}%` }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fb923c', minWidth: 70, textAlign: 'right' }}>{sum.toFixed(2)} €</span>
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px' }}>
                <h3 style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, marginTop: 0, color: 'var(--text-heading)' }}>Tositteet kategorioittain</h3>
                {receiptsByCategory.length === 0 ? (
                  <p style={{ color: 'var(--faint)', fontSize: 13, margin: 0 }}>Ei tositekirjauksia.</p>
                ) : receiptsByCategory.map(([cat, sum]) => (
                  <div key={cat} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <span style={{ fontSize: 13, color: 'var(--muted)' }}>{cat}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 80, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: '#f87171', borderRadius: 3, width: `${Math.min(100, sum / totalReceipts * 100)}%` }} />
                      </div>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#f87171', minWidth: 70, textAlign: 'right' }}>{sum.toFixed(2)} €</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {timeEntries.length > 0 && (
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-heading)' }}>Tulot kuukausittain</h2>
                  <span style={{ fontSize: 13, color: 'var(--muted)' }}>{totalIncome.toFixed(2)} €</span>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {['Päivämäärä','Projekti','Kuvaus','Tunnit','€/h','Summa'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '11px 16px', color: 'var(--faint-strong)', fontWeight: 500, fontSize: 12 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {timeEntries.map(e => (
                      <tr key={e.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '11px 16px', color: 'var(--muted)' }}>{e.date}</td>
                        <td style={{ padding: '11px 16px', fontWeight: 600, color: 'var(--text-soft)' }}>{e.projects?.name}</td>
                        <td style={{ padding: '11px 16px', color: 'var(--muted)' }}>{e.description || '—'}</td>
                        <td style={{ padding: '11px 16px', color: 'var(--text-soft)' }}>{e.hours} h</td>
                        <td style={{ padding: '11px 16px', color: 'var(--muted)' }}>{e.rate} €</td>
                        <td style={{ padding: '11px 16px', color: '#60a5fa', fontWeight: 600 }}>{(e.hours * e.rate).toFixed(2)} €</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
