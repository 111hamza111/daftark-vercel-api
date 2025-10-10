// api/diagEnv.ts
export const config = { runtime: 'nodejs' };

// يدعم كلا النمطين: (req,res) أو (req) ويضمن الرد فورًا
export default async function handler(req: any, res?: any) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

    let info: any = {
      ok: !!raw,
      has_env: !!raw,
      length: raw?.length ?? 0,
    };

    if (raw) {
      try {
        const obj = JSON.parse(raw);
        info = {
          ok: true,
          project_id: obj?.project_id ?? null,
          client_email: obj?.client_email ?? null,
          has_private_key:
            typeof obj?.private_key === 'string' &&
            (obj.private_key.includes('BEGIN PRIVATE KEY') || obj.private_key.includes('\\n')),
        };
      } catch (e: any) {
        info = { ok: false, parse_error: String(e?.message || e), length: raw.length };
      }
    }

    const body = JSON.stringify(info);
    if (res) {
      res.status(200);
      res.setHeader('Content-Type', 'application/json');
      res.send(body);
      return;
    }
    return new Response(body, {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    const msg = String(e?.message || e);
    if (res) {
      res.status(500).send(msg);
      return;
    }
    return new Response(msg, { status: 500 });
  }
}
