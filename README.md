# Axcellera — site institucional

Site estático (Vite + React + TypeScript + Tailwind) servido pela Cloudflare como
Worker com static assets. O Worker (`worker/index.ts`) só atende `POST /api/contact`,
que recebe o formulário de contato e envia o e-mail via Cloudflare Email Service.

## Desenvolvimento

```bash
npm ci
npm run dev          # só o front-end (o formulário não envia sem o Worker)
npm run typecheck    # tipos do front-end e do Worker
npm run lint
```

### Testar o formulário localmente

```bash
cp .dev.vars.example .dev.vars
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA npm run cf:dev
```

As chaves `1x…AA` são as chaves de teste públicas do Turnstile (sempre aprovam).

## Deploy (Cloudflare)

Build: `npm run build` — Deploy: `npx wrangler deploy` (ou `npm run deploy`).

Configuração necessária uma única vez:

1. **Turnstile**: criar um widget em *Turnstile* no painel da Cloudflare.
   - Chave do site (pública): definir em `.env.production` como `VITE_TURNSTILE_SITE_KEY=...`.
   - Chave secreta: `npx wrangler secret put TURNSTILE_SECRET_KEY`.
2. **Email Service**: o domínio `axcellera.com.br` precisa usar o DNS da Cloudflare e estar
   onboarded em *Compute → Email Service → Email Sending*. O remetente (`site@axcellera.com.br`)
   e o destinatário (`contato@axcellera.com.br`) estão em `wrangler.jsonc`.
3. **Domínio**: adicionar `axcellera.com.br` em *Settings → Domains & Routes* do Worker.

Sem `TURNSTILE_SECRET_KEY` o endpoint recusa os envios (falha fechada) em vez de operar sem antispam.
