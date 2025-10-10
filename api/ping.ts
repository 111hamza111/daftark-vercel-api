// api/ping.ts
export const config = { runtime: 'nodejs' };
export default function handler(req: any, res?: any) {
  if (res) { res.status(200).send('ok'); return; }
  return new Response('ok', { status: 200 });
}
