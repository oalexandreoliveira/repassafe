# Pesquisa de fornecedores — carimbo do tempo e assinatura eletrônica

Data: 09/10/2026 · Apoia [ADR-012](adr/ADR-012-ancora-de-tempo-e-provedor-de-assinatura.md) · **Nenhum contrato, cadastro ou chave foi criado.**

## Como ler

Pesquisa web de fontes abertas, sem contato comercial. Preços e funcionalidades mudam e **várias informações vêm
de comparativos de concorrentes ou páginas antigas**; marquei o grau de confiança. Nada aqui é recomendação de
compra: serve para montar a lista de cotação. Itens "a confirmar" exigem resposta escrita do fornecedor.

## 1. Carimbo do tempo (prioridade — ADR-012)

### 1.1 O que se precisa

Carimbo RFC 3161 sobre um hash SHA-256 (envio só do hash), com autoridade **credenciada na ICP-Brasil (ACT)** para
produção, API estável, recibo (token TSR) verificável offline, contrato com SLA e tratamento de dados (LGPD).
Fonte normativa do credenciamento: DOC-ICP-03 do ITI (exige sede e instalações no Brasil, ou PSS que as possua).

### 1.2 Candidatos encontrados

| Fornecedor | O que a pesquisa mostrou | Preço | Confiança |
| --- | --- | --- | --- |
| **Serpro (ACT SERPRO)** | Requisição/resposta no padrão TSQ/TSR; SHA-256; até 200 req/s por SCT em 4 SCT; exatidão declarada de 500 ms; pode ser adquirido online na loja e usado como API ([ACT Serpro](https://www.serpro.gov.br/links-fixos-superiores/pss-serpro/actserpro/), [notícia](https://serpro.gov.br/menu/noticias/noticias-2024/carimbo-do-tempo)) | Não publicado nos resultados; consultar loja/consultor | Boa (fonte oficial) |
| **Certisign** | Habilitada a emitir carimbo e a atuar como PSS de terceiros. Proposta de 2018 a uma universidade: R$ 0,90 por carimbo (até 1.000) caindo a R$ 0,14 (300.001–500.000), mais manutenção anual de R$ 1.150 a R$ 7.000 ([proposta](https://projetossti.ufpe.br/attachments/download/432/proposta_comercial%20carimbo_tempo_v1%20-%20certsign.pdf)) | **Só referência histórica de 2018** | Baixa para preço |
| **Imprensa Oficial / Prodesp** | Prodesp declara-se ACT credenciada; documentos de política (PCT/DPCT) publicados ([Prodesp](https://solucoes.prodesp.sp.gov.br/wp-content/uploads/2022/08/carimbodotempo-it.pdf)) | A confirmar | Média |
| **ONR** | Existe política de carimbo (PCT) publicada ([PCT ONR](https://act.onr.org.br/PCT%20ONR-%20versao%201.1.pdf)); escopo para terceiros a confirmar | A confirmar | Baixa |
| **Valid** | Citada como ACT desde 2014 em artigo antigo; sem documentação atual na pesquisa | A confirmar | Baixa |

**Lacunas:** não encontrei a **lista oficial atual de ACTs** do ITI (conferir em gov.br/iti, área de
credenciamento) nem tabela pública de preços atual. Não localizei nada confiável sobre "Soluti" como ACT; se havia
outra razão social em mente, informar.

### 1.3 Observações técnicas

- O carimbo ICP-Brasil comprova **momento** e **não alteração**; não identifica o signatário.
- Fontes secundárias dizem que carimbo de ACT tem validade jurídica "desde que acompanhado de assinatura digital
  com certificado ICP-Brasil" — afirmação genérica de um fornecedor; **validar com o jurídico** o efeito do carimbo
  isolado sobre um hash.
- Autoridades de carimbo de fora da ICP-Brasil (inclusive gratuitas) servem para **desenvolvimento e testes**; o
  peso jurídico em produção deve ser avaliado antes de uso (não pesquisado).
- Custo por carimbo é baixo em volume, mas **sempre há mínimo contratual**: pedir cotação com volume estimado
  (um carimbo por acordo formalizado + eventual topo de cadeia diário).

### 1.4 Perguntas para a cotação (carimbo)

1. Credenciamento ICP-Brasil vigente da ACT (número, data) e política de carimbo (PCT).
2. Protocolo/endpoint RFC 3161, autenticação, limites, sandbox, SLA e janela de manutenção.
3. Preço por carimbo, mínimo mensal/anual, validade do pacote, reajuste.
4. Retenção de logs do carimbo, localização dos dados, DPA/LGPD, encerramento contratual.
5. Documentação para verificação **offline** do recibo (cadeia de certificados, LCR/OCSP, arquivamento a longo prazo).

## 2. Provedores de assinatura eletrônica (para o futuro — ADR-012)

Lista inicial de quatro nomes brasileiros pesquisados; outros (inclusive internacionais) devem entrar na rodada de
cotação.

| Provedor | API / webhook | Preço (indicativo, a confirmar) | Pontos de atenção |
| --- | --- | --- | --- |
| **Clicksign** | Documentação de desenvolvedor oficial; **webhook com assinatura HMAC** (cabeçalho `x-clicksign-signature`), reenvio possível (tratar idempotente); sandbox separado ([docs](https://developers.clicksign.com/)) | Não encontrado | Melhor documentação de verificação de webhook entre os quatro |
| **D4Sign** | API exige plano ativo, com ativação manual da chave; limite de 10 envios/hora na API liberada; API Premium sob consulta; webhook ("POSTBack") opcional, **HMAC não localizado** ([planos](https://d4sign.com.br/en/planos-e-precos), [API](https://docapi.d4sign.com.br/)) | Básico ≈ R$ 39,90/mês; Avançado ≈ R$ 59,90–69,90/mês (páginas divergem) | Limite de envios; validar HMAC por escrito |
| **ZapSign** | Webhooks gratuitos, com **retentativa que pode duplicar eventos**; **HMAC não localizado**; documentação de carimbo de tempo própria ([webhooks](https://docs.zapsign.com.br/webhooks/como-funciona), [carimbo](https://docs.zapsign.com.br/carimbo-de-tempo/como-funciona-carimbo-de-tempo)) | Planos de API em USD (≈ US$ 39–224/mês) e planos em BRL divergentes ([preços](https://zapsign.co/pricing)); R$ 0,10 por OTP nos planos de API | Preços inconsistentes entre páginas |
| **Autentique** | API documentada; cobrança por uso (documento R$ 0,06; assinatura por e-mail R$ 0,013; WhatsApp R$ 0,12; SMS R$ 0,16; webhook R$ 0,0002) ([preços API](https://docs.autentique.com.br/api/precos-para-uso-via-api)); HMAC citado só em projeto de terceiros | Modelo por uso com compromisso mínimo (plano) | Comparativo de concorrente afirma 1 webhook por conta e sem retry — **não confirmado** |

### 2.1 Critérios de avaliação (checklist de cotação)

1. **Integridade e evidências:** assinatura sobre o arquivo final, relatório de assinaturas exportável, hash do
   arquivo, trilha de eventos com IP/dispositivo, verificação **independente** do PDF assinado.
2. **Nível:** simples, avançada ou qualificada (ICP-Brasil); suporte a certificado ICP-Brasil e a carimbo.
3. **Declaração por escrito** sobre a conferência de integridade para o art. 784 § 4º do CPC.
4. **Webhook:** HMAC, janela de tempo, idempotência, retentativa, ordem de eventos.
5. **API:** idempotência de criação, sandbox, limites, versionamento, SLA.
6. **Dados:** localização, retenção, DPA, exportação dos documentos e evidências no encerramento, **portabilidade
   sem dependência do fornecedor** (os PDFs assinados e os relatórios têm de permanecer verificáveis fora dele).
7. **Custo total:** por documento/assinatura/OTP, mínimo, reajuste, custo por signatário (cada acordo tem duas
   partes).
8. **Experiência:** assinatura embutida no app ou redirecionamento; aderência ao fluxo móvel dos médicos.

## 3. Próximos passos propostos (sem custo)

1. Você confirma a lista de fornecedores a cotar (carimbo: Serpro, Certisign, Imprensa Oficial/Prodesp; assinatura:
   os quatro acima e, se quiser, internacionais).
2. Eu monto o e-mail de cotação com as perguntas do §1.4 e §2.1 (para você enviar; não envio nada).
3. Conferir no site do ITI a lista oficial de ACTs.
4. Nenhuma conta, chave ou contrato é criada antes da sua aprovação.

## Fontes

Serpro ([ACT](https://www.serpro.gov.br/links-fixos-superiores/pss-serpro/actserpro/),
[carimbo do tempo](https://serpro.gov.br/menu/noticias/noticias-2024/carimbo-do-tempo)) · Certisign
([proposta 2018](https://projetossti.ufpe.br/attachments/download/432/proposta_comercial%20carimbo_tempo_v1%20-%20certsign.pdf))
· ITI DOC-ICP-03 ([v4.1](https://mailman.iti.gov.br/images/repositorio/legislacao/documentos-principais/03/DOC-ICP-03_-_Versao_4.1.pdf))
· Prodesp ([PCT](https://solucoes.prodesp.sp.gov.br/wp-content/uploads/2022/08/carimbodotempo-it.pdf)) · Clicksign
([desenvolvedores](https://developers.clicksign.com/)) · D4Sign ([planos](https://d4sign.com.br/en/planos-e-precos),
[API](https://docapi.d4sign.com.br/)) · ZapSign ([preços](https://zapsign.co/pricing),
[webhooks](https://docs.zapsign.com.br/webhooks/como-funciona)) · Autentique
([preços API](https://docs.autentique.com.br/api/precos-para-uso-via-api)) · OWASP
[Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
