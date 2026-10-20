# ADR-013: Confirmação de transação por senha; MFA preparado; PIN não adotado

- Status: **aceito** (revisa a versão de 09/10/2026 que propunha PIN)
- Data: 09/10/2026 · Decisor: responsável pelo projeto
- Origem: pendência L-3 de [plano-adequacao.md](../plano-adequacao.md)

## Decisão

1. **Não adotar PIN de 4 dígitos.** Após a análise de risco (abaixo), o responsável optou por manter a **senha**.
2. Os atos que geram compromisso (criar/aceitar/aprovar acordo, confirmar substituição, informar/confirmar
   pagamento e recebimento) passarão a exigir **reautenticação por senha** no momento do ato.
3. **MFA (TOTP) fica preparado**, não ativado: o nível de autenticação exigido será uma **política por tipo de
   ato**, para elevar depois (ex.: senha → senha + TOTP) sem alterar os chamadores.
4. O evento de cada ato registra **o método** (`session`, `password`, `totp`) e o instante, nunca a credencial.

## Por que não o PIN

Um PIN de 4 dígitos tem 10.000 combinações. Hash forte não o protege se a tabela vazar (força bruta offline); a
proteção real seria limitar tentativas online no servidor (contador atômico, atraso crescente, bloqueio
temporário, Argon2id) e ainda assim ele é "algo que se sabe", como a senha, sem ser segundo fator. O ganho
(credencial separada da de login) não compensou a superfície extra de segurança e de suporte (redefinição, bloqueio).

## Requisitos da reautenticação por senha

- Verificar a senha **no servidor** com o mecanismo do Supabase Auth, sem trocar a sessão do usuário nem aceitar
  o valor de um cliente ("fresh auth"): janela curta (ex.: 5 minutos) registrada no servidor, por ato.
- Limitar tentativas por usuário (hoje há rate limit de login por IP/e-mail: `docs/security/session-mfa-rate-limit.md`);
  falha não revela se a conta existe.
- Não registrar a senha, nem seu hash, no evento; registrar `method`, `verified_at` e identificador da sessão.
- Mensagem de UX curta e sem culpa; o ato não perde os dados preenchidos.

## Preparação do MFA

Política declarativa por ato, p.ex. `acordo.aceitar → ["password"]`, evoluindo para `["password","totp"]`.
TOTP já está habilitado no Supabase local (`supabase/config.toml`) e exigido de administradores. Gatilhos para
elevar a exigência: contratação de provedor (ADR-012), valores altos, parecer jurídico.

## Pontos em aberto

Duração da janela de reautenticação; tratamento de contas que entram por convite/link mágico sem senha
(se existirem); registro das falhas (AUD-006) sem dado sensível.
