'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/app/components/Sidebar'
import { supabase } from '@/lib/supabase'

type Invoice = {
  id: string
  invoice_number: string
  project_name: string
  buyer_name: string
  total_netto: number
  total_vat: number
  total_brutto: number
  vat_rate: number
  status: string
  notes: string
  created_at: string
}

const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  'lähetetty': { label: 'Lähetetty', color: '#60a5fa', bg: 'rgba(96,165,250,0.12)' },
  'maksettu':  { label: 'Maksettu',  color: '#34d399', bg: 'rgba(52,211,153,0.12)' },
  'myöhässä':  { label: 'Myöhässä', color: '#f87171', bg: 'rgba(248,113,113,0.12)' },
  'luonnos':   { label: 'Luonnos',   color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
}

export default function InvoicesPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editNotes, setEditNotes] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      load()
    })
  }, [])

  async function load() {
    const { data } = await supabase
      .from('invoices')
      .select('*')
      .order('created_at', { ascending: false })
    setInvoices(data || [])
    setLoading(false)
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('invoices').update({ status }).eq('id', id)
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, status } : inv))
  }

  async function saveNotes(id: string) {
    await supabase.from('invoices').update({ notes: editNotes }).eq('id', id)
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, notes: editNotes } : inv))
    setEditingId(null)
  }

  async function deleteInvoice(id: string) {
    if (!confirm('Poistetaanko lasku?')) return
    await supabase.from('invoices').delete().eq('id', id)
    setInvoices(prev => prev.filter(inv => inv.id !== id))
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const totalLähetetty = invoices.filter(i => i.status === 'lähetetty').reduce((s, i) => s + i.total_brutto, 0)
  const totalMaksettu = invoices.filter(i => i.status === 'maksettu').reduce((s, i) => s + i.total_brutto, 0)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>
      {user && <Sidebar user={user} onLogout={logout} />}
      <main style={{ flex: 1, padding: '2rem 2.25rem', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Laskuhistoria</h1>
            <p style={{ color: 'var(--muted-strong)', marginTop: 5, fontSize: 13.5 }}>Kaikki lähetetyt ja maksetut laskut</p>
          </div>
          <button
            onClick={() => router.push('/laskutus')}
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            + Uusi lasku
          </button>
        </div>

        {/* Yhteenveto */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Laskuja yhteensä', value: invoices.length, sub: 'kaikki laskut', color: '#a78bfa' },
            { label: 'Lähettämättä maksettu', value: `${totalLähetetty.toFixed(2)} €`, sub: `${invoices.filter(i => i.status === 'lähetetty').length} laskua odottaa`, color: '#60a5fa' },
            { label: 'Maksettu yhteensä', value: `${totalMaksettu.toFixed(2)} €`, sub: `${invoices.filter(i => i.status === 'maksettu').length} laskua`, color: '#34d399' },
          ].map(c => (
            <div key={c.label} style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
              <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 12 }}>{c.label}</div>
              <div style={{ fontSize: 28, fontWeight: 700, color: c.color, lineHeight: 1, marginBottom: 8 }}>{c.value}</div>
              <div style={{ fontSize: 12, color: 'var(--faint)' }}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* Laskulista */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Ladataan...</div>
          ) : invoices.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--faint)', fontSize: 14 }}>
              Ei laskuja vielä. Luo ensimmäinen lasku laskutus-sivulla.
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Päivämäärä', 'Laskunro', 'Asiakas', 'Projekti', 'Netto', 'Brutto', 'Tila', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '12px 16px', color: 'var(--faint-strong)', fontWeight: 500, fontSize: 12 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const st = STATUS_LABELS[inv.status] || STATUS_LABELS['lähetetty']
                  return (
                    <>
                      <tr key={inv.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                        <td style={{ padding: '12px 16px', color: 'var(--muted)', fontSize: 12 }}>
                          {new Date(inv.created_at).toLocaleDateString('fi-FI')}
                        </td>
                        <td style={{ padding: '12px 16px', color: 'var(--text)', fontWeight: 600, fontSize: 12 }}>{inv.invoice_number}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-soft)' }}>{inv.buyer_name || '—'}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{inv.project_name || '—'}</td>
                        <td style={{ padding: '12px 16px', color: 'var(--text-soft)', fontWeight: 500 }}>{inv.total_netto.toFixed(2)} €</td>
                        <td style={{ padding: '12px 16px', color: '#a78bfa', fontWeight: 700 }}>{inv.total_brutto.toFixed(2)} €</td>
                        <td style={{ padding: '12px 16px' }}>
                          <select
                            value={inv.status}
                            onChange={e => updateStatus(inv.id, e.target.value)}
                            style={{ background: st.bg, color: st.color, border: `1px solid ${st.color}40`, borderRadius: 20, padding: '3px 10px', fontSize: 12, fontWeight: 600, cursor: 'pointer', outline: 'none' }}
                          >
                            {Object.entries(STATUS_LABELS).map(([k, v]) => (
                              <option key={k} value={k}>{v.label}</option>
                            ))}
                          </select>
                        </td>
                        <td style={{ padding: '12px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
                          <button
                            onClick={() => { setEditingId(editingId === inv.id ? null : inv.id); setEditNotes(inv.notes || '') }}
                            style={{ background: 'none', border: 'none', color: 'var(--muted)', cursor: 'pointer', fontSize: 12, padding: '3px 8px', borderRadius: 6, background: 'var(--bg)' } as any}
                          >
                            Muistiinpano
                          </button>
                          <button
                            onClick={() => deleteInvoice(inv.id)}
                            style={{ background: 'none', border: 'none', color: 'var(--faint)', cursor: 'pointer', fontSize: 12 }}
                            onMouseOver={e => (e.currentTarget.style.color = '#f87171')}
                            onMouseOut={e => (e.currentTarget.style.color = 'var(--faint)')}
                          >
                            Poista
                          </button>
                        </td>
                      </tr>
                      {editingId === inv.id && (
                        <tr key={`${inv.id}-notes`} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td colSpan={8} style={{ padding: '0 16px 12px' }}>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <input
                                value={editNotes}
                                onChange={e => setEditNotes(e.target.value)}
                                placeholder="Lisää muistiinpano (esim. maksettu 15.3.2025)"
                                style={{ flex: 1, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', fontSize: 13 }}
                                onKeyDown={e => e.key === 'Enter' && saveNotes(inv.id)}
                              />
                              <button
                                onClick={() => saveNotes(inv.id)}
                                style={{ padding: '7px 16px', background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}
                              >
                                Tallenna
                              </button>
                            </div>
                            {inv.notes && <div style={{ marginTop: 6, fontSize: 12, color: 'var(--muted)' }}>{inv.notes}</div>}
                          </td>
                        </tr>
                      )}
                    </>
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
