export const config = { runtime: 'nodejs' };

export default async function handler(req: Request) {
  try {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    if (!raw) return new Response('ENV MISSING', { status: 500 });

    const obj = JSON.parse(raw);
    // لا نعيد المفتاح الخاص؛ فقط نؤكد القيم غير الحساسة
    const info = {
      ok: true,
      project_id: obj.project_id,
      client_email: obj.client_email,
      has_private_key: typeof obj.private_key === 'string' && obj.private_key.length > 100,
    };
    return new Response(JSON.stringify(info), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(`PARSE ERROR: ${e?.message || e}`, { status: 500 });
  }
}
