import * as admin from 'firebase-admin';

let app: admin.app.App | null = null;

export function getAdmin() {
  if (!app) {
    app = admin.apps.length
      ? admin.app()
      : admin.initializeApp({
          credential: admin.credential.cert(
            JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON as string)
          ),
        });
  }
  return { admin, db: admin.firestore() };
}
