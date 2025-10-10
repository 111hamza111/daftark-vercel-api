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

    const { deviceFingerprint } = await req.json();
    if (!deviceFingerprint) {
      return new Response('deviceFingerprint required', { status: 400 });
    }

    const TRIAL_DAYS = Number(process.env.TRIAL_DAYS ?? 7);
    const ref = db.collection('users').doc(uid);
    const snap = await ref.get();
    const user = snap.data() || {};

    if (user.isPremium === true || (user.trial && user.trial.startedAt)) {
      return new Response(JSON.stringify({ ok: false, reason: 'ineligible' }), { status: 400 });
    }

    await ref.set({
      trial: {
        days: TRIAL_DAYS,
        device: String(deviceFingerprint),
        startedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
    }, { merge: true });

    return new Response(JSON.stringify({ ok: true, trialDays: TRIAL_DAYS }), { status: 200 });
  } catch (e: any) {
    return new Response(e?.message || 'Error', { status: 500 });
  }
}
