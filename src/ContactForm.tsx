import React from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          language?: string;
          callback: (token: string) => void;
          'expired-callback': () => void;
          'error-callback': () => void;
        },
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
  }
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const TURNSTILE_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

type Status = 'idle' | 'sending' | 'sent' | 'error';

const ERROR_MESSAGES: Record<string, string> = {
  invalid_name: 'Informe seu nome (até 100 caracteres).',
  invalid_email: 'Informe um e-mail válido.',
  invalid_message: 'A mensagem deve ter entre 10 e 5.000 caracteres.',
  verification_failed: 'Não foi possível validar a verificação de segurança. Tente novamente.',
};
const GENERIC_ERROR =
  'Não foi possível enviar sua mensagem agora. Tente novamente em instantes ou escreva para contato@axcellera.com.br.';

const fieldClass =
  'w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-coral disabled:bg-gray-100';

function loadTurnstile(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${TURNSTILE_SRC}"]`);
    const script = existing ?? document.createElement('script');
    script.addEventListener('load', () => resolve());
    script.addEventListener('error', () => reject(new Error('turnstile')));
    if (!existing) {
      script.src = TURNSTILE_SRC;
      script.async = true;
      document.head.appendChild(script);
    }
  });
}

export default function ContactForm() {
  const [status, setStatus] = React.useState<Status>('idle');
  const [errorMessage, setErrorMessage] = React.useState('');
  const [token, setToken] = React.useState('');
  const widgetRef = React.useRef<HTMLDivElement>(null);
  const widgetId = React.useRef<string>();

  React.useEffect(() => {
    if (!SITE_KEY) {
      console.error('VITE_TURNSTILE_SITE_KEY não definida: o formulário de contato não pode ser enviado.');
      return;
    }
    let cancelled = false;
    loadTurnstile()
      .then(() => {
        if (cancelled || !widgetRef.current || !window.turnstile) return;
        widgetId.current = window.turnstile.render(widgetRef.current, {
          sitekey: SITE_KEY,
          language: 'pt-br',
          callback: setToken,
          'expired-callback': () => setToken(''),
          'error-callback': () => setToken(''),
        });
      })
      .catch(() => setErrorMessage('Não foi possível carregar a verificação de segurança.'));
    return () => {
      cancelled = true;
      if (widgetId.current) window.turnstile?.remove(widgetId.current);
    };
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === 'sending') return;

    const form = e.currentTarget;
    const data = new FormData(form);
    setStatus('sending');
    setErrorMessage('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          message: data.get('message'),
          website: data.get('website'),
          turnstileToken: token,
        }),
      });
      const body = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        throw new Error(body.error ?? 'unknown');
      }
      form.reset();
      setStatus('sent');
    } catch (err) {
      const code = err instanceof Error ? err.message : 'unknown';
      setErrorMessage(ERROR_MESSAGES[code] ?? GENERIC_ERROR);
      setStatus('error');
    } finally {
      // O token do Turnstile é de uso único: gerar outro para uma nova tentativa.
      setToken('');
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
    }
  }

  const sending = status === 'sending';
  const canSubmit = !sending && Boolean(SITE_KEY) && Boolean(token);

  return (
    <form onSubmit={onSubmit} className="space-y-4" aria-describedby="contact-status">
      <div>
        <label htmlFor="contact-name" className="sr-only">Nome</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          placeholder="Nome"
          required
          maxLength={100}
          autoComplete="name"
          disabled={sending}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="contact-email" className="sr-only">E-mail</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          placeholder="E-mail"
          required
          maxLength={254}
          autoComplete="email"
          disabled={sending}
          className={fieldClass}
        />
      </div>
      <div>
        <label htmlFor="contact-message" className="sr-only">Mensagem</label>
        <textarea
          id="contact-message"
          name="message"
          placeholder="Mensagem"
          rows={4}
          required
          minLength={10}
          maxLength={5000}
          disabled={sending}
          className={fieldClass}
        ></textarea>
      </div>

      {/* Honeypot: invisível para pessoas; robôs costumam preenchê-lo. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', width: 1, height: 1, overflow: 'hidden' }}>
        <label htmlFor="contact-website">Não preencha este campo</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div ref={widgetRef} />

      <button
        type="submit"
        disabled={!canSubmit}
        className="w-full bg-coral-dark text-white px-6 py-3 rounded-md hover:bg-teal transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {sending ? 'Enviando…' : 'Enviar Mensagem'}
      </button>

      <p id="contact-status" role="status" aria-live="polite" className="text-sm min-h-[1.25rem]">
        {status === 'sent' && (
          <span className="text-teal">Mensagem enviada. Entraremos em contato em breve.</span>
        )}
        {(status === 'error' || errorMessage) && status !== 'sent' && (
          <span className="text-red-700">{errorMessage}</span>
        )}
      </p>
    </form>
  );
}
