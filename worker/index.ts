/**
 * Worker do site Axcellera.
 *
 * Com `assets.run_worker_first = ["/api/*"]`, este código só recebe requisições
 * para /api/*. Todo o resto é servido diretamente como asset estático.
 *
 * Endpoint: POST /api/contact  { name, email, message, website, turnstileToken }
 */

type WorkerEnv = Env & {
  /** Secret do Cloudflare Turnstile. Configurar com `wrangler secret put`. */
  TURNSTILE_SECRET_KEY?: string;
  /** Chave de API do Brevo (dedicada ao site). Configurar com `wrangler secret put`. */
  BREVO_API_KEY?: string;
};

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

const MAX_BODY_BYTES = 16 * 1024;
const LIMITS = { name: 100, email: 254, message: 5000, messageMin: 10 } as const;
const EMAIL_RE = /^[^\s@<>()[\]\\,;:"]+@[^\s@<>()[\]\\,;:"]+\.[^\s@<>()[\]\\,;:"]{2,}$/;

class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super(code);
  }
}

export default {
  async fetch(request: Request, env: WorkerEnv): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/api/contact') {
      try {
        return await handleContact(request, env, url);
      } catch (err) {
        if (err instanceof HttpError) return json({ error: err.code }, err.status);
        console.error('contact: erro inesperado', err instanceof Error ? err.message : 'desconhecido');
        return json({ error: 'internal_error' }, 500);
      }
    }

    if (url.pathname.startsWith('/api/')) return json({ error: 'not_found' }, 404);

    // Rede de segurança: com run_worker_first restrito a /api/*, isto não deve ser alcançado.
    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<WorkerEnv>;

async function handleContact(request: Request, env: WorkerEnv, url: URL): Promise<Response> {
  if (request.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405, { Allow: 'POST' });
  }

  // O formulário é same-origin. Recusar qualquer outra origem (defesa em profundidade contra CSRF).
  if (request.headers.get('Origin') !== url.origin) throw new HttpError(403, 'forbidden_origin');
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) {
    throw new HttpError(415, 'unsupported_media_type');
  }

  const payload = parsePayload(await readLimited(request, MAX_BODY_BYTES));

  // Honeypot: campo invisível que humanos não preenchem. Responde sucesso para não orientar bots.
  if (payload.website) return json({ ok: true }, 200);

  const contact = validate(payload);

  // Falha fechada: sem estes secrets o formulário não deve operar (nem sem antispam, nem sem envio).
  const { TURNSTILE_SECRET_KEY: turnstileSecret, BREVO_API_KEY: brevoKey } = env;
  if (!turnstileSecret || !brevoKey) {
    console.error('contact: secrets ausentes', {
      turnstile: Boolean(turnstileSecret),
      brevo: Boolean(brevoKey),
    });
    throw new HttpError(503, 'service_unavailable');
  }
  await verifyTurnstile(payload.turnstileToken, turnstileSecret, request);
  await sendViaBrevo(env, brevoKey, contact);

  return json({ ok: true }, 200);
}

async function sendViaBrevo(
  env: WorkerEnv,
  apiKey: string,
  contact: { name: string; email: string; message: string },
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(BREVO_URL, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({
        sender: { name: 'Site Axcellera', email: env.CONTACT_FROM },
        to: [{ email: env.CONTACT_TO }],
        replyTo: { email: contact.email, name: contact.name },
        subject: `Contato pelo site: ${contact.name.slice(0, 60)}`,
        // Apenas texto: nada do que o visitante digitou é interpretado como HTML.
        textContent: [
          `Nome: ${contact.name}`,
          `E-mail: ${contact.email}`,
          '',
          contact.message,
          '',
          '—',
          'Enviado pelo formulário do site. Responda a este e-mail para falar com o visitante.',
        ].join('\n'),
      }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    console.error('contact: falha de rede ao chamar o Brevo');
    throw new HttpError(502, 'send_failed');
  }

  if (!res.ok) {
    // Registra só o status e o código de erro do Brevo, sem dados do visitante.
    const detail = (await res.json().catch(() => ({}))) as { code?: string };
    console.error('contact: Brevo recusou o envio', res.status, detail.code ?? 'sem_codigo');
    throw new HttpError(502, 'send_failed');
  }
}

interface Payload {
  name: string;
  email: string;
  message: string;
  website: string;
  turnstileToken: string;
}

function parsePayload(raw: string): Payload {
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    throw new HttpError(400, 'invalid_json');
  }
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    throw new HttpError(400, 'invalid_payload');
  }
  const d = data as Record<string, unknown>;
  const str = (v: unknown) => (typeof v === 'string' ? v : '');
  return {
    name: str(d.name).trim(),
    email: str(d.email).trim(),
    message: str(d.message).trim(),
    website: str(d.website).trim(),
    turnstileToken: str(d.turnstileToken),
  };
}

function validate(p: Payload): Pick<Payload, 'name' | 'email' | 'message'> {
  // Nome e e-mail entram em cabeçalhos: proibir quebras de linha e controles evita header injection.
  const hasControlChars = (s: string) =>
    [...s].some((ch) => {
      const code = ch.charCodeAt(0);
      return code < 32 || code === 127;
    });

  if (!p.name || p.name.length > LIMITS.name || hasControlChars(p.name)) {
    throw new HttpError(400, 'invalid_name');
  }
  if (p.email.length > LIMITS.email || !EMAIL_RE.test(p.email) || hasControlChars(p.email)) {
    throw new HttpError(400, 'invalid_email');
  }
  if (p.message.length < LIMITS.messageMin || p.message.length > LIMITS.message) {
    throw new HttpError(400, 'invalid_message');
  }
  return { name: p.name, email: p.email, message: p.message };
}

async function verifyTurnstile(token: string, secret: string, request: Request): Promise<void> {
  if (!token || token.length > 2048) throw new HttpError(400, 'verification_failed');

  const body = new URLSearchParams({ secret, response: token });
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) body.set('remoteip', ip);

  let result: { success?: boolean };
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: AbortSignal.timeout(5000),
    });
    result = await res.json();
  } catch {
    console.error('contact: falha ao consultar o Turnstile');
    throw new HttpError(503, 'service_unavailable');
  }
  if (!result.success) throw new HttpError(400, 'verification_failed');
}

/** Lê o corpo até `max` bytes; aborta sem carregar o restante se estourar. */
async function readLimited(request: Request, max: number): Promise<string> {
  const declared = Number(request.headers.get('Content-Length'));
  if (declared > max) throw new HttpError(413, 'payload_too_large');
  if (!request.body) throw new HttpError(400, 'invalid_json');

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > max) {
      await reader.cancel();
      throw new HttpError(413, 'payload_too_large');
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.byteLength;
  }
  return new TextDecoder().decode(bytes);
}

function json(data: unknown, status: number, extra: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extra },
  });
}
