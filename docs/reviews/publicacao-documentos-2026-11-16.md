# Publicação dos documentos 2026-11-16

Data: 16/11/2026, fim da tarde em Fortaleza.

## O que foi publicado

- Commit `8eb0b51` da `main` (#50): Termos e Política versão 2026-11-16.
  - A Política passa a citar as mensagens de acesso à conta enviadas pelo
    Resend: confirmação de cadastro, recuperação de senha, troca de e-mail e
    convites.
  - Os dois documentos incluem o arquivo para a agenda do celular e o repasse a
    partir da agenda (#44).
- Origem da mudança: o SMTP do Supabase Auth no projeto publicado é o Resend
  (`smtp.resend.com`, remetente `acesso@auth.repassafe.com.br`), conferido no
  painel em 16/11/2026. Os avisos de segurança do Auth estão desligados.
- Supabase `gfcbnfzyucggdwjtybnm`: `supabase db push --linked` (CLI 2.117.0)
  aplicou `20261116210000_legal_documents_2026_11_16`, após ensaio com
  `--dry-run`.
- Vercel: o Preview `repassafe-staging-qvzujopyy` foi promovido e gerou o
  deploy de produção `repassafe-staging-hmj4rkl9l`, que serve
  `www.repassafe.com.br`. Retorno disponível: `repassafe-staging-94135m3lr`.

## Antes

- Backup lógico do banco publicado com `supabase db dump --linked` (esquema,
  dados de `public` e `private`, papéis e manifesto com SHA-256), guardado fora
  do repositório.
- CI do #50 aprovado em todas as etapas, inclusive `supabase test db`, e2e,
  lint e advisors de segurança.
- Histórico remoto completo até `20261116120000`; só a migration nova pendente.

## Verificação

- Banco:
  - última migration `20261116210000`;
  - `registration_submit` aceita a versão 2026-11-16, a 2026-11-15 até
    18/11/2026 0h em Fortaleza e a 2026-09-29 até 17/11/2026 0h;
  - aviso `legal.updated` da nova versão entregue às 4 contas existentes;
  - Security Advisors só com o alerta já existente de proteção contra senhas
    vazadas no Auth.
- Público:
  - `/api/health` 200 e `/api/ready` 401 sem token;
  - `/entrar`, `/cadastro`, `/lista-de-espera`, `/termos` e `/privacidade` 200;
  - os dois documentos mostram a versão 2026-11-16 e o resumo das mudanças, e a
    Política mostra as mensagens de acesso;
  - o sitemap traz `lastmod` 2026-11-16 nos dois documentos;
  - `/agenda` sem sessão leva a `/entrar`.

## Limites

- Sem teste autenticado em produção: não há conta de teste autorizada nesse
  ambiente. O aceite e o envio do cadastro foram validados no banco local
  descartável com contas sintéticas.
- Os modelos de e-mail do Auth continuam no padrão do Supabase, em inglês.
- Pendentes nas minutas: encarregado, região e prazos de retenção.
