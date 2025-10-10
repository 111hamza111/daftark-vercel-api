// أدوات HTTP للتعامل مع نمطي Vercel: (req,res) القديم و Web Request الحديث

export function isWebRequest(req: any): boolean {
  return typeof req?.headers?.get === 'function';
}

export function getMethod(req: any): string {
  return req?.method || 'GET';
}

export function getHeader(req: any, name: string): string | undefined {
  if (isWebRequest(req)) {
    return req.headers.get(name) ?? undefined;
  }
  const h = req?.headers?.[name.toLowerCase()];
  if (Array.isArray(h)) return h[0];
  return h;
}

export async function readJson(req: any): Promise<any> {
  if (isWebRequest(req)) {
    try { return await req.json(); } catch { return {}; }
  }
  // IncomingMessage (Node)
  return await new Promise((resolve, reject) => {
    let data = '';
    req.on?.('data', (chunk: any) => (data += chunk));
    req.on?.('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (e) { reject(e); }
    });
    req.on?.('error', reject);
  });
}

// إرسال JSON مع دعم النمطين
export function sendJson(res: any | undefined, body: any, status = 200) {
  const payload = typeof body === 'string' ? body : JSON.stringify(body);
  if (res) {
    // نمط (req,res)
    res.status(status);
    res.setHeader?.('Content-Type', 'application/json');
    res.send(payload);
    return;
  }
  // نمط Web Response
  return new Response(payload, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// إرسال نص بسيط
export function sendText(res: any | undefined, text: string, status = 200) {
  if (res) {
    res.status(status);
    res.setHeader?.('Content-Type', 'text/plain; charset=utf-8');
    res.send(text);
    return;
  }
  return new Response(text, {
    status,
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
