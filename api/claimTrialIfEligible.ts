export const config = { runtime: 'nodejs' };

import { getAdmin } from './_admin.js';
import { verifyIdToken } from './_auth.js';
import { withTimeout, json } from './_utils.js';

const DB_TIMEOUT_MS = Number(process.env.DB_TIMEOUT_MS ?? 7000);

export default async function handler(req: Request) {
  try {
    if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 });

    const uid = await verifyIdToken(req);
    const { db, admin } = getAdmin();

    const { deviceFingerprint } = await req.json();
    if (!deviceFingerprint) return new Response('deviceFingerprint required', { status: 400 });

    const TRIAL_DAYS = Number(process.env.TRIAL_DAYS ?? 7);

    const ref = db.collection('users').doc(uid);

    // read user with timeout
    const snap = await withTimeout(ref.get(), DB_TIMEOUT_MS, 'firestore get timeout');
    const user = snap.data() || {};

    if (user.isPremium === true || (user.trial && user.trial.startedAt)) {
      return json({ ok: false, reason: 'ineligible' }, 400);
    }

    await withTimeout(
      ref.set({
        trial: {
          days: TRIAL_DAYS,
          device: String(deviceFingerprint),
          startedAt: admin.firestore.FieldValue.serverTimestamp(),
        },
      }, { merge: true }),
      DB_TIMEOUT_MS,
      'firestore set timeout'
    );

    return json({ ok: true, trialDays: TRIAL_DAYS }, 200);
  } catch (e: any) {
    console.error('claimTrialIfEligible error:', e?.message || e);
    return new Response(e?.message || 'Error', { status: 500 });
  }
}
