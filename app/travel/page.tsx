'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/app/components/Sidebar'
import { useIsMobile } from '@/app/hooks/useIsMobile'

export default function Travel() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [entries, setEntries] = useState<any[]>([])
  const [projectId, setProjectId] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [route, setRoute] = useState('')
  const [km, setKm] = useState('')
  const isMobile = useIsMobile()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      supabase.from('projects').select('*').eq('user_id', data.user.id).then(({ data: d }) => {
        setProjects(d || [])
        if (d && d.length > 0) setProjectId(d[0].id)
      })
      loadEntries(data.user.id)
    })
  }, [])

  async function loadEntries(uid: string) {
    const { data } = await supabase.from('travel_entries').select('*, projects(name)').eq('user_id', uid).order('date', { ascending: false })
    setEntries(data || [])
  }

  async function addEntry() {
    if (!route || !km || !user) return
    await supabase.from('travel_entries').insert({ project_id: projectId, date, route, km: parseFloat(km), user_id: user.id })
    setRoute(''); setKm('')
    loadEntries(user.id)
  }

  async function deleteEntry(id: string) {
    await supabase.from('travel_entries').delete().eq('id', id)
    loadEntries(user.id)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const totalKm = entries.reduce((s, e) => s + e.km, 0)
  const totalComp = totalKm * 0.25

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '9px 13px', color: 'var(--text-soft)',
    fontSize: 13, fontFamily: 'system-ui', boxSizing: 'border-box',
  }

  return (
    <div style={{display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui,sans-serif'}}>
      {user && <Sidebar user={user} onLogout={logout} />}
      <main style={{flex: 1, padding: isMobile ? '72px 16px 24px' : '32px 36px', overflow: 'auto'}}>

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28}}>
          <div>
            <h1 style={{fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)'}}>Matkat</h1>
            <p style={{color: 'var(--muted-strong)', marginTop: 5, fontSize: 13.5}}>
              {totalKm} km yhteensä · {totalComp.toFixed(2)} € korvauksia
            </p>
          </div>
        </div>

        <div style={{display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 20}}>
          <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px'}}>
            <div style={{fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 14}}>Kilometrit yhteensä</div>
            <div style={{fontSize: 30, fontWeight: 700, color: 'var(--text)'}}>{totalKm} km</div>
            <div style={{fontSize: 12, color: 'var(--faint)', marginTop: 8}}>{entries.length} matkakirjausta</div>
          </div>
          <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px'}}>
            <div style={{fontSize: 12, color: 'var(--muted)', fontWeight: 500, marginBottom: 14}}>Korvaus yhteensä</div>
            <div style={{fontSize: 30, fontWeight: 700, color: '#a78bfa'}}>{totalComp.toFixed(2)} €</div>
            <div style={{fontSize: 12, color: 'var(--faint)', marginTop: 8}}>0,25 € / km</div>
          </div>
        </div>

        <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '24px', marginBottom: 16}}>
          <h2 style={{fontSize: 14, fontWeight: 600, marginBottom: 18, marginTop: 0, color: 'var(--text-heading)'}}>Lisää matka</h2>
          <div style={{display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 16}}>
            <div>
              <label style={{fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500}}>Projekti</label>
              <select value={projectId} onChange={e => setProjectId(e.target.value)} style={inp}>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500}}>Päivämäärä</label>
              <input value={date} onChange={e => setDate(e.target.value)} type="date" style={inp} />
            </div>
            <div>
              <label style={{fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500}}>Reitti</label>
              <input value={route} onChange={e => setRoute(e.target.value)} style={inp} placeholder="Helsinki -> Espoo" />
            </div>
            <div>
              <label style={{fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500}}>Kilometrit</label>
              <input value={km} onChange={e => setKm(e.target.value)} type="number" style={inp} placeholder="0" />
            </div>
          </div>
          <button
            onClick={addEntry}
            style={{background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', border: 'none', borderRadius: 8, padding: '9px 20px', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer'}}
          >
            Lisää matka
          </button>
        </div>

        <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden'}}>
          {entries.length === 0 ? (
            <div style={{padding: '48px', textAlign: 'center', color: 'var(--faint)', fontSize: 14}}>Ei matkakirjauksia vielä.</div>
          ) : (
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
              <thead>
                <tr style={{borderBottom: '1px solid var(--border)'}}>
                  {[
                    { label: 'Päivämäärä', mob: false },
                    { label: 'Projekti',   mob: false },
                    { label: 'Reitti',     mob: true  },
                    { label: 'km',         mob: false },
                    { label: 'Korvaus',    mob: false },
                    { label: '',           mob: false },
                  ].map(({ label, mob }) => (
                    <th key={label} className={mob ? 'mob-hide' : ''} style={{textAlign: 'left', padding: '12px 18px', color: 'var(--faint-strong)', fontWeight: 500, fontSize: 12}}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} style={{borderBottom: '1px solid var(--border-subtle)'}}>
                    <td style={{padding: '13px 18px', color: 'var(--muted)'}}>{e.date}</td>
                    <td style={{padding: '13px 18px', fontWeight: 600, color: 'var(--text-soft)'}}>{e.projects?.name}</td>
                    <td className="mob-hide" style={{padding: '13px 18px', color: 'var(--muted)'}}>{e.route}</td>
                    <td style={{padding: '13px 18px', color: 'var(--text-soft)'}}>{e.km} km</td>
                    <td style={{padding: '13px 18px', color: '#a78bfa', fontWeight: 600}}>{(e.km * 0.25).toFixed(2)} €</td>
                    <td style={{padding: '13px 18px'}}>
                      <button
                        onClick={() => deleteEntry(e.id)}
                        style={{background: 'none', border: 'none', color: 'var(--faint)', cursor: 'pointer', fontSize: 13, padding: 0}}
                        onMouseOver={ev => (ev.currentTarget.style.color = '#f87171')}
                        onMouseOut={ev => (ev.currentTarget.style.color = 'var(--faint)')}
                      >
                        Poista
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  )
}
