# Grupos de colegas

Data: 2026-10-08 · Decisão do produto: "o usuário deve poder criar grupos".

## Objetivo

Levar para o Repassafe os grupos em que os médicos já combinam repasses (hoje
no WhatsApp), mantendo o registro do acordo. O WhatsApp continua sendo o canal
de divulgação: o gestor compartilha o link de convite e os plantões do grupo.

## Dois tipos de grupo

| | Grupo de colegas (`peer`) | Grupo institucional (`institutional`) |
|---|---|---|
| Quem cria | Médico com cadastro aprovado e vigente | Administração do Repassafe |
| Instituição | Não tem | Obrigatória |
| Aprovação da coordenação | Nunca | Configurável (`requires_approval`) |
| Papéis | Gestor (um) e membros | Médicos e aprovadores |
| Entrada | Link de convite | Vínculo registrado pela administração |
| Lista de membros | Visível aos membros (nome e "CRM verificado") | Não exposta |

Um grupo de colegas **não concede autorização institucional**. A
independência entre identidade, habilitação profissional, autorização
institucional e concessão administrativa
(`registration-full-spec-review.md`) continua valendo.

## Regras

- **Criação:** médico (`role = doctor`) com perfil `approved` e
  `verification_valid_until` futuro. Quem cria vira o gestor. Limite de 10
  grupos ativos geridos por pessoa. Nome com 3 a 80 caracteres, espaços
  normalizados.
- **Convites:** só o gestor gera e revoga. Validade de 24 horas, 7 ou 30 dias.
  Até 500 usos, no máximo 10 links ativos por grupo. O banco guarda só o hash
  SHA-256 do token; o link aparece uma única vez para o gestor. O token é
  derivado no servidor (HMAC do pedido), nunca escolhido pelo cliente.
- **Entrada:** direta, sem aprovação do gestor (decisão de 2026-10-07), para
  médicos com cadastro aprovado e vigente. O gestor recebe uma notificação.
  Limite de 500 membros ativos.
- **Remoção:** o gestor encerra o vínculo; a pessoa é notificada. Ela só volta
  com um convite emitido depois da remoção.
- **Gestão:** um único gestor ativo. Transferir troca os papéis; o novo gestor
  precisa ter cadastro vigente. O gestor só sai depois de transferir, exceto
  quando é o único membro: nesse caso sair arquiva o grupo.
- **Arquivamento:** bloqueado enquanto houver plantões abertos ou em seleção.
  Revoga os convites; ninguém mais publica ou entra. Plantões, acordos e
  histórico continuam disponíveis.
- **Plantões no grupo:** o fluxo é o mesmo dos grupos institucionais sem
  aprovação. Só membros ativos veem e se candidatam, e o acordo é registrado
  quando o substituto confirma. O documento do acordo registra o nome do grupo,
  com `institution_name` nulo.
- **Login:** quem abre o convite sem sessão vai para `/entrar?proximo=…` e volta
  ao convite depois do login. Só caminhos `/grupos/convite/<token>` são
  aceitos como destino.

## Implementação

- Banco: `20261007150000_peer_group_kinds.sql` e
  `20261007150100_peer_groups.sql`. Leitura por `group_context` e
  `group_invite_preview`; escrita por `group_command` (idempotente por pedido,
  30 comandos por minuto, auditado em `audit_events`). Testes em
  `supabase/tests/peer_groups.sql`.
- Telas: `/grupos`, `/grupos/novo`, `/grupos/[id]`, `/grupos/convite/[token]`,
  com prévias em `/dev/telas` (grupos, grupo-gestor, grupo-membro,
  grupo-institucional, convite e variações).
- A administração vê os grupos de colegas identificados como tal, pode
  renomear, desativar vínculos e definir um novo gestor. Não pode criar
  aprovadores nem exigir aprovação neles; o banco também recusa.

## Fora do escopo

- Aprovação de entrada pelo gestor (pode ser adicionada com um estado
  pendente no vínculo).
- Vários gestores por grupo, convite por e-mail ou CRM, chat no grupo.
- Converter grupo de colegas em institucional (o tipo é imutável).
