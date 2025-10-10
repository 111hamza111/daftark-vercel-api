export const config = { runtime: 'nodejs' };

import { getAdmin } from './_admin.js';
import { verifyIdToken } from './_auth.js';
import crypto from 'crypto';

export default async function handler(req: Request) {
  try {
    if (req.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    const uid = await verifyIdToken(req);
    const { db, admin } = getAdmin();

    const { hash }: { hash?: string } = await req.json();
    const SIGN_KEY_HEX = process.env.SIGN_KEY_HEX || '';

    if (!hash || !/^[0-9a-fA-F]{64}$/.test(hash)) {
      return new Response('bad hash', { status: 400 });
    }
    if (!SIGN_KEY_HEX) {
      return new Response('SIGN_KEY_HEX missing', { status: 500 });
    }

    const key = Buffer.from(SIGN_KEY_HEX, 'hex');
    const signature = crypto.createHmac('sha256', key).update(hash, 'utf8').digest('hex');

    const tokenId = db.collection('users').doc(uid).collection('tokens').doc().id;
    await db.collection('users').doc(uid).collection('backup_signs').doc(tokenId).set({
      hash,
      signature,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return new Response(JSON.stringify({ ok: true, tokenId, signature }), { status: 200 });
  } catch (e: any) {
    return new Response(e?.message || 'Error', { status: 500 });
  }
}
