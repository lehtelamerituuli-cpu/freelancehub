'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/app/components/Sidebar'
import { useIsMobile } from '@/app/hooks/useIsMobile'

const CATEGORIES = ['Materiaalit', 'Alihankkijat', 'Kalusto', 'Kuljetus', 'Työvälineet', 'Muu']

const CAT_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  'Materiaalit':  { bg: 'rgba(59,130,246,0.12)',  text: '#60a5fa', border: 'rgba(59,130,246,0.25)'  },
  'Alihankkijat': { bg: 'rgba(139,92,246,0.12)',  text: '#a78bfa', border: 'rgba(139,92,246,0.25)'  },
  'Kalusto':      { bg: 'rgba(245,158,11,0.12)',  text: '#fbbf24', border: 'rgba(245,158,11,0.25)'  },
  'Kuljetus':     { bg: 'rgba(16,185,129,0.12)',  text: '#34d399', border: 'rgba(16,185,129,0.25)'  },
  'Työvälineet':  { bg: 'rgba(236,72,153,0.12)',  text: '#f472b6', border: 'rgba(236,72,153,0.25)'  },
  'Muu':          { bg: 'rgba(107,114,128,0.12)', text: '#9ca3af', border: 'rgba(107,114,128,0.25)' },
}

export default function Expenses() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [projectId, setProjectId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [recurring, setRecurring] = useState<any[]>([])
  const [showRecurring, setShowRecurring] = useState(false)
  const [showRecurringForm, setShowRecurringForm] = useState(false)
  const [recDesc, setRecDesc] = useState('')
  const [recAmount, setRecAmount] = useState('')
  const [recCategory, setRecCategory] = useState(CATEGORIES[0])
  const [recFrequency, setRecFrequency] = useState('monthly')
  const [recProjectId, setRecProjectId] = useState('')
  const [recError, setRecError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      supabase.from('projects').select('*').eq('user_id', data.user.id).order('created_at', { ascending: false }).then(({ data: d }) => {
        setProjects(d || [])
        if (d && d.length > 0) setProjectId(d[0].id)
      })
      loadEntries(data.user.id)
      loadRecurring(data.user.id)
    })
  }, [])

  async function loadEntries(uid: string) {
    const { data, error: err } = await supabase
      .from('expenses')
      .select('*, projects(name)')
      .eq('user_id', uid)
      .order('date', { ascending: false })
    if (err) {
      setError(`Tietojen haku epäonnistui: ${err.message}. Varmista että expenses-taulu on luotu Supabasessa.`)
    } else {
      setError(null)
    }
    setEntries(data || [])
  }

  async function loadRecurring(uid: string) {
    const { data } = await supabase.from('recurring_expenses').select('*, projects(name)').eq('user_id', uid).eq('active', true).order('created_at')
    setRecurring(data || [])
  }

  async function addRecurring() {
    if (!recAmount || !user) return
    const nextDue = new Date()
    if (recFrequency === 'weekly') nextDue.setDate(nextDue.getDate() + 7)
    else if (recFrequency === 'monthly') nextDue.setMonth(nextDue.getMonth() + 1)
    else if (recFrequency === 'quarterly') nextDue.setMonth(nextDue.getMonth() + 3)
    else nextDue.setFullYear(nextDue.getFullYear() + 1)
    const { error: err } = await supabase.from('recurring_expenses').insert({
      user_id: user.id,
      project_id: recProjectId || null,
      category: recCategory,
      description: recDesc,
      amount: parseFloat(recAmount),
      frequency: recFrequency,
      next_due: nextDue.toISOString().split('T')[0],
    })
    if (err) { setRecError('Tallennusvirhe: ' + err.message); return }
    setRecError(null)
    setRecDesc(''); setRecAmount(''); setShowRecurringForm(false)
    loadRecurring(user.id)
  }

  async function createFromRecurring(rec: any) {
    await supabase.from('expenses').insert({
      user_id: user.id,
      project_id: rec.project_id || null,
      date: new Date().toISOString().split('T')[0],
      category: rec.category,
      description: rec.description,
      amount: rec.amount,
    })
    const next = new Date()
    if (rec.frequency === 'weekly') next.setDate(next.getDate() + 7)
    else if (rec.frequency === 'monthly') next.setMonth(next.getMonth() + 1)
    else if (rec.frequency === 'quarterly') next.setMonth(next.getMonth() + 3)
    else next.setFullYear(next.getFullYear() + 1)
    await supabase.from('recurring_expenses').update({ next_due: next.toISOString().split('T')[0] }).eq('id', rec.id)
    loadEntries(user.id)
    loadRecurring(user.id)
  }

  async function deleteRecurring(id: string) {
    await supabase.from('recurring_expenses').delete().eq('id', id)
    loadRecurring(user.id)
  }

  async function addEntry() {
    if (!amount || !user) return
    setSaving(true)
    const { error: err } = await supabase.from('expenses').insert({
      user_id: user.id,
      project_id: projectId || null,
      date,
      category,
      description,
      amount: parseFloat(amount),
    })
    setSaving(false)
    if (err) {
      setError(`Tallennus epäonnistui: ${err.message}`)
      return
    }
    setError(null)
    setDescription(''); setAmount(''); setShowForm(false)
    loadEntries(user.id)
  }

  async function deleteEntry(id: string) {
    await supabase.from('expenses').delete().eq('id', id)
    loadEntries(user.id)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const totalAmount = entries.reduce((s, e) => s + e.amount, 0)

  const byCategory = CATEGORIES.map(cat => ({
    cat,
    total: entries.filter(e => e.category === cat).reduce((s, e) => s + e.amount, 0),
    count: entries.filter(e => e.category === cat).length,
  })).filter(c => c.count > 0)

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '9px 13px', color: 'var(--text-soft)',
    fontSize: 13, fontFamily: 'var(--font-space-grotesk),system-ui', boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-space-grotesk),system-ui,sans-serif' }}>
      {user && <Sidebar user={user} onLogout={logout} />}
      <main style={{ flex: 1, padding: isMobile ? '72px 16px 24px' : '32px 36px', overflow: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Kulut</h1>
            <p style={{ color: 'var(--muted-strong)', marginTop: 5, fontSize: 13.5 }}>
              {entries.length} kulukirjausta · {totalAmount.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € yhteensä
            </p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            + Lisää kulu
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '14px 18px', marginBottom: 20, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <span style={{ color: '#f87171', fontSize: 16, flexShrink: 0 }}>⚠</span>
            <div>
              <div style={{ color: '#f87171', fontWeight: 600, fontSize: 13, marginBottom: 4 }}>Virhe</div>
              <div style={{ color: '#fca5a5', fontSize: 12.5 }}>{error}</div>
            </div>
            <button onClick={() => setError(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 18, padding: 0, flexShrink: 0 }}>×</button>
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(3,1fr)', gap: 16, marginBottom: 20 }}>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 12 }}>Kulut yhteensä</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#f87171' }}>{totalAmount.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
            <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 8 }}>{entries.length} kirjausta</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 12 }}>Kategorioita</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)' }}>{byCategory.length}</div>
            <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 8 }}>käytössä</div>
          </div>
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', gridColumn: isMobile ? '1 / -1' : 'auto' }}>
            <div style={{ fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 12 }}>Suurin kuluerä</div>
            {byCategory.length > 0 ? (() => {
              const top = byCategory.reduce((a, b) => a.total > b.total ? a : b)
              const c = CAT_COLOR[top.cat]
              return (
                <>
                  <div style={{ fontSize: 28, fontWeight: 700, color: c.text }}>{top.total.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</div>
                  <div style={{ fontSize: 12, color: 'var(--faint)', marginTop: 8 }}>{top.cat}</div>
                </>
              )
            })() : <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--faint)' }}>—</div>}
          </div>
        </div>

        {/* Recurring expenses */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 20 }}>
          <button
            onClick={() => setShowRecurring(v => !v)}
            style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 22px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text)', fontSize: 13.5, fontWeight: 600 }}
          >
            <span>🔁 Toistuvat kulut {recurring.length > 0 && `(${recurring.length})`}</span>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>{showRecurring ? '▲ Piilota' : '▼ Näytä'}</span>
          </button>
          {showRecurring && (
            <div style={{ borderTop: '1px solid var(--border)', padding: '16px 22px' }}>
              {recError && <div style={{ color: '#f87171', fontSize: 12.5, marginBottom: 12, padding: '8px 12px', background: 'rgba(248,113,113,0.08)', borderRadius: 8 }}>⚠ {recError}</div>}
              {recurring.length === 0 && !showRecurringForm && (
                <div style={{ color: 'var(--faint)', fontSize: 13, marginBottom: 12 }}>Ei toistuvia kuluja. Lisää ensimmäinen alla.</div>
              )}
              {recurring.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
                  {recurring.map(r => {
                    const c = CAT_COLOR[r.category] || CAT_COLOR['Muu']
                    const freqLabel: Record<string, string> = { weekly: 'Viikoittain', monthly: 'Kuukausittain', quarterly: 'Neljännesvuosittain', yearly: 'Vuosittain' }
                    const daysUntil = r.next_due ? Math.ceil((new Date(r.next_due).getTime() - new Date().getTime()) / 86400000) : null
                    return (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border-subtle)' }}>
                        <span style={{ fontSize: 11.5, padding: '2px 8px', borderRadius: 20, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}`, flexShrink: 0 }}>{r.category}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-soft)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.description || '—'}</div>
                          <div style={{ fontSize: 11, color: 'var(--muted-strong)', marginTop: 2 }}>{freqLabel[r.frequency] || r.frequency} · {r.projects?.name || 'Ei projektia'}</div>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#f87171' }}>{Number(r.amount).toFixed(2)} €</div>
                          {daysUntil !== null && (
                            <div style={{ fontSize: 11, color: daysUntil <= 3 ? '#f87171' : 'var(--muted)', marginTop: 2 }}>
                              {daysUntil <= 0 ? 'Erääntynyt!' : `${daysUntil} pv`}
                            </div>
                          )}
                        </div>
                        <button onClick={() => createFromRecurring(r)} style={{ background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.25)', borderRadius: 8, padding: '6px 12px', color: '#34d399', fontSize: 12, cursor: 'pointer', fontWeight: 600, whiteSpace: 'nowrap' }}>+ Luo nyt</button>
                        <button onClick={() => deleteRecurring(r.id)} style={{ background: 'none', border: 'none', color: 'var(--faint)', cursor: 'pointer', fontSize: 16, padding: '0 4px' }} onMouseOver={e => (e.currentTarget.style.color = '#f87171')} onMouseOut={e => (e.currentTarget.style.color = 'var(--faint)')}>×</button>
                      </div>
                    )
                  })}
                </div>
              )}
              {showRecurringForm ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 5, fontWeight: 500 }}>Kuvaus</label>
                      <input value={recDesc} onChange={e => setRecDesc(e.target.value)} style={inp} placeholder="esim. Pilvipalvelu" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 5, fontWeight: 500 }}>Summa (€) *</label>
                      <input type="number" step="0.01" value={recAmount} onChange={e => setRecAmount(e.target.value)} style={inp} placeholder="0,00" />
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 5, fontWeight: 500 }}>Kategoria</label>
                      <select value={recCategory} onChange={e => setRecCategory(e.target.value)} style={inp}>
                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 5, fontWeight: 500 }}>Toistuvuus</label>
                      <select value={recFrequency} onChange={e => setRecFrequency(e.target.value)} style={inp}>
                        <option value="weekly">Viikoittain</option>
                        <option value="monthly">Kuukausittain</option>
                        <option value="quarterly">Neljännesvuosittain</option>
                        <option value="yearly">Vuosittain</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 5, fontWeight: 500 }}>Projekti</label>
                      <select value={recProjectId} onChange={e => setRecProjectId(e.target.value)} style={inp}>
                        <option value="">— Ei projektia —</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={addRecurring} disabled={!recAmount} style={{ background: recAmount ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'var(--surface-raised)', border: 'none', borderRadius: 8, padding: '9px 18px', color: recAmount ? '#fff' : 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: recAmount ? 'pointer' : 'not-allowed' }}>Tallenna</button>
                    <button onClick={() => setShowRecurringForm(false)} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 16px', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>Peruuta</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowRecurringForm(true)} style={{ background: 'none', border: '1px dashed var(--border)', borderRadius: 8, padding: '8px 16px', color: 'var(--muted)', fontSize: 13, cursor: 'pointer', width: '100%' }}>
                  + Lisää toistuva kulu
                </button>
              )}
            </div>
          )}
        </div>

        {/* Category breakdown */}
        {byCategory.length > 0 && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-heading)', marginBottom: 16 }}>Kategorioittain</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {byCategory.sort((a, b) => b.total - a.total).map(({ cat, total, count }) => {
                const c = CAT_COLOR[cat]
                const pct = totalAmount > 0 ? total / totalAmount * 100 : 0
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ fontSize: 11.5, padding: '3px 9px', borderRadius: 20, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}`, minWidth: 100, textAlign: 'center', flexShrink: 0 }}>{cat}</span>
                    <div style={{ flex: 1, height: 6, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', borderRadius: 3, background: c.text, width: `${pct}%`, transition: 'width .4s' }} />
                    </div>
                    <span style={{ fontSize: 12.5, fontWeight: 600, color: 'var(--text-soft)', minWidth: 90, textAlign: 'right', flexShrink: 0 }}>{total.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</span>
                    <span style={{ fontSize: 11, color: 'var(--faint)', minWidth: 44, textAlign: 'right', flexShrink: 0 }}>{count} kpl</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Add form */}
        {showForm && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px', marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, marginTop: 0, color: 'var(--text-heading)' }}>Lisää kulu</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Projekti</label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inp}>
                  <option value="">— Ei projektia —</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Päivämäärä</label>
                <input value={date} onChange={e => setDate(e.target.value)} type="date" style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Kategoria</label>
                <select value={category} onChange={e => setCategory(e.target.value)} style={inp}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Summa (€) *</label>
                <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" style={inp} placeholder="0,00" />
              </div>
              <div style={{ gridColumn: isMobile ? 'auto' : '1 / -1' }}>
                <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Kuvaus</label>
                <input value={description} onChange={e => setDescription(e.target.value)} style={inp} placeholder="Mistä kulu syntyi?" />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={addEntry} disabled={!amount || saving} style={{ background: amount && !saving ? 'linear-gradient(135deg,#7c3aed,#4f46e5)' : 'var(--surface-raised)', border: 'none', borderRadius: 8, padding: '9px 20px', color: amount && !saving ? '#fff' : 'var(--muted)', fontSize: 13, fontWeight: 600, cursor: amount && !saving ? 'pointer' : 'not-allowed' }}>{saving ? 'Tallennetaan…' : 'Tallenna'}</button>
              <button onClick={() => setShowForm(false)} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 20px', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>Peruuta</button>
            </div>
          </div>
        )}

        {/* Entries table */}
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
          {entries.length === 0 ? (
            <div style={{ padding: '48px', textAlign: 'center', color: 'var(--faint)', fontSize: 14 }}>
              Ei kulukirjauksia vielä. Lisää ensimmäinen kulu!
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[
                    { label: 'Päivämäärä', mob: false },
                    { label: 'Projekti',   mob: false },
                    { label: 'Kategoria',  mob: false },
                    { label: 'Kuvaus',     mob: true  },
                    { label: 'Summa',      mob: false },
                    { label: '',           mob: false },
                  ].map(({ label, mob }) => (
                    <th key={label} className={mob ? 'mob-hide' : ''} style={{ textAlign: 'left', padding: '12px 18px', color: 'var(--faint-strong)', fontWeight: 500, fontSize: 12 }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => {
                  const c = CAT_COLOR[e.category] || CAT_COLOR['Muu']
                  return (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '13px 18px', color: 'var(--muted)' }}>{e.date}</td>
                      <td style={{ padding: '13px 18px', fontWeight: 600, color: 'var(--text-soft)' }}>{e.projects?.name || '—'}</td>
                      <td style={{ padding: '13px 18px' }}>
                        <span style={{ fontSize: 11.5, padding: '3px 9px', borderRadius: 20, fontWeight: 600, background: c.bg, color: c.text, border: `1px solid ${c.border}` }}>
                          {e.category}
                        </span>
                      </td>
                      <td className="mob-hide" style={{ padding: '13px 18px', color: 'var(--muted)' }}>{e.description || '—'}</td>
                      <td style={{ padding: '13px 18px', color: '#f87171', fontWeight: 600 }}>−{e.amount.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €</td>
                      <td style={{ padding: '13px 18px' }}>
                        <button
                          onClick={() => deleteEntry(e.id)}
                          style={{ background: 'none', border: 'none', color: 'var(--faint)', cursor: 'pointer', fontSize: 13, padding: 0 }}
                          onMouseOver={ev => (ev.currentTarget.style.color = '#f87171')}
                          onMouseOut={ev => (ev.currentTarget.style.color = 'var(--faint)')}
                        >
                          Poista
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot>
                <tr style={{ borderTop: '2px solid var(--border)' }}>
                  <td colSpan={isMobile ? 3 : 4} style={{ padding: '12px 18px', fontSize: 13, fontWeight: 600, color: 'var(--text-soft)' }}>Yhteensä</td>
                  <td style={{ padding: '12px 18px', fontSize: 14, fontWeight: 700, color: '#f87171' }}>
                    −{totalAmount.toLocaleString('fi-FI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          )}
        </div>

      </main>
    </div>
  )
}
