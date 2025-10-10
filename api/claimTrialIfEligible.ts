export const config = { runtime: 'nodejs' };

import { getAdmin } from './_admin.js';
import { verifyIdToken } from './_auth.js';
import { withTimeout } from './_utils.js';
import { getMethod, readJson, sendJson, sendText } from './_http.js';

const DB_TIMEOUT_MS = Number(process.env.DB_TIMEOUT_MS ?? 7000);

export default async function handler(req: any, res?: any) {
  try {
    if (getMethod(req) !== 'POST') return sendText(res, 'Method Not Allowed', 405);

    const uid = await verifyIdToken(req);
    const { db, FieldValue } = getAdmin();

    const { deviceFingerprint } = await readJson(req);
    if (!deviceFingerprint) return sendText(res, 'deviceFingerprint required', 400);

    const TRIAL_DAYS = Number(process.env.TRIAL_DAYS ?? 7);
    const ref = db.collection('users').doc(uid);

    const snap = await withTimeout(ref.get(), DB_TIMEOUT_MS, 'firestore get timeout');
    const user = snap.data() || {};

    if (user.isPremium === true || (user.trial && user.trial.startedAt)) {
      return sendJson(res, { ok: false, reason: 'ineligible' }, 400);
    }

    await withTimeout(
      ref.set({
        trial: {
          days: TRIAL_DAYS,
          device: String(deviceFingerprint),
          startedAt: FieldValue.serverTimestamp(),
        },
      }, { merge: true }),
      DB_TIMEOUT_MS,
      'firestore set timeout'
    );

    return sendJson(res, { ok: true, trialDays: TRIAL_DAYS }, 200);
  } catch (e: any) {
    console.error('claimTrialIfEligible error:', e?.message || e);
    return sendText(res, e?.message || 'Error', 500);
  }
}
