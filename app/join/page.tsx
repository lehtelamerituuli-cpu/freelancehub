'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

function JoinContent() {
  const params = useSearchParams()
  const router = useRouter()
  const token = params.get('token')
  const [status, setStatus] = useState<'waiting' | 'joining' | 'success' | 'error'>('waiting')
  const [message, setMessage] = useState('Odotetaan kirjautumista...')
  const [teamName, setTeamName] = useState('')

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session) {
        if (!token) {
          setStatus('error')
          setMessage('Kutsukoodi puuttuu URL:sta.')
          return
        }
        setStatus('joining')
        setMessage('Liitytään tiimiin...')
        try {
          const res = await fetch('/api/team/join', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`,
            },
            body: JSON.stringify({ token }),
          })
          const data = await res.json()
          if (!res.ok) {
            setStatus('error')
            setMessage(data.error || 'Jokin meni pieleen.')
          } else {
            setTeamName(data.teamName || '')
            setStatus('success')
            setMessage('Liityit tiimiin onnistuneesti!')
            setTimeout(() => router.push('/dashboard'), 2500)
          }
        } catch {
          setStatus('error')
          setMessage('Verkkovirhe. Yritä uudelleen.')
        }
      }
    })
    return () => subscription.unsubscribe()
  }, [token, router])

  const icon = status === 'success' ? '✓' : status === 'error' ? '✕' : '⏳'
  const color = status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : 'var(--accent)'

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      padding: '1rem',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '2.5rem 2rem',
        maxWidth: 380,
        width: '100%',
        textAlign: 'center',
      }}>
        <div style={{ fontSize: 48, marginBottom: '1rem', color }}>{icon}</div>
        <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--text)', marginBottom: '0.75rem' }}>
          {status === 'success' ? `Tervetuloa${teamName ? ` tiimiin ${teamName}` : ''}!` : 'Tiimikutsu'}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>{message}</p>
        {status === 'success' && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Sinut ohjataan etusivulle hetken kuluttua...
          </p>
        )}
        {status === 'error' && (
          <button
            onClick={() => router.push('/login')}
            style={{
              marginTop: '1.5rem',
              padding: '0.6rem 1.5rem',
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Kirjaudu sisään
          </button>
        )}
      </div>
    </div>
  )
}

export default function JoinPage() {
  return (
    <Suspense>
      <JoinContent />
    </Suspense>
  )
}
