async function getData() {
  const res = await fetch('http://localhost:3000/api/data', {
    cache: 'no-store',
  })
  return res.json()
}

export default async function DynamicPage() {
  const data = await getData()
  return (
    <main style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>/dynamic</h1>
      <p>fetch with cache: &apos;no-store&apos;</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  )
}
