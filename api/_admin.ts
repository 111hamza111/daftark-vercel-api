import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

export function getAdmin() {
  try {
    if (!app) {
      if (admin.apps && admin.apps.length > 0) {
        app = admin.app();
      } else {
        const jsonStr = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
        if (!jsonStr) throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON not set');
        const serviceAccount = JSON.parse(jsonStr);

        app = admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
        });
      }
    }
    return { admin, db: admin.firestore() };
  } catch (e: any) {
    console.error('🔥 Firebase Admin init error:', e?.message || e);
    throw new Error('Firebase Admin initialization failed');
  }
}
