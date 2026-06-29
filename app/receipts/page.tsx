'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/app/components/Sidebar'
import { useIsMobile } from '@/app/hooks/useIsMobile'

const CATEGORIES = ['Materiaali', 'Kalusto', 'Kuljetus', 'Ruoka', 'Muu']

const CAT_COLOR: Record<string, { bg: string; color: string }> = {
  Materiaali: { bg: 'rgba(96,165,250,0.13)',  color: '#60a5fa' },
  Kalusto:    { bg: 'rgba(167,139,250,0.13)', color: '#a78bfa' },
  Kuljetus:   { bg: 'rgba(52,211,153,0.13)',  color: '#34d399' },
  Ruoka:      { bg: 'rgba(251,191,36,0.13)',  color: '#fbbf24' },
  Muu:        { bg: 'rgba(156,163,175,0.13)', color: '#9ca3af' },
}

export default function Receipts() {
  const router = useRouter()
  const isMobile = useIsMobile()
  const fileRef = useRef<HTMLInputElement>(null)

  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [receipts, setReceipts] = useState<any[]>([])
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  const [projectId, setProjectId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [category, setCategory] = useState(CATEGORIES[0])
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      supabase.from('projects').select('*').eq('user_id', data.user.id).order('name').then(({ data: d }) => {
        setProjects(d || [])
        if (d && d.length > 0) setProjectId(d[0].id)
      })
      loadReceipts(data.user.id)
    })
  }, [])

  async function loadReceipts(uid: string) {
    const { data, error: err } = await supabase
      .from('receipts')
      .select('*, projects(name)')
      .eq('user_id', uid)
      .order('date', { ascending: false })
    if (err) { setError(err.message); return }
    setReceipts(data || [])
  }

  async function addReceipt() {
    if (!amount || !user) return
    setSaving(true)
    setError(null)

    let imageUrl: string | null = null
    const file = fileRef.current?.files?.[0]
    if (file) {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${user.id}/${Date.now()}.${ext}`
      const { error: uploadErr } = await supabase.storage.from('receipts').upload(path, file)
      if (uploadErr) {
        setError('Kuvan lataus epäonnistui: ' + uploadErr.message)
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('receipts').getPublicUrl(path)
      imageUrl = urlData.publicUrl
    }

    const { error: insertErr } = await supabase.from('receipts').insert({
      user_id: user.id,
      project_id: projectId || null,
      date,
      category,
      description,
      amount: parseFloat(amount),
      image_url: imageUrl,
    })

    if (insertErr) {
      setError(insertErr.message)
      setSaving(false)
      return
    }

    setAmount(''); setDescription(''); setPreviewUrl(null)
    if (fileRef.current) fileRef.current.value = ''
    setShowForm(false)
    setSaving(false)
    loadReceipts(user.id)
  }

  async function deleteReceipt(id: string) {
    await supabase.from('receipts').delete().eq('id', id)
    loadReceipts(user.id)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const totalAmount = receipts.reduce((s, r) => s + Number(r.amount), 0)

  // group by project
  const grouped: Record<string, { name: string; items: any[] }> = {}
  for (const r of receipts) {
    const key = r.project_id || '__none__'
    const name = r.projects?.name || 'Ei projektia'
    if (!grouped[key]) grouped[key] = { name, items: [] }
    grouped[key].items.push(r)
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '9px 13px', color: 'var(--text-soft)',
    fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui,sans-serif' }}>
      {user && <Sidebar user={user} onLogout={logout} />}
      <main style={{ flex: 1, padding: isMobile ? '72px 16px 24px' : '32px 36px', overflow: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)' }}>Kuitti- ja tositearkisto</h1>
            <p style={{ color: 'var(--muted-strong)', marginTop: 5, fontSize: 13.5 }}>
              {receipts.length} kuittia · {totalAmount.toFixed(2)} € yhteensä
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 10, padding: '10px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
          >
            + Lisää kuitti
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '12px 16px', marginBottom: 16, color: '#f87171', fontSize: 13 }}>
            {error}
          </div>
        )}

        {showForm && (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: 24, marginBottom: 16 }}>
            <h2 style={{ fontSize: 14, fontWeight: 600, marginBottom: 18, marginTop: 0, color: 'var(--text-heading)' }}>Lisää kuitti</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 16 }}>
              <div>
                <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Projekti</label>
                <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inp}>
                  <option value="">Ei projektia</option>
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
                <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Summa (€)</label>
                <input value={amount} onChange={e => setAmount(e.target.value)} type="number" step="0.01" style={inp} placeholder="0.00" />
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1/-1' }}>
                <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Kuvaus</label>
                <input value={description} onChange={e => setDescription(e.target.value)} style={inp} placeholder="Mitä ostit?" />
              </div>
              <div style={{ gridColumn: isMobile ? '1' : '1/-1' }}>
                <label style={{ fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500 }}>Kuva kuitista (valinnainen)</label>
                <div
                  style={{ border: '2px dashed var(--border)', borderRadius: 10, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'border-color 0.2s' }}
                  onClick={() => fileRef.current?.click()}
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => {
                    e.preventDefault()
                    const f = e.dataTransfer.files[0]
                    if (f && fileRef.current) {
                      const dt = new DataTransfer(); dt.items.add(f)
                      fileRef.current.files = dt.files
                      setPreviewUrl(URL.createObjectURL(f))
                    }
                  }}
                >
                  {previewUrl ? (
                    <img src={previewUrl} alt="esikatselu" style={{ maxHeight: 160, maxWidth: '100%', borderRadius: 8, objectFit: 'contain' }} />
                  ) : (
                    <div style={{ color: 'var(--faint)', fontSize: 13 }}>
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 8px', display: 'block', opacity: 0.5 }} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                      Klikkaa tai pudota kuva tähän
                    </div>
                  )}
                </div>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const f = e.target.files?.[0]
                    if (f) setPreviewUrl(URL.createObjectURL(f))
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={addReceipt}
                disabled={saving || !amount}
                style={{ background: saving ? 'var(--surface-raised)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 8, padding: '9px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer' }}
              >
                {saving ? 'Tallennetaan...' : 'Tallenna kuitti'}
              </button>
              <button onClick={() => { setShowForm(false); setPreviewUrl(null); setError(null) }} style={{ background: 'var(--surface-raised)', border: '1px solid var(--border)', borderRadius: 8, padding: '9px 20px', color: 'var(--muted)', fontSize: 13, cursor: 'pointer' }}>Peruuta</button>
            </div>
          </div>
        )}

        {receipts.length === 0 ? (
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '56px 24px', textAlign: 'center' }}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ margin: '0 auto 12px', display: 'block', opacity: 0.25 }} strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <p style={{ color: 'var(--faint)', fontSize: 14, margin: 0 }}>Ei kuitteja vielä. Lisää ensimmäinen kuitti yllä olevalla napilla.</p>
          </div>
        ) : (
          Object.entries(grouped).map(([key, { name, items }]) => (
            <div key={key} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 13, fontWeight: 600, color: 'var(--muted-strong)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{name}</h3>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border)' }}>
                      {[
                        { label: 'Päivämäärä', mob: false },
                        { label: 'Kategoria',  mob: false },
                        { label: 'Kuvaus',     mob: true  },
                        { label: 'Kuva',       mob: true  },
                        { label: 'Summa',      mob: false },
                        { label: '',           mob: false },
                      ].map(({ label, mob }) => (
                        <th key={label} className={mob ? 'mob-hide' : ''} style={{ textAlign: 'left', padding: '11px 16px', color: 'var(--faint-strong)', fontWeight: 500, fontSize: 12 }}>{label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map(r => {
                      const cc = CAT_COLOR[r.category] || CAT_COLOR['Muu']
                      return (
                        <tr key={r.id} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                          <td style={{ padding: '12px 16px', color: 'var(--muted)' }}>{r.date}</td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ background: cc.bg, color: cc.color, borderRadius: 6, padding: '3px 9px', fontSize: 12, fontWeight: 500 }}>
                              {r.category}
                            </span>
                          </td>
                          <td className="mob-hide" style={{ padding: '12px 16px', color: 'var(--muted)' }}>{r.description || '—'}</td>
                          <td className="mob-hide" style={{ padding: '12px 16px' }}>
                            {r.image_url ? (
                              <img
                                src={r.image_url}
                                alt="kuitti"
                                style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 6, cursor: 'pointer', border: '1px solid var(--border)' }}
                                onClick={() => setLightboxUrl(r.image_url)}
                              />
                            ) : <span style={{ color: 'var(--faint)', fontSize: 12 }}>—</span>}
                          </td>
                          <td style={{ padding: '12px 16px', color: '#a78bfa', fontWeight: 600 }}>{Number(r.amount).toFixed(2)} €</td>
                          <td style={{ padding: '12px 16px' }}>
                            <button
                              onClick={() => deleteReceipt(r.id)}
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
                    <tr style={{ borderTop: '1px solid var(--border)' }}>
                      <td colSpan={isMobile ? 3 : 6} style={{ padding: '11px 16px', textAlign: 'right', fontWeight: 600, color: '#a78bfa', fontSize: 13 }}>
                        {items.reduce((s, r) => s + Number(r.amount), 0).toFixed(2)} €
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))
        )}
      </main>

      {lightboxUrl && (
        <div
          onClick={() => setLightboxUrl(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'zoom-out' }}
        >
          <img src={lightboxUrl} alt="kuitti" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 10, objectFit: 'contain', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }} />
        </div>
      )}
    </div>
  )
}
