import { getAdmin } from './_admin.js';
import { withTimeout } from './_utils.js';
import { getHeader } from './_http.js';

const VERIFY_TIMEOUT_MS = Number(process.env.VERIFY_TIMEOUT_MS ?? 7000);

// يقبل req بأي نمط، ويستخرج التوكن من الهيدر
export async function verifyIdToken(req: any) {
  const auth = getHeader(req, 'authorization') || '';
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
