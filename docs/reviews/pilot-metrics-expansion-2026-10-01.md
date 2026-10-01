# Expansão pós-MVP: métricas do piloto

## Estado do cadastro expandido

A expansão do cadastro pode ser considerada implementada e concluída conforme o
relatório de validação de 29/09/2026: fluxo, decisões profissionais,
independência das autorizações, cobertura de segurança, CI e promoção ao
staging foram registrados em
`registration-release-validation-2026-09-29.md`. A confirmação de telefone
permanece operacionalmente pendente: a integração está implementada, mas exige
configuração do provedor SMS; o relatório não declara entrega real de OTP.

## Próxima entrega

O recorte executivo do MVP adia `US-1302` (dashboard do piloto) e `US-1303`
(exportação consolidada) para depois do piloto. Os eventos mínimos do funil já
estão armazenados sem identificadores de pessoas; apresentá-los em forma
agregada é uma expansão com dependências menores que reputação pública,
pagamentos ou integrações externas.

Esta entrega adiciona uma área administrativa com períodos de 30, 90 e 365 dias,
filtro por grupo, indicadores de cadastro, aprovação, oferta, candidatura,
confirmação, conclusão, cancelamento/desistência/expiração e ocorrência. Inclui
três taxas descritivas e exportação CSV consolidada. A agregação ocorre no
Postgres e o acesso à função é restrito ao `service_role`; a tela continua
protegida pela concessão administrativa e MFA existentes.

As taxas comparam eventos no mesmo intervalo de calendário, não coortes de
ofertas. Portanto não são estimativas de conversão por oferta nem metas de
desempenho. O painel não calcula nota/reputação nem expõe avaliações
individuais.

## Publicação

A aplicação depende da migration
`20261001120000_pilot_metrics_aggregation.sql`. A migration e a interface devem
ser promovidas juntas; o dashboard reportará erro de carregamento se a função
ainda não estiver disponível no ambiente.
