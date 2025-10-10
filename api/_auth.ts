import { getAdmin } from './_admin.js';
import { withTimeout } from './_utils.js';

const VERIFY_TIMEOUT_MS = Number(process.env.VERIFY_TIMEOUT_MS ?? 7000);

export async function verifyIdToken(req: Request) {
  const auth = req.headers.get('authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) throw new Response('Unauthenticated', { status: 401 });

  const { admin } = getAdmin();
  try {
    const decoded = await withTimeout(
      admin.auth().verifyIdToken(token),
      VERIFY_TIMEOUT_MS,
      'verifyIdToken timeout'
    );
    return decoded.uid as string;
  } catch (e: any) {
    console.error('verifyIdToken error:', e?.message || e);
    throw new Response('Auth error', { status: 401 });
  }
}
