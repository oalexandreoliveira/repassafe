# Operação de suporte do piloto

## Canais e SLA

O suporte é assistido e não é anunciado como 24x7. O canal implementado é
`/suporte`, com assuntos de atendimento e privacidade, protocolo UUID e fila
`/admin/suporte` protegida por MFA. Não há e-mail ou WhatsApp oficial
configurado nem SLA publicado nesta entrega. O responsável é Alexandre Oliveira.

## Protocolo mínimo

1. registrar o protocolo UUID gerado pelo formulário;
2. registrar solicitante, horário, ambiente, categoria e impacto;
3. solicitar `x-request-id`, horário e tela — nunca senha, token ou dado clínico;
4. classificar S1–S4 e vincular incidente quando aplicável;
5. registrar cada acesso administrativo e decisão tomada;
6. comunicar solução, contorno ou próxima atualização;
7. encerrar apenas após confirmação ou duas tentativas documentadas.

A expansão do cadastro implementa o registro interno necessário para esta
jornada. Solicitações vinculadas à conta permitem acompanhar a resposta no site;
solicitações sem conta registram contato para atendimento assistido. Não há
envio automático por e-mail. Não copiar banco ou logs inteiros para atendimento.

## Diagnóstico seguro

- localizar logs pelo `x-request-id` e intervalo;
- confirmar status em `/api/health` e `/api/ready`;
- verificar eventos de auditoria na administração MFA;
- reproduzir somente com dados fictícios em homologação;
- escalar suspeita de acesso indevido imediatamente como S1.

Suporte não pode aprovar repasse em nome da instituição, alterar acordo imutável,
pedir credenciais nem executar SQL manual em produção.
