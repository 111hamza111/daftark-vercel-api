// api/_admin.ts
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

let _inited = false;

export function getAdmin() {
  try {
    if (!_inited) {
      if (getApps().length === 0) {
        const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not set');
        const serviceAccount = JSON.parse(raw);

        initializeApp({
          credential: cert(serviceAccount as any),
        });
      }
      _inited = true;
    }

    // نرجع كل ما نحتاجه بشكل موديولر
    return {
      db: getFirestore(),
      auth: getAuth(),
      FieldValue,
      Timestamp,
    };
  } catch (e: any) {
    console.error('🔥 Firebase Admin init error:', e?.message || e);
    throw new Error('Firebase Admin initialization failed');
  }
}
