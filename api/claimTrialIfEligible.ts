import { getAdmin } from './_admin';
import { verifyIdToken, ensurePost } from './_auth';

export const config = { runtime: 'nodejs' };


export default async function handler(req: Request) {
  try {
    ensurePost(req);
    const uid = await verifyIdToken(req);
    const { db, admin } = getAdmin();

    const { deviceFingerprint } = await req.json() as { deviceFingerprint?: string };
    if (!deviceFingerprint) return new Response('deviceFingerprint required', { status: 400 });

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
    if (e instanceof Response) return e;
    return new Response(e?.message || 'Error', { status: 500 });
  }
}
