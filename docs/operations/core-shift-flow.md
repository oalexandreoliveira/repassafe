# Fluxo central de repasse do MVP

## Resultado entregue

O fluxo cobre publicação normal ou urgente, edição antes da primeira candidatura,
cancelamento, candidatura idempotente, desistência, seleção exclusiva, confirmação
com prazo, aprovação institucional configurável e acordo final imutável.

## Regras operacionais

- O horário de negócio é `America/Fortaleza`; campos `datetime-local` são
  interpretados explicitamente nesse fuso e datas persistidas em `timestamptz`.
- Uma oferta iniciando em até 48 horas é classificada como urgente.
- Somente perfis aprovados com vínculo ativo no grupo podem publicar ou candidatar-se.
- O responsável nunca pode candidatar-se à própria oferta.
- A candidatura é única por profissional e oferta.
- Na publicação e em cada edição ainda permitida, o titular confirma
  expressamente que é responsável pela oferta e que os dados e condições estão
  corretos; essa confirmação fica na auditoria.
- A oferta só pode ser editada antes da primeira candidatura; depois disso, deve ser
  cancelada e republicada.
- A seleção bloqueia a oferta e cria um prazo fixo de confirmação de 30 minutos;
  o cliente não pode escolher nem ampliar esse prazo.
- O substituto só confirma após reconhecer que leu e aceita os dados e condições
  mostrados na oferta (horário, setor, valor e pagamento).
- Perfis administrativos não podem publicar, candidatar-se, selecionar ou
  confirmar substituições como médicos.
- Se o grupo exigir aprovação, apenas um membro ativo com papel `approver` pode
  decidir. O administrador da plataforma não decide em nome da instituição.
- Depois da confirmação final, o acordo é um snapshot imutável acompanhado de
  documento canônico SHA-256 e cadeia de eventos verificável. A página pode ser
  impressa/salva como PDF no navegador; o PDF ainda não é gerado/preservado pelo
  servidor e hashes não equivalem a assinatura qualificada ou garantia jurídica.

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

Uma rotina agendada processa a cada minuto confirmações vencidas e ofertas cujo
início passou, liberando a oferta quando o plantão ainda não começou. A expiração
gera auditoria e notificações ao titular e ao candidato selecionado. O banco também
valida o prazo dentro da transação de confirmação; consultas de disponibilidade
ignoram ofertas com início no passado.
