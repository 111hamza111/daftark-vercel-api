export const config = { runtime: 'nodejs' };

import { getAdmin } from './_admin.js';
import { verifyIdToken } from './_auth.js';
import { withTimeout } from './_utils.js';
import { getMethod, readJson, sendJson, sendText } from './_http.js';
import crypto from 'crypto';

const DB_TIMEOUT_MS = Number(process.env.DB_TIMEOUT_MS ?? 7000);

export default async function handler(req: any, res?: any) {
  try {
    if (getMethod(req) !== 'POST') return sendText(res, 'Method Not Allowed', 405);

    const uid = await verifyIdToken(req);
    const { db, admin } = getAdmin();

    const { hash }: { hash?: string } = await readJson(req);
    const SIGN_KEY_HEX = process.env.SIGN_KEY_HEX || '';

    if (!hash || !/^[0-9a-fA-F]{64}$/.test(hash)) return sendText(res, 'bad hash', 400);
    if (!SIGN_KEY_HEX) return sendText(res, 'SIGN_KEY_HEX missing', 500);

    const key = Buffer.from(SIGN_KEY_HEX, 'hex');
    const signature = crypto.createHmac('sha256', key).update(hash, 'utf8').digest('hex');

    const tokenId = db.collection('users').doc(uid).collection('tokens').doc().id;

    await withTimeout(
      db.collection('users').doc(uid).collection('backup_signs').doc(tokenId).set({
        hash,
        signature,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      }),
      DB_TIMEOUT_MS,
      'firestore set timeout'
    );

    return sendJson(res, { ok: true, tokenId, signature }, 200);
  } catch (e: any) {
    console.error('signBackup error:', e?.message || e);
    return sendText(res, e?.message || 'Error', 500);
  }
}
