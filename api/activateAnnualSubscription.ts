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
    const { db, FieldValue, Timestamp } = getAdmin();

    const body = await readJson(req);
    const mode = String(body.mode ?? 'manual');

    if (mode === 'play') {
      const { packageName, productId, purchaseToken } = body;
      if (!packageName || !productId || !purchaseToken) {
        return sendText(res, 'Play fields missing', 400);
      }
      // TODO: تحقق فعلي من Google Play لاحقًا
    } else {
      if (!String(body.receipt ?? '').trim()) {
        return sendText(res, 'receipt required', 400);
      }
    }

    const now = Timestamp.now();
    const end = Timestamp.fromDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));

    await withTimeout(
      db.collection('users').doc(uid).set({
        isPremium: true,
        subscriptionStart: now,
        subscriptionEnd: end,
        trial: FieldValue.delete(),
      }, { merge: true }),
      DB_TIMEOUT_MS,
      'firestore set timeout'
    );

    return sendJson(res, { ok: true, mode, subscriptionEnd: end.toDate().toISOString() }, 200);
  } catch (e: any) {
    console.error('activateAnnualSubscription error:', e?.message || e);
    return sendText(res, e?.message || 'Error', 500);
  }
}
