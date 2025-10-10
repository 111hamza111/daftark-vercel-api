export const config = { runtime: 'nodejs' };
export default async function handler(req: any, res?: any) {
  if ((req?.method || 'GET') !== 'GET') {
    if (res) { res.status(405).send('Method Not Allowed'); return; }
    return new Response('Method Not Allowed', { status: 405 });
  }
  if (res) { res.status(200).send('ok'); return; }
  return new Response('ok', { status: 200 });
}
