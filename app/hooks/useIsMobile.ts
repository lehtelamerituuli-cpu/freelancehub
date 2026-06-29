'use client'
import { useEffect, useState } from 'react'

export function useIsMobile(bp = 768) {
  const [is, setIs] = useState(false)
  useEffect(() => {
    const fn = () => setIs(window.innerWidth < bp)
    fn()
    window.addEventListener('resize', fn)
    return () => window.removeEventListener('resize', fn)
  }, [bp])
  return is
}
