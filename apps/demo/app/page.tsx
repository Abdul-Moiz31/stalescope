import Link from 'next/link'

export default function HomePage() {
  return (
    <main style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>stalescope demo</h1>
      <p>
        Visit <a href="/__stalescope">/__stalescope</a> to watch cache events live.
      </p>
      <ul>
        <li>
          <Link href="/static">/static</Link> — fetch with revalidate: 60
        </li>
        <li>
          <Link href="/dynamic">/dynamic</Link> — fetch with cache: &apos;no-store&apos;
        </li>
        <li>
          <Link href="/tagged">/tagged</Link> — fetch with next: {'{'} tags: [&apos;products&apos;] {'}'}
        </li>
      </ul>
    </main>
  )
}
