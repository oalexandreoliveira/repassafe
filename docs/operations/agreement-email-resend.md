# Envio dos registros pelo Resend

Implementação: 30/10/2026. Domínio `auth.repassafe.com.br` informado pelo responsável como verificado. Remetente adotado: `Repassafe <registros@auth.repassafe.com.br>`.

## Configuração e ativação

1. Aplicar as migrações pendentes em ordem, primeiro em homologação, incluindo `20261030144738_tester_feedback.sql` e a correção posterior de privilégios `20261030170000_payment_events_service_role_privileges.sql`. O código novo de publicação depende da migração de feedback; a correção posterior revoga permissões de escrita direta que podem ser herdadas dos privilégios padrão do Supabase.
2. Configurar no gerenciador de segredos do servidor: `RESEND_API_KEY` com permissão de envio, `AGREEMENT_EMAIL_JOB_TOKEN` aleatório com pelo menos 32 caracteres e `AGREEMENT_EMAIL_FROM` com o remetente acima. Nunca usar prefixo `NEXT_PUBLIC_` para as chaves.
3. Configurar `NEXT_PUBLIC_APP_URL` com a origem HTTPS publicada e `AGREEMENT_EMAIL_ENABLED=true`. A origem local HTTP é rejeitada pelo trabalhador.
4. Configurar um agendador para fazer **POST** em `/api/jobs/agreement-emails` a cada minuto, com `Authorization: Bearer <AGREEMENT_EMAIL_JOB_TOKEN>`. O intervalo curto existe por causa do prazo de 30 minutos dos [avisos críticos](#avisos-críticos); o mesmo endpoint processa as duas filas. Esse endpoint não exige sessão de usuário e autentica o token com comparação de tempo constante. Não colocar o token na URL. Não há agendador criado automaticamente por este código, porque URL e token variam por ambiente e clones não podem enviar. Veja o [exemplo de agendador](#exemplo-de-agendador).
5. Em homologação, confirmar um acordo entre duas contas de teste autorizadas, incluindo a aprovação institucional quando exigida. Verificar dois itens na fila e os links recebidos pelas duas contas. Testar também uma falha temporária do provedor e uma nova tentativa com a mesma chave. Desabilitar o envio em ambientes clonados com dados reais.

O remetente foi preenchido em `.env.example` e no ambiente local. A chave de API não estava configurada localmente na verificação desta entrega; nenhum e-mail real foi enviado. A verificação do domínio foi informada pelo responsável, não consultada por API.

## Garantias e limites

- A fila é criada na transação da confirmação final, nos fluxos do mural e do registro direto, somente para e-mails confirmados das duas partes. Nenhum envio para candidatos, coordenadores ou terceiros.
- Erro no provedor não desfaz o acordo. O trabalhador envia um resumo mínimo com link autenticado. Não anexa PDF nem comprovante de pagamento; o registro permite impressão no navegador.
- Processa até cinco itens por execução, com timeout de oito segundos por chamada e intervalo mínimo de cinco minutos para repetir uma tentativa.
- A aquisição compara estado e contador de tentativas, evitando que duas execuções enviem o mesmo item simultaneamente. O corpo é congelado antes da primeira chamada. A chave Resend `agreement/<id-da-fila>` é reutilizada nas tentativas.
- Resend conserva chaves por 24 horas; o app interrompe tentativas ambíguas após 23 horas desde a primeira tentativa. Itens passam a `uncertain` para reconciliação, evitando um reenvio cego depois dessa janela. Consulte a [documentação de idempotência do Resend](https://resend.com/docs/dashboard/emails/idempotency-keys).
- `sent` significa **aceito pela API do provedor**, não entregue na caixa de entrada. Não foram implementados webhooks de entrega, bounce ou reclamação. Consulte o painel do Resend para esses eventos.
- A fila não preenche retroativamente acordos existentes. O snapshot do destinatário é capturado na confirmação; mudanças de e-mail posteriores não alteram uma tentativa já iniciada.

## Operação

Monitorar códigos HTTP do job: 401 indica token ausente/incorreto; 503 indica indisponibilidade; 200 retorna `critical` e `agreements`, cada um com `configured`, `accepted` e `failed`. Um resultado `configured: false` exige corrigir a configuração ou indica fila ainda desligada, não envio concluído.

Consulta restrita à operação autorizada (não expor por endpoint público):

```sql
select state, count(*), min(created_at) as oldest
from public.agreement_email_deliveries
group by state;

select id, state, attempts, first_attempt_at, attempted_at, provider_id, last_error
from public.agreement_email_deliveries
where state in ('failed', 'uncertain', 'sending')
order by created_at;
```

Itens `failed` elegíveis são reprocessados pelo próximo POST. Em `uncertain`, verificar no Resend se a tentativa já foi aceita; não apagar o item, zerar tentativas ou trocar a chave automaticamente. Se houver confirmação externa, reconciliar o estado e o identificador do provedor de forma auditável pela operação. Um novo envio deliberado exige decisão da operação após essa consulta.

Para interromper envios, usar `AGREEMENT_EMAIL_ENABLED=false` e pausar o agendador. Preservar fila, eventos e acordos. Antes de reativar uma fila antiga, revisar destinatários e tentativas ambíguas. Migração de pagamento e frontend devem ser publicados juntos; reverter somente o frontend antigo deixa a publicação incompatível com a nova exigência de vencimento.

### Exemplo de agendador

Supabase Cron com `pg_net` e Vault, executado apenas no ambiente que deve enviar. Exemplo não executado nesta entrega; `pg_net` não está habilitado no banco local.

```sql
select cron.schedule(
  'dispatch-transactional-emails', '* * * * *',
  $$select net.http_post(
      url := 'https://www.repassafe.com.br/api/jobs/agreement-emails',
      headers := jsonb_build_object('Authorization', 'Bearer ' ||
        (select decrypted_secret from vault.decrypted_secrets where name = 'email_job_token')),
      timeout_milliseconds := 55000)$$
);
```

## Avisos críticos

Implementação: 03/11/2026 (US-1003). Segunda fila, `notification_email_deliveries`, alimentada por gatilho nas notificações internas. Ativação própria com `CRITICAL_EMAIL_ENABLED=true`; usa a mesma chave, o mesmo remetente e o mesmo token do job.

**Antes de ativar:** a política de privacidade vigente (`src/features/registration/legal.ts`) cita Supabase e Vercel, mas não o Resend, que passa a receber e-mails de todas as pessoas nesses fluxos. Atualizar o texto e sua versão com revisão jurídica. Depois, testar em homologação com contas autorizadas: seleção, expiração, recusa, cancelamento e decisão de cadastro.

| Evento | Quem recebe | Validade do aviso |
| --- | --- | --- |
| Seleção do substituto | Substituto | Até o prazo de confirmação |
| Candidatura recebida | Titular, no máximo um por oferta a cada hora | 23 horas |
| Aprovação pendente, inclusive de acordo registrado | Aprovadores ativos do grupo | 23 horas |
| Recusa do candidato ou prazo de confirmação encerrado | Titular | 23 horas |
| Rejeição institucional | Titular e substituto | 23 horas |
| Cancelamento ou desistência de repasse confirmado | Outra parte e aprovadores de grupo com aprovação | 23 horas |
| Decisão sobre o cadastro | Profissional | 23 horas |

Fora desta fila, só no app: nova oferta publicada (em oferta livre alcançaria todos os perfis aprovados), conclusão do plantão, pagamento, avaliação, grupos, ocorrências administrativas e demais atualizações de acordo registrado.

- O e-mail é um resumo mínimo com link autenticado: sem setor, local, valor, nomes ou campos livres. A decisão sobre o cadastro não é informada no corpo.
- Processa até dez itens por execução, com os prazos mais curtos primeiro. Repete uma tentativa após um minuto, com a mesma mensagem e a chave `notification/<id-da-fila>`. A execução não inicia novos envios depois de 45 segundos; os registros de acordo usam o tempo que sobrar.
- Depois da validade, o aviso não sai: passa a `expired`, ou a `uncertain` se já houve tentativa sem confirmação. Isso evita pedir uma ação cujo prazo acabou e também uma rajada de avisos antigos ao religar o envio. Nenhum dos dois estados exige reenvio; o estado na aplicação continua sendo a fonte de verdade.
- A fila não preenche notificações antigas. Só recebem endereços confirmados. Como em toda a fila, `sent` é aceitação pela API do provedor, não prova de entrega. Um e-mail não substitui a confirmação dentro do prazo, e o titular continua podendo avisar o substituto por outro canal.
- Prazo de retenção da fila segue pendente de P0-06, junto aos demais dados operacionais.

```sql
select template, state, count(*), min(created_at) as oldest
from public.notification_email_deliveries
group by template, state
order by template, state;

select id, template, state, attempts, expires_at, attempted_at, provider_id, last_error
from public.notification_email_deliveries
where state in ('failed', 'uncertain', 'sending')
order by expires_at;
```

Para interromper apenas os avisos, usar `CRITICAL_EMAIL_ENABLED=false`. Os registros de acordo continuam. Depois de reverter o frontend, a migração pode permanecer: a fila só acumula linhas, que não são enviadas depois da validade.
