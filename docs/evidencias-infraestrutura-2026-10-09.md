# Evidências de infraestrutura — staging (P0-08 e P0-01)

Data: 09/10/2026 · Fonte: capturas do painel do Supabase e resultado de consulta SQL enviados pelo responsável.
Alvo: projeto `repassafe-staging`. Produção: não provisionada. Nenhuma chave ou segredo foi recebido.

## 1. O que o painel mostra

| Item | Evidência | Leitura |
| --- | --- | --- |
| Plano | Organização com selo **FREE** | Sem backups automáticos, sem PITR; sujeita a pausa por inatividade |
| Região | Primary Database, **East US (Ohio), us-east-2** | Fora do Brasil (LGPD, transferência internacional — decisão L-7) |
| Computação | **NANO** (t3a.nano); CPU 3 %, disco 14 %, RAM 53 %, 7/60 conexões | Capacidade mínima; RAM já em 53 % com pouco uso |
| Saúde | Status **Healthy** | — |
| Backups | "Last backup: **No backups**"; mensagem "Free Plan does not include project backups" | **Não existe backup do provedor.** Só o backup lógico manual do script |
| Migrations | "Last migration: shift_end_notifications" | Consistente com a consulta abaixo |
| GitHub | "No repository connected" | Sem integração; migrations vão por CLI |
| Branch | Rótulo "main — **PRODUCTION**" | É o rótulo padrão da branch principal do Supabase; **não** significa produção do Repassafe. Ver observação 2 |
| Storage | Buckets `agreement-receipts` (2 políticas, 4 MB, JPEG/PNG/PDF), `profile-photos` (0, 2 MB, JPEG/PNG/WebP), `professional-documents` (0, 10 MB, PDF/JPEG/PNG) | `agreement-receipts` confere com a migration. Nenhum selo "Public" visível, compatível com buckets privados (confirmar abrindo cada bucket). Os dois sem política não têm acesso direto por cliente |
| Auth | Confirmação de e-mail obrigatória: **sim** | Confere com o código (`email_confirmed_at`) |
| Auth | Segunda captura (Sign In / Providers): cadastro aberto **ligado**; confirmação de e-mail **ligada**; login anônimo **desligado**; vínculo manual **desligado**; provedores: Email **ativo**, Phone, SAML e Web3 **desativados** | Confere com o código (só e-mail e senha). Cadastro aberto é coerente com o produto, a barreira é a verificação profissional |
| Auth (provedor Email) | **Tamanho mínimo de senha: 6**; requisitos de caracteres: **nenhum**; **Secure password change: desligado**; **Require current password when updating: desligado**; **Prevent use of leaked passwords: desligado** (recurso do plano Pro); Secure email change: ligado; OTP de e-mail: 8 dígitos, validade 3600 s | **Fraco para sustentar reautenticação por senha** (ver §4, item 5). O app exige 8 caracteres no formulário, mas o Auth aceita 6 por chamada direta à API |
| Auth | MFA TOTP | **Sem informação** (página Multi-Factor não enviada) |
| Storage (público) | `professional-documents`, `agreement-receipts`, `profile-photos`: **Public bucket desligado** nos três | **Confirmado: buckets privados**, com limites de tamanho e tipos de arquivo ativos |
| Usuários | Responsável informou: **não há usuários reais** | Staging é só de teste |
| Storage (conteúdo) | `profile-photos` contém **2 pastas** com UUIDs de usuários; `professional-documents` está **vazio** | Há pelo menos 2 contas com foto; falta saber se são de teste. Nenhum documento profissional armazenado |

## 2. Migrations no staging (P0-01)

A consulta ao histórico retornou **25 versões**, de `20260806130000` a `20261008120000`, **idênticas às 25 do
repositório** (inclusive `20261001120000`, `20261007034010`, `20261007150000`, `20261007150100` e
`20261008120000`). **Conclusão: o staging está em dia; a deriva (A3) existe só no banco local de desenvolvimento.**
Resta alinhar o banco local (aplicar as 4 pendentes e registrar o histórico) — depende de autorização.

## 3. Criptografia e disponibilidade (documentação oficial)

- Criptografia: o Supabase declara criptografia em repouso com AES-256 e em trânsito por TLS
  ([Security at Supabase](https://supabase.com/security)). É característica da plataforma; o painel não a exibe e
  eu não a verifiquei tecnicamente. Ela protege o disco, **não** impede leitura por quem tem credencial válida.
- Backups: a página de preços lista backups automáticos e PITR como **não incluídos no Free**
  ([Pricing](https://supabase.com/pricing.md)); coincide com o painel.
- Pausa: projetos Free podem ser **pausados após 7 dias de baixa atividade**; a restauração é possível por até 90
  dias ([Project Pausing](https://supabase.com/docs/guides/platform/free-project-pausing)).

## 4. Impactos no plano e na matriz

1. **SEG-004 (backups) e TC-012:** o RPO "24 horas com backup diário" de `docs/operations/backup-restore.md`
   **não se aplica ao staging**; só vale como meta de um plano pago. No Free, a única cópia é a lógica manual
   (última validada: 30/09/2026). Se houver usuários reais no staging, **não há recuperação fora desse dump**.
2. **R12 (indisponibilidade):** pausa por inatividade e computação NANO são riscos de disponibilidade. Como **não há
   usuários reais**, o Free é aceitável **hoje**; deixa de ser aceitável **antes do primeiro dado real** (piloto).
   A urgência de backup e plano pago é, portanto, um **gate de entrada do piloto**, não de agora (SEG-003/004, L-7).
3. **SEG-002:** passa de "não verificado" para "**declarado pelo provedor**" (AES-256/TLS), com a ressalva acima.
4. **L-7 (infraestrutura):** a decisão deixa de ser opcional para o piloto: plano pago (backup diário e depois PITR),
   região (`sa-east-1`) e destino off-site do backup lógico.
5. **Auth × ADR-013 (reautenticação por senha).** A evidência só vale se a senha for difícil de contornar. Hoje:
   (a) mínimo de **6** caracteres, sem requisitos, aceito pela API mesmo que o formulário peça 8;
   (b) **troca de senha sem exigir a senha atual** e sem "sessão recente": quem tomar uma sessão aberta troca a senha
   e passa a "reautenticar" legitimamente; (c) sem checagem de senhas vazadas (só no Pro).
   **Ajustes recomendados no painel (você executa; não tenho acesso):** mínimo ≥ 8 (idealmente 10) com exigência de
   letras e números; ligar **Require current password when updating** e **Secure password change**.
   **Configuração fora do repositório:** `supabase/config.toml` não define as regras de senha nem de confirmação de
   e-mail, então essas regras existem só no painel e podem divergir entre ambientes. Proposta: declará-las no
   `config.toml` e promover (precisa de autorização).

## 5. Pendências deste item

- Authentication → **Multi-Factor**: situação do TOTP (única informação ainda em aberto).
- Decidir os ajustes de senha do item 5 acima.
- ~~Usuários reais~~ respondido (não há). ~~Buckets públicos~~ respondido (todos privados).
