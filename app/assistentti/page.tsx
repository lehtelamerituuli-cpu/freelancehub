'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/app/components/Sidebar'

type Role = 'user' | 'assistant'
type Msg = { role: Role; content: string; loading?: boolean }
type ProjectData = { projects: any[]; timeEntries: any[]; travelEntries: any[] }

const SUGGESTIONS = [
  'Mitkä projektit lähestyvät deadlinea?',
  'Onko jokin projekti ylittämässä budjetin?',
  'Paljonko minulla on laskuttamatonta työtä?',
  'Miten voin parantaa kannattavuuttani?',
]

function LoadingDots() {
  return (
    <span style={{ display: 'inline-flex', gap: 5, alignItems: 'center', padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            display: 'inline-block',
            width: 7, height: 7, borderRadius: '50%',
            background: 'var(--muted)',
            animation: `fh-pulse 1.3s ease-in-out ${i * 0.22}s infinite`,
          }}
        />
      ))}
    </span>
  )
}

function renderContent(text: string) {
  if (!text) return null
  const lines = text.split('\n')
  const elements: React.ReactNode[] = []

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    if (line.startsWith('### ')) {
      elements.push(
        <div key={i} style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginTop: elements.length > 0 ? 14 : 0, marginBottom: 4 }}>
          {renderInline(line.slice(4))}
        </div>
      )
    } else if (line.startsWith('## ')) {
      elements.push(
        <div key={i} style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginTop: elements.length > 0 ? 16 : 0, marginBottom: 6 }}>
          {renderInline(line.slice(3))}
        </div>
      )
    } else if (line.startsWith('**') && line.endsWith('**') && line.length > 4 && !line.slice(2, -2).includes('**')) {
      elements.push(
        <div key={i} style={{ fontWeight: 600, color: 'var(--text)', marginTop: 10, marginBottom: 2 }}>
          {line.slice(2, -2)}
        </div>
      )
    } else if (line.match(/^[-*] /)) {
      elements.push(
        <div key={i} style={{ display: 'flex', gap: 9, marginTop: 3 }}>
          <span style={{ color: '#a78bfa', flexShrink: 0, lineHeight: '1.65' }}>•</span>
          <span style={{ lineHeight: '1.65' }}>{renderInline(line.slice(2))}</span>
        </div>
      )
    } else if (line === '') {
      if (i > 0 && lines[i - 1] !== '') {
        elements.push(<div key={i} style={{ height: 8 }} />)
      }
    } else {
      elements.push(
        <div key={i} style={{ lineHeight: '1.65', marginTop: 1 }}>
          {renderInline(line)}
        </div>
      )
    }
  }

  return <>{elements}</>
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/\*\*(.*?)\*\*/g)
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? <strong key={i}>{part}</strong> : part
      )}
    </>
  )
}

const IconSend = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
  </svg>
)

const IconSparkle = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" opacity="0.9"/>
  </svg>
)

export default function Assistentti() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [projectData, setProjectData] = useState<ProjectData>({ projects: [], timeEntries: [], travelEntries: [] })
  const [dataReady, setDataReady] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const analysisStarted = useRef(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      loadData(data.user.id)
    })
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (dataReady && !analysisStarted.current) {
      analysisStarted.current = true
      runInitialAnalysis()
    }
  }, [dataReady])

  async function loadData(uid: string) {
    const [{ data: p }, { data: t }, { data: tr }] = await Promise.all([
      supabase.from('projects').select('*').eq('user_id', uid),
      supabase.from('time_entries').select('*').eq('user_id', uid),
      supabase.from('travel_entries').select('*').eq('user_id', uid),
    ])
    setProjectData({ projects: p || [], timeEntries: t || [], travelEntries: tr || [] })
    setDataReady(true)
  }

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  async function runInitialAnalysis() {
    setMessages([{ role: 'assistant', content: '', loading: true }])
    setBusy(true)
    await callAI(
      [{ role: 'user', content: 'Analysoi projektitilanteeni. Anna tärkeimmät huomiot budjeteista, deadlineista ja laskutuksesta. Ole ytimekäs.' }],
      true,
    )
    setBusy(false)
    inputRef.current?.focus()
  }

  async function sendMessage(content?: string) {
    const text = (content ?? input).trim()
    if (!text || busy) return
    setInput('')

    const next: Msg[] = [...messages, { role: 'user', content: text }]
    setMessages([...next, { role: 'assistant', content: '', loading: true }])
    setBusy(true)
    await callAI(next, false)
    setBusy(false)
    inputRef.current?.focus()
  }

  async function callAI(msgs: Msg[], initial: boolean) {
    try {
      const res = await fetch('/api/assistentti', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: msgs.map((m) => ({ role: m.role, content: m.content })),
          projectData,
        }),
      })

      if (!res.ok || !res.body) {
        const err = res.status === 500
          ? 'Virhe: AI-yhteys epäonnistui. Varmista että ANTHROPIC_API_KEY on asetettu .env.local-tiedostossa.'
          : 'Virhe: yhteys katkesi.'
        setMessages((prev) =>
          initial
            ? [{ role: 'assistant', content: err }]
            : [...prev.slice(0, -1), { role: 'assistant', content: err }]
        )
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let accumulated = ''

      setMessages((prev) =>
        initial
          ? [{ role: 'assistant', content: '' }]
          : [...prev.slice(0, -1), { role: 'assistant', content: '' }]
      )

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        accumulated += decoder.decode(value, { stream: true })
        const snap = accumulated
        setMessages((prev) =>
          initial
            ? [{ role: 'assistant', content: snap }]
            : [...prev.slice(0, -1), { role: 'assistant', content: snap }]
        )
      }
    } catch {
      const err = 'Virhe: yhteys katkesi.'
      setMessages((prev) =>
        initial
          ? [{ role: 'assistant', content: err }]
          : [...prev.slice(0, -1), { role: 'assistant', content: err }]
      )
    }
  }

  const showSuggestions =
    messages.length === 1 &&
    messages[0].role === 'assistant' &&
    !messages[0].loading &&
    messages[0].content.length > 0 &&
    !busy

  return (
    <div style={{ display: 'flex', height: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui,sans-serif', overflow: 'hidden' }}>
      {user && <Sidebar user={user} onLogout={logout} />}

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '18px 28px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0 }}>
            <IconSparkle />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.3px' }}>AI-apuri</h1>
            <p style={{ margin: 0, fontSize: 12.5, color: 'var(--muted)', marginTop: 1 }}>
              Analysoi projektidata ja vastaa kysymyksiisi suomeksi
            </p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(124,58,237,0.1)', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 8, padding: '5px 10px', fontSize: 11.5, color: '#a78bfa', fontWeight: 500 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80' }} />
            claude-sonnet-4-6
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', padding: '28px 28px 12px' }}>
          {!dataReady && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--muted)', fontSize: 14 }}>
              <LoadingDots />
              Ladataan projektidata...
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                alignItems: 'flex-start',
                marginBottom: 20,
                gap: 12,
              }}
            >
              {msg.role === 'assistant' && (
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, marginTop: 2 }}>
                  <IconSparkle />
                </div>
              )}

              <div style={{
                maxWidth: '76%',
                padding: msg.loading ? '12px 16px' : '14px 18px',
                borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '4px 16px 16px 16px',
                background: msg.role === 'user'
                  ? 'linear-gradient(135deg,#7c3aed,#4f46e5)'
                  : 'var(--surface)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--border)',
                color: msg.role === 'user' ? '#fff' : 'var(--text)',
                fontSize: 13.5,
              }}>
                {msg.loading
                  ? <LoadingDots />
                  : msg.role === 'user'
                    ? <span style={{ lineHeight: 1.6 }}>{msg.content}</span>
                    : renderContent(msg.content)
                }
              </div>

              {msg.role === 'user' && (
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', flexShrink: 0, fontSize: 13, fontWeight: 700, marginTop: 2 }}>
                  {user?.email?.[0]?.toUpperCase()}
                </div>
              )}
            </div>
          ))}

          <div ref={bottomRef} />
        </div>

        {/* Suggestion chips */}
        {showSuggestions && (
          <div style={{ padding: '0 28px 14px', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => sendMessage(s)}
                style={{
                  background: 'var(--surface)', border: '1px solid var(--border)',
                  borderRadius: 20, padding: '7px 14px',
                  color: 'var(--text-soft)', fontSize: 12.5, cursor: 'pointer',
                  transition: 'border-color .15s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.borderColor = '#7c3aed')}
                onMouseOut={(e) => (e.currentTarget.style.borderColor = 'var(--border)')}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Input bar */}
        <div style={{ padding: '14px 28px 22px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  sendMessage()
                }
              }}
              placeholder="Kysy jotain projekteistasi..."
              disabled={busy || !dataReady}
              style={{
                flex: 1, background: 'var(--surface)',
                border: '1px solid var(--border)', borderRadius: 14,
                padding: '13px 18px', color: 'var(--text)',
                fontSize: 14, fontFamily: 'system-ui',
                outline: 'none', resize: 'none',
                opacity: busy || !dataReady ? 0.6 : 1,
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={busy || !input.trim() || !dataReady}
              style={{
                background: busy || !input.trim() ? 'var(--surface)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
                border: busy || !input.trim() ? '1px solid var(--border)' : 'none',
                borderRadius: 14, padding: '13px 20px',
                color: busy || !input.trim() ? 'var(--muted)' : '#fff',
                cursor: busy || !input.trim() ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 7,
                fontSize: 14, fontWeight: 600, flexShrink: 0,
                transition: 'background .15s',
              }}
            >
              <IconSend />
              Lähetä
            </button>
          </div>
          <div style={{ marginTop: 8, fontSize: 11.5, color: 'var(--faint)', textAlign: 'center' }}>
            Enter lähettää · Shift+Enter uusi rivi
          </div>
        </div>
      </main>
    </div>
  )
}
