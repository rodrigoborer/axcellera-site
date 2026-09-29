# Axcellera — site institucional

Site estático (Vite + React + TypeScript + Tailwind) servido pela Cloudflare como
Worker com static assets. O Worker (`worker/index.ts`) só atende `POST /api/contact`,
que recebe o formulário de contato e envia o e-mail pela API do Brevo. O e-mail do
domínio (Google Workspace) não é alterado.

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
2. **Brevo** (envio do formulário; o e-mail do domínio segue no Google Workspace):
   - Autenticar `axcellera.com.br` em *Senders, Domains & Dedicated IPs → Domains*: TXT do
     código Brevo, DKIM (dois CNAME) e DMARC. Não é preciso SPF nem mexer no MX. No DNS da
     Cloudflare, os CNAME do DKIM devem ficar como **DNS only** (nuvem cinza).
   - Se o domínio já tem um DMARC, **não** substitua: acrescente `rua=mailto:rua@dmarc.brevo.com`
     ao registro existente e preserve a política (`p=`).
   - Cadastrar `site@axcellera.com.br` como remetente, se o Brevo pedir.
   - Criar uma chave de API **exclusiva para o site** e defini-la como secret:
     `npx wrangler secret put BREVO_API_KEY`.
   - Desativar *Account → Security → Authorized IPs*: o Worker sai por IPs dinâmicos, e com a
     restrição ativa o Brevo passa a recusar as chamadas (o formulário retornaria erro).
3. **Domínio**: adicionar `axcellera.com.br` em *Settings → Domains & Routes* do Worker.

Sem `TURNSTILE_SECRET_KEY` ou sem `BREVO_API_KEY` o endpoint recusa os envios (falha fechada).
