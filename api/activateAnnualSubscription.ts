export const config = { runtime: 'nodejs' };

import { getAdmin } from './_admin.js';
import { verifyIdToken } from './_auth.js';

export default async function handler(req: Request) {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const uid = await verifyIdToken(req);
    const { db, admin } = getAdmin();

    const body = await req.json();
    const mode = String(body.mode ?? 'manual');

    if (mode === 'play') {
      const { packageName, productId, purchaseToken } = body;
      if (!packageName || !productId || !purchaseToken) {
        return new Response('Play fields missing', { status: 400 });
      }
      // TODO: تحقق فعلي عبر Google Play (لاحقًا)
    } else {
      if (!String(body.receipt ?? '').trim()) {
        return new Response('receipt required', { status: 400 });
      }
    }

    const now = admin.firestore.Timestamp.now();
    const end = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    );

    await db.collection('users').doc(uid).set({
      isPremium: true,
      subscriptionStart: now,
      subscriptionEnd: end,
      trial: admin.firestore.FieldValue.delete(),
    }, { merge: true });

    return new Response(
      JSON.stringify({ ok: true, mode, subscriptionEnd: end.toDate().toISOString() }),
      { status: 200 }
    );
  } catch (e: any) {
    return new Response(e?.message || 'Error', { status: 500 });
  }
}
