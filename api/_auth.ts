import { getAdmin } from './_admin.js';

export async function verifyIdToken(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) throw new Response('Unauthenticated', { status: 401 });

  const { admin } = getAdmin();
  const decoded = await admin.auth().verifyIdToken(token);
  return decoded.uid as string;
}
