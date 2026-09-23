# Operação de suporte do piloto

## Canais e SLA

O suporte é assistido e não é anunciado como 24x7. Canais oficiais: e-mail de
suporte e, apenas para incidentes críticos, WhatsApp administrativo. Primeiro
retorno para ocorrência grave: até 4 horas dentro do horário publicado.

## Protocolo mínimo

1. gerar identificador `SUP-AAAA-NNNN` no registro externo aprovado;
2. registrar solicitante, horário, ambiente, categoria e impacto;
3. solicitar `x-request-id`, horário e tela — nunca senha, token ou dado clínico;
4. classificar S1–S4 e vincular incidente quando aplicável;
5. registrar cada acesso administrativo e decisão tomada;
6. comunicar solução, contorno ou próxima atualização;
7. encerrar apenas após confirmação ou duas tentativas documentadas.

US-1105 permanece pós-piloto no escopo oficial; por isso o registro é externo e
assistido. Não criar tickets em ferramentas pessoais nem copiar banco ou logs
inteiros para o atendimento.

## Diagnóstico seguro

- localizar logs pelo `x-request-id` e intervalo;
- confirmar status em `/api/health` e `/api/ready`;
- verificar eventos de auditoria na administração MFA;
- reproduzir somente com dados fictícios em homologação;
- escalar suspeita de acesso indevido imediatamente como S1.

Suporte não pode aprovar repasse em nome da instituição, alterar acordo imutável,
pedir credenciais nem executar SQL manual em produção.
