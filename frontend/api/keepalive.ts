export default async function handler() {
  const backendUrl = ((globalThis as any).process?.env?.VITE_API_URL as string | undefined) || '';

  if (!backendUrl) {
    return new Response('VITE_API_URL is not configured', { status: 500 });
  }

  try {
    await fetch(`${backendUrl}/api/health`);
    return new Response('Backend is healthy', { status: 200 });
  } catch {
    return new Response('Backend unreachable', { status: 502 });
  }
}
