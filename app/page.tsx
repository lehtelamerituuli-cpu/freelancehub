import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-2">FreelanceHub</h1>
      <p className="text-gray-400 mb-8">Kevytyrittäjän hallintaalusta</p>
      <div className="flex gap-4">
        <Link href="/dashboard" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg font-medium transition">
          Kojelauta
        </Link>
      </div>
    </main>
  )
}