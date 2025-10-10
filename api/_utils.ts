// api/_utils.ts
export async function withTimeout<T>(
  p: Promise<T>,
  ms: number,
  msg = 'Timeout'
): Promise<T> {
  let t: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, rej) => {
    t = setTimeout(() => rej(new Error(msg)), ms);
  });
  try {
    const r = await Promise.race([p, timeout]) as T;
    return r;
  } finally {
    clearTimeout(t!);
  }
}

export function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
