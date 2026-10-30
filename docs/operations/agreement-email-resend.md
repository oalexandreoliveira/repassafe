# Envio dos registros pelo Resend

Implementação: 30/10/2026. Domínio `auth.repassafe.com.br` informado pelo responsável como verificado. Remetente adotado: `Repassafe <registros@auth.repassafe.com.br>`.

## Configuração e ativação

1. Aplicar as migrações pendentes em ordem, primeiro em homologação, incluindo `20261030144738_tester_feedback.sql` e a correção posterior de privilégios `20261030170000_payment_events_service_role_privileges.sql`. O código novo de publicação depende da migração de feedback; a correção posterior revoga permissões de escrita direta que podem ser herdadas dos privilégios padrão do Supabase.
2. Configurar no gerenciador de segredos do servidor: `RESEND_API_KEY` com permissão de envio, `AGREEMENT_EMAIL_JOB_TOKEN` aleatório com pelo menos 32 caracteres e `AGREEMENT_EMAIL_FROM` com o remetente acima. Nunca usar prefixo `NEXT_PUBLIC_` para as chaves.
3. Configurar `NEXT_PUBLIC_APP_URL` com a origem HTTPS publicada e `AGREEMENT_EMAIL_ENABLED=true`. A origem local HTTP é rejeitada pelo trabalhador.
4. Configurar um agendador para fazer **POST** em `/api/jobs/agreement-emails` a cada cinco minutos, com `Authorization: Bearer <AGREEMENT_EMAIL_JOB_TOKEN>`. Esse endpoint não exige sessão de usuário e autentica o token com comparação de tempo constante. Não colocar o token na URL. Não há agendador criado automaticamente por este código.
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

Monitorar códigos HTTP do job: 401 indica token ausente/incorreto; 503 indica indisponibilidade; 200 retorna `configured`, `accepted` e `failed`. Um resultado `configured: false` exige corrigir a configuração, não indica envio concluído.

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
