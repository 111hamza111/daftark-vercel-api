# Daftark – Vercel Serverless API (Free Plan Compatible)

This project hosts three HTTP endpoints on **Vercel (Hobby / Free)** that replace Firebase Cloud Functions:

- `POST /api/claimTrialIfEligible`
- `POST /api/activateAnnualSubscription`
- `POST /api/signBackup`

Each endpoint verifies the **Firebase ID Token** from your Flutter app (Authorization: Bearer <idToken>), then uses **firebase-admin** to read/write in your Firestore project.

## 1) Create a Vercel Project
1. Create a GitHub repo (e.g. `daftark-vercel-api`) and push these files.
2. Go to https://vercel.com → **Add New... → Project → Import** your repo.
3. Keep defaults; Vercel auto-builds & deploys on each push.

## 2) Environment Variables (Vercel Dashboard → Project → Settings → Environment Variables)
Add (for **Production** and **Preview**):
- `FIREBASE_SERVICE_ACCOUNT_JSON` → Full JSON content from Firebase Console:
  - Firebase Console → ⚙️ Project Settings → **Service accounts** → **Generate new private key** → Copy the file content (DO NOT commit).
- `TRIAL_DAYS` → e.g. `7`
- `SIGN_KEY_HEX` → your HMAC key in hex (e.g. `48656c6c6f2d7365637265742d6b6579`)
- (Optional) `PLAY_VERIFY`, `PLAY_PACKAGE_NAME`, `PLAY_PRODUCT_ID`

> 🔒 Give the service account the default **Firebase Admin SDK** key (recommended). No need to add more roles manually.

## 3) Local Dev
```bash
npm install
npx vercel dev
# Visit: http://localhost:3000/api/claimTrialIfEligible
```

## 4) Call from Flutter (mobile)
```dart
import 'package:firebase_auth/firebase_auth.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

const _base = 'https://YOUR-VERCEL-APP.vercel.app';

Future<Map<String, dynamic>> _call(String path, Map body) async {
  final user = FirebaseAuth.instance.currentUser!;
  final idToken = await user.getIdToken();
  final res = await http.post(
    Uri.parse('$_base$path'),
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer $idToken',
    },
    body: jsonEncode(body),
  );
  if (res.statusCode >= 400) {
    throw Exception(res.body);
  }
  return jsonDecode(res.body);
}

Future<void> claimTrial(String fingerprint) async {
  await _call('/api/claimTrialIfEligible', {'deviceFingerprint': fingerprint});
}

Future<void> activateManual(String receipt) async {
  await _call('/api/activateAnnualSubscription', {'mode': 'manual', 'receipt': receipt});
}

Future<Map<String, dynamic>> signBackup(String sha256Hex) async {
  return await _call('/api/signBackup', {'hash': sha256Hex});
}
```

## 5) Security
- All routes require a valid Firebase **ID Token** (checked server-side).
- Keep Firestore Rules strict to block client-side manipulation of `isPremium`.
- Never commit keys; keep them only in Vercel Env Vars.

## 6) Testing
```bash
curl -X POST http://localhost:3000/api/claimTrialIfEligible \
     -H "Authorization: Bearer <ID_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{"deviceFingerprint":"abc-123"}'
```

---
MIT © Daftark
