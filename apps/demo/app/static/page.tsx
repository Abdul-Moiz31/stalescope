async function getData() {
  const res = await fetch('http://localhost:3000/api/data', {
    next: { revalidate: 60 },
  })
  return res.json()
}

export default async function StaticPage() {
  const data = await getData()
  return (
    <main style={{ padding: 40, fontFamily: 'system-ui' }}>
      <h1>/static</h1>
      <p>fetch with next: {'{'} revalidate: 60 {'}'}</p>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </main>
  )
}
