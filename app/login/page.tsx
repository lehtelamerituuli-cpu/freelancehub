'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isRegister, setIsRegister] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit() {
    setLoading(true)
    setError('')

    if (isRegister) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) { setError(error.message); setLoading(false); return }
      setError('Tarkista sähköpostisi ja vahvista rekisteröinti!')
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('Väärä sähköposti tai salasana'); setLoading(false); return }
      router.push('/dashboard')
    }
    setLoading(false)
  }

  return (
    <main className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-8">
      <div className="bg-gray-900 rounded-2xl p-8 w-full max-w-sm">
        <h1 className="text-2xl font-bold mb-2">FreelanceHub</h1>
        <p className="text-gray-400 text-sm mb-8">{isRegister ? 'Luo uusi tili' : 'Kirjaudu sisään'}</p>

        <div className="mb-4">
          <label className="text-sm text-gray-400 mb-1 block">Sähköposti</label>
          <input
            value={email}
            onChange={e => setEmail(e.target.value)}
            type="email"
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm"
            placeholder="nimi@yritys.fi"
          />
        </div>

        <div className="mb-6">
          <label className="text-sm text-gray-400 mb-1 block">Salasana</label>
          <input
            value={password}
            onChange={e => setPassword(e.target.value)}
            type="password"
            className="w-full bg-gray-800 rounded-lg px-3 py-2 text-sm"
            placeholder="••••••••"
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
          />
        </div>

        {error && <p className="text-sm mb-4 text-center" style={{color: error.includes('Tarkista') ? '#4ade80' : '#f87171'}}>{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 py-2 rounded-lg font-medium transition mb-4 disabled:opacity-50"
        >
          {loading ? 'Hetki...' : isRegister ? 'Rekisteröidy' : 'Kirjaudu'}
        </button>

        <button
          onClick={() => { setIsRegister(!isRegister); setError('') }}
          className="w-full text-gray-400 hover:text-white text-sm transition"
        >
          {isRegister ? 'Onko sinulla jo tili? Kirjaudu' : 'Ei tiliä? Rekisteröidy'}
        </button>
      </div>
    </main>
  )
}