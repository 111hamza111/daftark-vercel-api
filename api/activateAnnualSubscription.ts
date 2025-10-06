import { getAdmin } from './_admin';
import { verifyIdToken, ensurePost } from './_auth';

export const config = { runtime: 'nodejs20.x' };

export default async function handler(req: Request) {
  try {
    ensurePost(req);
    const uid = await verifyIdToken(req);
    const { db, admin } = getAdmin();

    const body = await req.json() as any;
    const mode = String(body.mode ?? 'manual'); // default "manual" (free-route)

    if (mode === 'play') {
      const { packageName, productId, purchaseToken } = body;
      if (!packageName || !productId || !purchaseToken) {
        return new Response('Play fields missing', { status: 400 });
      }
      // TODO: real Play purchase verification can be added here (optional later).
    } else {
      if (!String(body.receipt ?? '').trim()) {
        return new Response('receipt required', { status: 400 });
      }
    }

    const now = admin.firestore.Timestamp.now();
    const endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const end = admin.firestore.Timestamp.fromDate(endDate);

    await db.collection('users').doc(uid).set({
      isPremium: true,
      subscriptionStart: now,
      subscriptionEnd: end,
      trial: admin.firestore.FieldValue.delete(),
    }, { merge: true });

    return new Response(JSON.stringify({ ok: true, mode, subscriptionEnd: endDate.toISOString() }), { status: 200 });
  } catch (e: any) {
    if (e instanceof Response) return e;
    return new Response(e?.message || 'Error', { status: 500 });
  }
}
