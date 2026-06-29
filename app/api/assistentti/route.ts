import Anthropic from '@anthropic-ai/sdk'
import { NextRequest } from 'next/server'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { messages, projectData } = await req.json()

    const now = new Date().toLocaleDateString('fi-FI', {
      year: 'numeric', month: 'long', day: 'numeric',
    })

    const system = buildSystemPrompt(projectData, now)
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const response = anthropic.messages.stream({
            model: 'claude-sonnet-4-6',
            max_tokens: 1500,
            system,
            messages: messages.map((m: { role: string; content: string }) => ({
              role: m.role as 'user' | 'assistant',
              content: m.content,
            })),
          })

          for await (const event of response) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text))
            }
          }
        } catch (err) {
          controller.error(err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch {
    return new Response('Virhe AI-yhteydessä', { status: 500 })
  }
}

function buildSystemPrompt(data: any, now: string): string {
  const projects: any[] = data.projects || []
  const timeEntries: any[] = data.timeEntries || []
  const travelEntries: any[] = data.travelEntries || []

  const stats = projects.map((p) => {
    const te = timeEntries.filter((e) => e.project_id === p.id)
    const tr = travelEntries.filter((e) => e.project_id === p.id)
    const revenue =
      te.reduce((s: number, e: any) => s + e.hours * e.rate, 0) +
      tr.reduce((s: number, e: any) => s + e.km * 0.25, 0)
    const hours = te.reduce((s: number, e: any) => s + e.hours, 0)
    const budgetPct = p.budget > 0 ? Math.round((revenue / p.budget) * 100) : null
    const daysLeft = p.deadline
      ? Math.ceil((new Date(p.deadline).getTime() - Date.now()) / 86400000)
      : null
    return { ...p, revenue, hours, budgetPct, daysLeft }
  })

  const totalRevenue = stats.reduce((s, p) => s + p.revenue, 0)
  const totalBudget = projects.reduce((s, p) => s + (p.budget || 0), 0)
  const totalHours = timeEntries.reduce((s, e) => s + e.hours, 0)
  const totalKm = travelEntries.reduce((s, e) => s + e.km, 0)
  const activeCount = projects.filter((p) => p.status === 'active').length

  const projectLines = stats
    .map((p) => {
      const urgency =
        p.daysLeft !== null
          ? p.daysLeft < 0
            ? ` ⚠️ MYÖHÄSSÄ ${Math.abs(p.daysLeft)} pv`
            : p.daysLeft <= 7
            ? ` 🔴 deadline ${p.daysLeft} pv`
            : p.daysLeft <= 30
            ? ` 🟡 deadline ${p.daysLeft} pv`
            : ` ✅ deadline ${p.daysLeft} pv`
          : ''
      const budgetAlert =
        p.budgetPct !== null
          ? p.budgetPct >= 100
            ? ` 🚨 budjetti ylitetty (${p.budgetPct}%)`
            : p.budgetPct >= 80
            ? ` ⚠️ budjetti ${p.budgetPct}%`
            : ` budjetti ${p.budgetPct}%`
          : ' ei budjettia'
      return `- ${p.name} [${p.status === 'active' ? 'aktiivinen' : 'valmis'}]${urgency}${budgetAlert} | laskutettu ${Math.round(p.revenue)}€ | ${p.hours.toFixed(1)}h | asiakas: ${p.client || 'ei'}`
    })
    .join('\n')

  return `Olet FreelanceHub-sovelluksen AI-apuri kevytyrittäjille. Autat analysoimaan projektidata ja annat ennakoivia, konkreettisia neuvoja suomeksi.

Vastaa aina suomeksi. Ole ytimekäs mutta kattava. Käytä emojeja selkeyttämiseen (🔴🟡✅⚠️🚨💡📊). Muotoile vastaukset selkeästi: otsikot, bullet-listat ja lihavoidut kohdat.

Tänään: ${now}

### KÄYTTÄJÄN TILANNE

Yhteenveto:
- Projekteja yhteensä: ${projects.length} (aktiivisia: ${activeCount})
- Kokonaislaskutus: ${Math.round(totalRevenue)} € / ${Math.round(totalBudget)} € budjetista (${totalBudget > 0 ? Math.round((totalRevenue / totalBudget) * 100) : 0}%)
- Tunnit yhteensä: ${totalHours.toFixed(1)} h
- Matkakorvaukset: ${(totalKm * 0.25).toFixed(0)} € (${totalKm} km)

Projektit:
${projectLines || 'Ei projekteja vielä.'}

Kun analysoit tilannetta, kiinnitä erityistä huomiota:
1. Lähestyviin deadlineihin (alle 30 pv) ja myöhässä oleviin
2. Budjettiin meneviin tai jo ylitettyihin projekteihin (yli 80%)
3. Laskuttamattomaan tai kirjaamattomaan työhön
4. Kannattavuuteen ja kate-%:iin
5. Parannusmahdollisuuksiin`
}
