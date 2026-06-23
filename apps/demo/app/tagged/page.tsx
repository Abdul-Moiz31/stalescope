async function getData() {
  const res = await fetch('http://localhost:3000/api/data', {
    next: { tags: ['products'] },
  })
  return res.json()
}

export default async function TaggedPage() {
  const data = await getData()
  return (
    <main style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>/tagged</h1>
      <p>fetch with next: {'{'} tags: [&apos;products&apos;] {'}'}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  )
}
