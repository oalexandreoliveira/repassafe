# Fluxo central de repasse do MVP

## Resultado entregue

O fluxo cobre publicação normal ou urgente, edição antes da primeira candidatura,
cancelamento, candidatura idempotente, desistência, seleção exclusiva, confirmação
com prazo, aprovação institucional configurável e acordo final imutável.

## Regras operacionais

- O horário de negócio é `America/Fortaleza`; datas são persistidas em `timestamptz`.
- Uma oferta iniciando em até 48 horas é classificada como urgente.
- Somente perfis aprovados com vínculo ativo no grupo podem publicar ou candidatar-se.
- O responsável nunca pode candidatar-se à própria oferta.
- A candidatura é única por profissional e oferta.
- A oferta só pode ser editada antes da primeira candidatura; depois disso, deve ser
  cancelada e republicada.
- A seleção bloqueia a oferta e cria um prazo de confirmação de 30 minutos.
- Se o grupo exigir aprovação, apenas um membro ativo com papel `approver` pode
  decidir. O administrador da plataforma não decide em nome da instituição.
- Depois da confirmação final, o acordo é um snapshot imutável.

## Segurança e concorrência

O navegador só insere linhas em `workflow_commands`. Um gatilho `SECURITY DEFINER`
no schema privado valida `auth.uid()`, perfil, vínculo, propriedade e estado. Todas
as alterações e o evento de auditoria acontecem na mesma transação. As linhas
disputadas são bloqueadas com `FOR UPDATE`, e restrições únicas impedem duas
seleções ou candidaturas duplicadas mesmo sob concorrência.

As tabelas de domínio têm RLS, grants explícitos e nenhuma permissão direta de
insert/update/delete para usuários autenticados. Funções privadas não possuem
permissão de execução para `public`, `anon` ou `authenticated`.

## Expiração

Antes de qualquer novo comando, o processador libera seleções cujo prazo venceu e
expira ofertas já iniciadas. As consultas de disponibilidade também ignoram ofertas
com início no passado. Uma rotina agendada poderá antecipar a atualização visual
sem depender do próximo comando, sem alterar as regras de consistência.
