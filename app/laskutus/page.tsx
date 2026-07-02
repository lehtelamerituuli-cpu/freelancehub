'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { Sidebar } from '@/app/components/Sidebar'
import { KM_RATE } from '@/lib/config'

const SELLER_KEY = 'fh_seller_info'

export default function Laskutus() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [timeEntries, setTimeEntries] = useState<any[]>([])
  const [travelEntries, setTravelEntries] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all')
  const [invoiceNumber, setInvoiceNumber] = useState<string>('')
  const [generating, setGenerating] = useState(false)
  const [vatRate, setVatRate] = useState(0.255)

  // Laskuttajan tiedot
  const [sellerName, setSellerName] = useState('')
  const [sellerAddress, setSellerAddress] = useState('')
  const [sellerCity, setSellerCity] = useState('')
  const [sellerYtunnus, setSellerYtunnus] = useState('')
  const [sellerEmail, setSellerEmail] = useState('')
  const [sellerPhone, setSellerPhone] = useState('')
  const [sellerIban, setSellerIban] = useState('')
  const [viite, setViite] = useState('')

  // Asiakkaan tiedot
  const [buyerName, setBuyerName] = useState('')
  const [buyerAddress, setBuyerAddress] = useState('')
  const [buyerCity, setBuyerCity] = useState('')
  const [buyerYtunnus, setBuyerYtunnus] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.push('/login'); return }
      setUser(data.user)
      setSellerEmail(data.user.email || '')
      loadData(data.user.id)
    })
    const now = new Date()
    const yy = now.getFullYear()
    const mm = String(now.getMonth() + 1).padStart(2, '0')
    const dd = String(now.getDate()).padStart(2, '0')
    const ts = String(now.getTime()).slice(-3)
    setInvoiceNumber(`INV-${yy}${mm}${dd}-${ts}`)
    // Laske suomalainen viitenumero
    const base = `${yy}${mm}${dd}${ts}`
    setViite(calcViite(base))

    try {
      const saved = localStorage.getItem(SELLER_KEY)
      if (saved) {
        const s = JSON.parse(saved)
        if (s.name) setSellerName(s.name)
        if (s.address) setSellerAddress(s.address)
        if (s.city) setSellerCity(s.city)
        if (s.ytunnus) setSellerYtunnus(s.ytunnus)
        if (s.phone) setSellerPhone(s.phone)
        if (s.iban) setSellerIban(s.iban)
      }
    } catch {}
  }, [])

  function calcViite(base: string): string {
    const digits = base.replace(/\D/g, '')
    const weights = [7, 3, 1]
    let sum = 0
    for (let i = 0; i < digits.length; i++) {
      sum += parseInt(digits[digits.length - 1 - i]) * weights[i % 3]
    }
    const tarkiste = (10 - (sum % 10)) % 10
    return digits + tarkiste
  }

  function saveSellerInfo() {
    try {
      localStorage.setItem(SELLER_KEY, JSON.stringify({
        name: sellerName, address: sellerAddress, city: sellerCity,
        ytunnus: sellerYtunnus, phone: sellerPhone, iban: sellerIban,
      }))
    } catch {}
  }

  async function loadData(uid: string) {
    const [{ data: p }, { data: t }, { data: tr }] = await Promise.all([
      supabase.from('projects').select('*').order('name'),
      supabase.from('time_entries').select('*, projects(name,client)').eq('user_id', uid).order('date'),
      supabase.from('travel_entries').select('*, projects(name,client)').eq('user_id', uid).order('date'),
    ])
    setProjects(p || [])
    setTimeEntries(t || [])
    setTravelEntries(tr || [])
    if (p && p.length > 0) {
      const first = p[0]
      if (first.client) setBuyerName(first.client)
    }
  }

  useEffect(() => {
    const proj = projects.find(p => p.id === selectedProjectId)
    if (proj?.client) setBuyerName(proj.client)
  }, [selectedProjectId, projects])

  async function logout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const selectedProject = projects.find(p => p.id === selectedProjectId)
  const filteredTime = selectedProjectId === 'all' ? timeEntries : timeEntries.filter(e => e.project_id === selectedProjectId)
  const filteredTravel = selectedProjectId === 'all' ? travelEntries : travelEntries.filter(e => e.project_id === selectedProjectId)

  const totalHours = filteredTime.reduce((s, e) => s + e.hours, 0)
  const totalIncome = filteredTime.reduce((s, e) => s + e.hours * e.rate, 0)
  const totalKm = filteredTravel.reduce((s, e) => s + e.km, 0)
  const totalTravel = totalKm * KM_RATE
  const grandTotal = totalIncome + totalTravel
  const vatAmount = grandTotal * vatRate
  const grossTotal = grandTotal + vatAmount

  async function downloadPDF() {
    saveSellerInfo()
    setGenerating(true)
    // Tallenna lasku tietokantaan
    const { data: { session } } = await supabase.auth.getSession()
    if (session) {
      await supabase.from('invoices').insert({
        user_id: session.user.id,
        invoice_number: invoiceNumber,
        project_name: selectedProject ? selectedProject.name : 'Kaikki projektit',
        buyer_name: buyerName,
        buyer_ytunnus: buyerYtunnus,
        total_netto: grandTotal,
        total_vat: vatAmount,
        total_brutto: grossTotal,
        vat_rate: vatRate,
        status: 'lähetetty',
      })
    }
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      const now = new Date()
      const dateStr = now.toLocaleDateString('fi-FI')
      const due = new Date(now)
      due.setDate(due.getDate() + 14)
      const dueDateStr = due.toLocaleDateString('fi-FI')
      const projectName = selectedProject ? selectedProject.name : 'Kaikki projektit'

      // Header
      doc.setFillColor(124, 58, 237)
      doc.rect(0, 0, 210, 38, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(28)
      doc.setTextColor(255, 255, 255)
      doc.text('LASKU', 20, 24)
      doc.setFontSize(10)
      doc.setFont('helvetica', 'normal')
      doc.text(invoiceNumber, 190, 14, { align: 'right' })
      doc.text('Päivämäärä: ' + dateStr, 190, 22, { align: 'right' })
      doc.text('Eräpäivä: ' + dueDateStr, 190, 30, { align: 'right' })

      // Laskuttaja & Asiakas
      let y = 48
      doc.setTextColor(40, 40, 70)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text('LASKUTTAJA', 20, y)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(20, 20, 50)
      y += 6
      if (sellerName) { doc.text(sellerName, 20, y); y += 5 }
      if (sellerAddress) { doc.text(sellerAddress, 20, y); y += 5 }
      if (sellerCity) { doc.text(sellerCity, 20, y); y += 5 }
      if (sellerYtunnus) { doc.text('Y-tunnus: ' + sellerYtunnus, 20, y); y += 5 }
      if (sellerEmail) { doc.text(sellerEmail, 20, y); y += 5 }
      if (sellerPhone) { doc.text(sellerPhone, 20, y); y += 5 }

      let y2 = 54
      doc.setTextColor(40, 40, 70)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8)
      doc.text('ASIAKAS', 110, 48)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(20, 20, 50)
      if (buyerName) { doc.text(buyerName, 110, y2); y2 += 5 }
      if (buyerAddress) { doc.text(buyerAddress, 110, y2); y2 += 5 }
      if (buyerCity) { doc.text(buyerCity, 110, y2); y2 += 5 }
      if (buyerYtunnus) { doc.text('Y-tunnus: ' + buyerYtunnus, 110, y2); y2 += 5 }

      y = Math.max(y, y2) + 6

      // Projekti-banneri
      doc.setFillColor(237, 233, 254)
      doc.rect(20, y, 170, 10, 'F')
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9)
      doc.setTextColor(79, 46, 180)
      doc.text('Projekti: ' + projectName, 25, y + 7)
      doc.setFont('helvetica', 'normal')
      doc.setTextColor(100, 80, 170)
      doc.text('Maksuehto: 14 päivää netto', 188, y + 7, { align: 'right' })
      y += 16

      const checkPage = () => { if (y > 250) { doc.addPage(); y = 20 } }

      const drawHeader = (cols: { label: string, x: number, align?: 'right' }[]) => {
        doc.setFillColor(50, 30, 100)
        doc.rect(20, y, 170, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(8)
        cols.forEach(c => {
          if (c.align === 'right') doc.text(c.label, c.x, y + 5.5, { align: 'right' })
          else doc.text(c.label, c.x, y + 5.5)
        })
        y += 8
      }

      // Aikakirjaukset
      if (filteredTime.length > 0) {
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(20, 20, 50)
        doc.text('Aikakirjaukset', 20, y)
        y += 6
        drawHeader([
          { label: 'Pvm', x: 23 }, { label: 'Projekti', x: 48 }, { label: 'Kuvaus', x: 90 },
          { label: 'Tunnit', x: 148, align: 'right' }, { label: 'e/h', x: 166, align: 'right' }, { label: 'Summa', x: 188, align: 'right' },
        ])
        filteredTime.forEach((e, i) => {
          checkPage()
          if (i % 2 === 0) { doc.setFillColor(248, 245, 255); doc.rect(20, y, 170, 7, 'F') }
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(40, 40, 70)
          doc.text(e.date, 23, y + 5)
          doc.text(e.projects?.name || '', 48, y + 5, { maxWidth: 38 })
          doc.text(e.description || '', 90, y + 5, { maxWidth: 54 })
          doc.text(String(e.hours), 148, y + 5, { align: 'right' })
          doc.text(String(e.rate), 166, y + 5, { align: 'right' })
          doc.setFont('helvetica', 'bold')
          doc.text((e.hours * e.rate).toFixed(2) + ' EUR', 188, y + 5, { align: 'right' })
          y += 7
        })
        doc.setDrawColor(180, 160, 230); doc.line(20, y, 190, y); y += 5
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(79, 46, 180)
        doc.text('Aikakirjaukset yhteensa:', 120, y)
        doc.text(totalIncome.toFixed(2) + ' EUR', 188, y, { align: 'right' })
        y += 12
      }

      // Matkakirjaukset
      if (filteredTravel.length > 0) {
        checkPage()
        doc.setFont('helvetica', 'bold'); doc.setFontSize(11); doc.setTextColor(20, 20, 50)
        doc.text('Matkakirjaukset', 20, y); y += 6
        drawHeader([
          { label: 'Pvm', x: 23 }, { label: 'Reitti', x: 48 },
          { label: 'km', x: 148, align: 'right' }, { label: 'e/km', x: 166, align: 'right' }, { label: 'Summa', x: 188, align: 'right' },
        ])
        filteredTravel.forEach((e, i) => {
          checkPage()
          if (i % 2 === 0) { doc.setFillColor(248, 245, 255); doc.rect(20, y, 170, 7, 'F') }
          doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(40, 40, 70)
          doc.text(e.date, 23, y + 5)
          doc.text((e.route || '').replace(/→/g, '->'), 48, y + 5, { maxWidth: 95 })
          doc.text(String(e.km), 148, y + 5, { align: 'right' })
          doc.text(KM_RATE.toFixed(2), 166, y + 5, { align: 'right' })
          doc.setFont('helvetica', 'bold')
          doc.text((e.km * KM_RATE).toFixed(2) + ' EUR', 188, y + 5, { align: 'right' })
          y += 7
        })
        doc.setDrawColor(180, 160, 230); doc.line(20, y, 190, y); y += 5
        doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(79, 46, 180)
        doc.text('Matkakorvaukset yhteensa:', 120, y)
        doc.text(totalTravel.toFixed(2) + ' EUR', 188, y, { align: 'right' })
        y += 14
      }

      // ALV-erittely & loppusumma
      checkPage()
      doc.setDrawColor(200, 185, 240); doc.line(110, y, 190, y); y += 4

      doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(80, 80, 120)
      doc.text('Veroton hinta (netto):', 115, y)
      doc.text(grandTotal.toFixed(2) + ' EUR', 188, y, { align: 'right' })
      y += 6

      const vatLabel = vatRate === 0 ? 'ALV 0 % (veroton)' : `ALV ${(vatRate * 100).toFixed(1).replace('.', ',')} %`
      doc.text(vatLabel + ':', 115, y)
      doc.text(vatAmount.toFixed(2) + ' EUR', 188, y, { align: 'right' })
      y += 8

      doc.setFillColor(124, 58, 237)
      doc.rect(110, y, 80, 14, 'F')
      doc.setTextColor(255, 255, 255); doc.setFont('helvetica', 'bold'); doc.setFontSize(12)
      doc.text('YHTEENSA:', 115, y + 9.5)
      doc.text(grossTotal.toFixed(2) + ' EUR', 187, y + 9.5, { align: 'right' })
      y += 20

      // Maksutiedot
      if (sellerIban || viite) {
        doc.setFillColor(245, 243, 255)
        doc.rect(20, y, 170, viite && sellerIban ? 20 : 14, 'F')
        doc.setFont('helvetica', 'bold'); doc.setFontSize(8); doc.setTextColor(79, 46, 180)
        doc.text('MAKSUTIEDOT', 25, y + 6)
        doc.setFont('helvetica', 'normal'); doc.setFontSize(10); doc.setTextColor(20, 20, 50)
        if (sellerIban) { doc.text('IBAN: ' + sellerIban, 25, y + 13) }
        if (viite) { doc.text('Viitenumero: ' + viite, sellerIban ? 110 : 25, y + 13) }
        y += viite && sellerIban ? 26 : 20
      }

      // Alatunniste
      const pages = doc.getNumberOfPages()
      for (let i = 1; i <= pages; i++) {
        doc.setPage(i)
        doc.setDrawColor(200, 185, 240); doc.line(20, 278, 190, 278)
        doc.setFontSize(8); doc.setTextColor(150, 150, 175)
        doc.text('Luotu ProjektFlow-sovelluksella', 105, 284, { align: 'center' })
        if (pages > 1) doc.text(`Sivu ${i} / ${pages}`, 190, 284, { align: 'right' })
      }

      doc.save(`lasku-${invoiceNumber}.pdf`)
    } finally {
      setGenerating(false)
    }
  }

  const inp: React.CSSProperties = {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '9px 13px', color: 'var(--text-soft)',
    fontSize: 13, fontFamily: 'system-ui', boxSizing: 'border-box',
  }
  const label: React.CSSProperties = {
    fontSize: 11.5, color: 'var(--muted-strong)', display: 'block', marginBottom: 6, fontWeight: 500,
  }

  return (
    <div style={{display: 'flex', minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'system-ui,sans-serif'}}>
      {user && <Sidebar user={user} onLogout={logout} />}
      <main style={{flex: 1, padding: '32px 36px', overflow: 'auto', maxWidth: 960}}>

        <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28}}>
          <div>
            <h1 style={{fontSize: 26, fontWeight: 700, margin: 0, color: 'var(--text)'}}>Laskutus</h1>
            <p style={{color: 'var(--muted-strong)', marginTop: 5, fontSize: 13.5}}>Luo ja lataa PDF-lasku projektikohtaisesti</p>
          </div>
          <button
            onClick={downloadPDF}
            disabled={generating || grandTotal === 0}
            style={{
              background: grandTotal === 0 ? 'var(--surface)' : 'linear-gradient(135deg,#7c3aed,#4f46e5)',
              border: grandTotal === 0 ? '1px solid var(--border)' : 'none',
              borderRadius: 10, padding: '11px 22px',
              color: grandTotal === 0 ? 'var(--faint-strong)' : '#fff',
              fontSize: 13, fontWeight: 600,
              cursor: grandTotal === 0 ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            {generating ? 'Luodaan...' : 'Lataa PDF-lasku'}
          </button>
        </div>

        {/* Laskuttajan tiedot */}
        <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', marginBottom: 16}}>
          <div style={{fontSize: 12, color: 'var(--muted-strong)', fontWeight: 600, marginBottom: 16}}>LASKUTTAJAN TIEDOT <span style={{fontWeight: 400, color: 'var(--faint)'}}>(tallennetaan automaattisesti)</span></div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14}}>
            <div><label style={label}>Koko nimi *</label><input value={sellerName} onChange={e => setSellerName(e.target.value)} style={inp} placeholder="Etunimi Sukunimi" /></div>
            <div><label style={label}>Katuosoite *</label><input value={sellerAddress} onChange={e => setSellerAddress(e.target.value)} style={inp} placeholder="Esimerkkikatu 1" /></div>
            <div><label style={label}>Postinumero ja kaupunki *</label><input value={sellerCity} onChange={e => setSellerCity(e.target.value)} style={inp} placeholder="00100 Helsinki" /></div>
            <div><label style={label}>Y-tunnus *</label><input value={sellerYtunnus} onChange={e => setSellerYtunnus(e.target.value)} style={inp} placeholder="1234567-8" /></div>
            <div><label style={label}>Sähköposti</label><input value={sellerEmail} onChange={e => setSellerEmail(e.target.value)} style={inp} placeholder="nimi@esimerkki.fi" /></div>
            <div><label style={label}>Puhelin</label><input value={sellerPhone} onChange={e => setSellerPhone(e.target.value)} style={inp} placeholder="+358 40 1234567" /></div>
            <div style={{gridColumn: '1 / -1'}}><label style={label}>IBAN-tilinumero</label><input value={sellerIban} onChange={e => setSellerIban(e.target.value)} style={inp} placeholder="FI12 3456 7890 1234 56" /></div>
          </div>
        </div>

        {/* Asiakkaan tiedot */}
        <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', marginBottom: 16}}>
          <div style={{fontSize: 12, color: 'var(--muted-strong)', fontWeight: 600, marginBottom: 16}}>ASIAKKAAN TIEDOT</div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14}}>
            <div><label style={label}>Yritys tai nimi *</label><input value={buyerName} onChange={e => setBuyerName(e.target.value)} style={inp} placeholder="Asiakasyritys Oy" /></div>
            <div><label style={label}>Katuosoite</label><input value={buyerAddress} onChange={e => setBuyerAddress(e.target.value)} style={inp} placeholder="Asiakaskatu 2" /></div>
            <div><label style={label}>Postinumero ja kaupunki</label><input value={buyerCity} onChange={e => setBuyerCity(e.target.value)} style={inp} placeholder="00100 Helsinki" /></div>
            <div><label style={label}>Y-tunnus</label><input value={buyerYtunnus} onChange={e => setBuyerYtunnus(e.target.value)} style={inp} placeholder="9876543-2" /></div>
          </div>
        </div>

        {/* Laskun asetukset */}
        <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '22px 24px', marginBottom: 16}}>
          <div style={{fontSize: 12, color: 'var(--muted-strong)', fontWeight: 600, marginBottom: 16}}>LASKUN ASETUKSET</div>
          <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14}}>
            <div>
              <label style={label}>Projekti</label>
              <select value={selectedProjectId} onChange={e => setSelectedProjectId(e.target.value)} style={inp}>
                <option value="all">Kaikki projektit</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}{p.client ? ` – ${p.client}` : ''}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={label}>Laskunumero</label>
              <input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} style={inp} />
            </div>
          </div>
        </div>

        {/* Yhteenveto-kortit */}
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 16}}>
          {[
            { label: 'Tunnit yhteensä', value: `${totalHours.toFixed(1)} h`, sub: `${filteredTime.length} kirjausta`, color: '#60a5fa' },
            { label: 'Tuntityöt', value: `${totalIncome.toFixed(2)} €`, sub: 'tunnit × tuntihinta', color: '#a78bfa' },
            { label: 'Matkakorvaukset', value: `${totalTravel.toFixed(2)} €`, sub: `${totalKm} km × ${KM_RATE.toFixed(2).replace('.', ',')} €`, color: '#a78bfa' },
            { label: 'Netto yhteensä', value: `${grandTotal.toFixed(2)} €`, sub: 'ilman ALV:tä', color: '#fff', highlight: true },
          ].map(c => (
            <div key={c.label} style={{
              background: c.highlight ? 'rgba(124,58,237,0.13)' : 'var(--surface)',
              border: `1px solid ${c.highlight ? 'rgba(124,58,237,0.3)' : 'var(--border)'}`,
              borderRadius: 14, padding: '20px 22px',
            }}>
              <div style={{fontSize: 12, color: c.highlight ? '#a78bfa' : 'var(--muted)', fontWeight: 500, marginBottom: 14}}>{c.label}</div>
              <div style={{fontSize: 26, fontWeight: 700, color: c.color, lineHeight: 1, marginBottom: 8}}>{c.value}</div>
              <div style={{fontSize: 12, color: 'var(--faint)'}}>{c.sub}</div>
            </div>
          ))}
        </div>

        {/* ALV-laskelma */}
        <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 24px', marginBottom: 16}}>
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 10}}>
            <div style={{fontSize: 14, fontWeight: 600, color: 'var(--text-heading)'}}>ALV-laskelma</div>
            <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
              <label style={{fontSize: 12, color: 'var(--muted)', fontWeight: 500}}>ALV-kanta</label>
              <select
                value={vatRate}
                onChange={e => setVatRate(Number(e.target.value))}
                style={{background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '7px 12px', color: 'var(--text-soft)', fontSize: 13, cursor: 'pointer'}}
              >
                <option value={0}>0 % (veroton)</option>
                <option value={0.10}>10 %</option>
                <option value={0.14}>14 %</option>
                <option value={0.24}>24 %</option>
                <option value={0.255}>25,5 % (rakennusala)</option>
              </select>
            </div>
          </div>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14}}>
            {[
              { label: 'Netto (ilman ALV)', value: grandTotal, sub: 'laskutettava summa', color: '#60a5fa' },
              { label: `ALV ${(vatRate * 100).toFixed(1).replace('.',',')} %`, value: vatAmount, sub: 'arvonlisävero', color: '#fbbf24' },
              { label: 'Brutto (ALV:n kanssa)', value: grossTotal, sub: 'asiakkaan maksaa', color: '#a78bfa', highlight: true },
            ].map(c => (
              <div key={c.label} style={{background: (c as any).highlight ? 'rgba(124,58,237,0.1)' : 'var(--bg)', border: `1px solid ${(c as any).highlight ? 'rgba(124,58,237,0.25)' : 'var(--border)'}`, borderRadius: 10, padding: '16px 18px'}}>
                <div style={{fontSize: 11.5, color: (c as any).highlight ? '#a78bfa' : 'var(--muted)', fontWeight: 500, marginBottom: 10}}>{c.label}</div>
                <div style={{fontSize: 22, fontWeight: 700, color: c.color, lineHeight: 1, marginBottom: 6}}>{c.value.toFixed(2)} €</div>
                <div style={{fontSize: 11.5, color: 'var(--faint)'}}>{c.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Aikakirjaukset */}
        <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden', marginBottom: 14}}>
          <div style={{padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2 style={{fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-heading)'}}>Aikakirjaukset</h2>
            <span style={{fontSize: 13, color: 'var(--muted)', fontWeight: 500}}>{totalIncome.toFixed(2)} €</span>
          </div>
          {filteredTime.length === 0 ? (
            <div style={{padding: '32px', textAlign: 'center', color: 'var(--faint)', fontSize: 13}}>Ei aikakirjauksia.</div>
          ) : (
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
              <thead>
                <tr style={{borderBottom: '1px solid var(--border)'}}>
                  {['Päivämäärä','Projekti','Kuvaus','Tunnit','€/h','Summa'].map(h => (
                    <th key={h} style={{textAlign: 'left', padding: '12px 18px', color: 'var(--faint-strong)', fontWeight: 500, fontSize: 12}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTime.map(e => (
                  <tr key={e.id} style={{borderBottom: '1px solid var(--border-subtle)'}}>
                    <td style={{padding: '13px 18px', color: 'var(--muted)'}}>{e.date}</td>
                    <td style={{padding: '13px 18px', fontWeight: 600, color: 'var(--text-soft)'}}>{e.projects?.name}</td>
                    <td style={{padding: '13px 18px', color: 'var(--muted)'}}>{e.description || '—'}</td>
                    <td style={{padding: '13px 18px', color: 'var(--text-soft)'}}>{e.hours} h</td>
                    <td style={{padding: '13px 18px', color: 'var(--muted)'}}>{e.rate} €</td>
                    <td style={{padding: '13px 18px', color: '#a78bfa', fontWeight: 600}}>{(e.hours * e.rate).toFixed(2)} €</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Matkakirjaukset */}
        <div style={{background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden'}}>
          <div style={{padding: '15px 20px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <h2 style={{fontSize: 14, fontWeight: 600, margin: 0, color: 'var(--text-heading)'}}>Matkakirjaukset</h2>
            <span style={{fontSize: 13, color: 'var(--muted)', fontWeight: 500}}>{totalTravel.toFixed(2)} €</span>
          </div>
          {filteredTravel.length === 0 ? (
            <div style={{padding: '32px', textAlign: 'center', color: 'var(--faint)', fontSize: 13}}>Ei matkakirjauksia.</div>
          ) : (
            <table style={{width: '100%', borderCollapse: 'collapse', fontSize: 13}}>
              <thead>
                <tr style={{borderBottom: '1px solid var(--border)'}}>
                  {['Päivämäärä','Projekti','Reitti','km','Korvaus'].map(h => (
                    <th key={h} style={{textAlign: 'left', padding: '12px 18px', color: 'var(--faint-strong)', fontWeight: 500, fontSize: 12}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredTravel.map(e => (
                  <tr key={e.id} style={{borderBottom: '1px solid var(--border-subtle)'}}>
                    <td style={{padding: '13px 18px', color: 'var(--muted)'}}>{e.date}</td>
                    <td style={{padding: '13px 18px', fontWeight: 600, color: 'var(--text-soft)'}}>{e.projects?.name}</td>
                    <td style={{padding: '13px 18px', color: 'var(--muted)'}}>{e.route}</td>
                    <td style={{padding: '13px 18px', color: 'var(--text-soft)'}}>{e.km} km</td>
                    <td style={{padding: '13px 18px', color: '#a78bfa', fontWeight: 600}}>{(e.km * KM_RATE).toFixed(2)} €</td>
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
