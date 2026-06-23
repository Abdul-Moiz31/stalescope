export async function GET() {
  return Response.json({ generatedAt: new Date().toISOString() })
}
