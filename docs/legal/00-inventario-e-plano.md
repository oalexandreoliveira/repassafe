# Pacote jurídico do Repassafe — inventário, revisão e plano

Data: 14/10/2026 · Status: **proposta para deliberação; nenhum texto novo foi publicado**
Base: [matriz-conformidade.md](../matriz-conformidade.md), [plano-adequacao.md](../plano-adequacao.md) (L-4, L-5),
[conferencia-normas-2026-10-08.md](../conferencia-normas-2026-10-08.md), ADR-011/012/013/014 e
`src/features/registration/legal.ts`.

> Não é parecer jurídico. Os textos que sairem deste pacote são **minutas técnicas para revisão por advogado**
> (e, no que toca à LGPD, pelo encarregado). Nada aqui deve ser publicado como definitivo sem essa revisão.

## 1. Estado atual dos textos

Hoje existem apenas dois documentos, ambos em `legal.ts`, com **uma única versão** (`legalVersion = "2026-09-29"`):
Termos de uso (6 seções) e Política de privacidade (6 seções). O aceite é registrado no cadastro com versão e hash.
Declarações pontuais existem no formulário de cadastro e nos avisos dos campos livres. O **instrumento do acordo**
(texto que as partes aceitam) é gerado no banco, sem modelo contratual revisado (L-4 pendente).

## 2. Revisão dos textos vigentes — achados

### Termos de uso

| # | Achado | Gravidade |
| --- | --- | --- |
| T-1 | Responsável é pessoa natural, sem CPF/CNPJ, endereço ou e-mail. Falta identificação do prestador (também exigida para transparência da LGPD, art. 9º, III e IV) | Alta |
| T-2 | Não há **cláusula de admissão do método de comprovação** (aceite eletrônico autenticado, hash, cadeia de eventos) nem convenção probatória. É a recomendação nº 1 da conferência de normas (MP 2.200-2 art. 10 § 2º; CPC 373 § 3º) | Alta |
| T-3 | Não declara que o aceite **não é assinatura avançada/qualificada** nem que o documento **não é título executivo** | Alta |
| T-4 | Ausência de regras do produto já existentes: pagador/beneficiário, data-limite que vale mesmo se o hospital atrasar, acompanhamento do pagamento, divergência, imutabilidade do acordo registrado | Alta |
| T-5 | Sem regras de **grupos de colegas** (gestor, convites, remoção, arquivamento) e de aprovação institucional | Média |
| T-6 | Sem limitação de responsabilidade, sem foro/lei aplicável, sem vigência, rescisão e procedimento de suspensão com contraditório | Alta |
| T-7 | Sem idade/capacidade (só médicos, pessoa natural — ADR-011) e sem declaração de que instituição **não é parte** | Média |
| T-8 | Sem propriedade intelectual, licença sobre conteúdo enviado (foto, comprovante) e regra de comunicação eletrônica | Baixa |
| T-9 | "Frase fixa" de não intermediação de pagamento (identidade v2.1) deve ser idêntica nos Termos, no instrumento e na UI | Média |

### Política de privacidade

| # | Achado | Gravidade |
| --- | --- | --- |
| P-1 | **Encarregado** não indicado nem dispensa justificada (LGPD art. 41 e § 1º: identidade e contato públicos; § 3º admite dispensa por norma da ANPD — verificar enquadramento) | Alta |
| P-2 | Fundamentos descritos em prosa, sem mapa **finalidade × dado × base legal (art. 7º) × retenção**. Falta o inventário (SEG-006) | Alta |
| P-3 | **Transferência internacional**: cita fornecedores e "infraestrutura fora do Brasil", mas sem o mecanismo do art. 33 (cláusulas-padrão, etc.) e com região `us-east-2` ainda não decidida (L-7) | Alta |
| P-4 | Retenção sem prazos ("enquanto necessários"), em tensão com SEG-005/P0-06 | Alta |
| P-5 | CPF: política deve refletir ADR-014 (máscara + compromisso criptográfico; revelação adiada) | Média |
| P-6 | Sem tratamento de **incidente** (art. 48), sem papéis operador/controlador por fornecedor, sem menção a registros de acesso/IP | Média |
| P-7 | Consentimento não deve ser base para o cadastro; o texto já evita, manter. Fotos e comprovantes podem conter dados de terceiros (revisar) | Média |
| P-8 | Cookies/armazenamento local tratados em uma frase; falta política própria quando houver qualquer cookie não essencial | Baixa |

### Observação sobre registros de acesso

Marco Civil art. 15 obriga a guarda de 6 meses apenas ao provedor de aplicações **constituído como pessoa jurídica**
que exerça a atividade de forma organizada, profissional e com fins econômicos. Se o Repassafe seguir como pessoa
natural, o dever não incide automaticamente (§ 1º permite ordem judicial). Por isso a **decisão sobre a entidade
responsável** (D-1) precede o texto de retenção e de privacidade.

## 3. Catálogo de documentos

Legenda de estado: ● existe (revisar) · ○ ausente · ◐ parcial. Prioridade: **P0** antes do piloto com dados reais.

### A. Documentos de adesão (públicos, versionados, aceite registrado)

| ID | Documento | Estado | Pri | Observação |
| --- | --- | --- | --- | --- |
| LEG-01 | Termos de uso | ● | P0 | Reescrever (T-1 a T-9) |
| LEG-02 | Política de privacidade | ● | P0 | Reescrever (P-1 a P-8) |
| LEG-03 | Política de retenção e descarte (resumo público + tabela interna) | ○ | P0 | P0-06; define prazos por categoria |
| LEG-04 | Política de cookies e armazenamento local | ◐ | P1 | Curta; só sessão hoje |
| LEG-05 | Regras de grupos de colegas (gestor e membros) | ○ | P1 | Aceite do gestor ao criar grupo |
| LEG-06 | Regras de conduta e moderação (suspensão, contestação, prazos) | ◐ | P1 | Hoje dentro dos Termos |

### B. Declarações no fluxo (textos curtos, versionados, gravados no evento)

| ID | Declaração | Onde | Pri |
| --- | --- | --- | --- |
| DEC-01 | Veracidade dos dados e vínculo profissional **sem confirmar credenciamento** | Cadastro (já existe, revisar) | P0 |
| DEC-02 | Ciência dos Termos e da Privacidade (versões e hashes distintos por documento) | Cadastro | P0 |
| DEC-03 | Ausência de dados de pacientes em campos livres e anexos | Formulários, comprovantes | P0 |
| DEC-04 | Aceite das condições do acordo (texto do botão e do resumo; ADR-013 reautenticação) | Fluxos A e B | P0 |
| DEC-05 | Informei o pagamento / Recebi / Divergência | Acompanhamento | P1 |
| DEC-06 | Execução do plantão: declarado × confirmado (L-6) | Pós-plantão | P1 |
| DEC-07 | Manifestação do gestor/aprovador institucional (aprovação **não é** manifestação da PJ — ADR-011) | Aprovação | P1 |
| DEC-08 | Cancelamento e distrato | Acordo | P1 |

### C. Instrumento do acordo (L-4)

| ID | Documento | Estado | Pri |
| --- | --- | --- | --- |
| CON-01 | Modelo do instrumento de repasse v2 (objeto, partes, valor, **pagador/beneficiário**, vencimento, forma de pagamento, execução, cancelamento, divergência, admissão do método de comprovação, não-executividade, dados pessoais, foro) | ○ | P0 |
| CON-02 | Aditivo e cancelamento (FID-008, depende de P1-06) | ○ | P1 |
| CON-03 | Notas explicativas da cópia impressa e instruções de verificação (PRV-005; Lei 13.874 art. 10) | ○ | P1 |

### D. Governança LGPD (documentos internos)

| ID | Documento | Pri |
| --- | --- | --- |
| LGPD-01 | Inventário de tratamento (ROPA simplificado) por campo | P0 |
| LGPD-02 | Mapa de bases legais e, onde houver legítimo interesse, teste de proporcionalidade (art. 10) | P0 |
| LGPD-03 | Designação do encarregado ou fundamento da dispensa; canal público | P0 |
| LGPD-04 | Avaliação de transferência internacional e contratos/DPA com Supabase e Vercel (art. 33) | P0 |
| LGPD-05 | Procedimento de atendimento a titulares (prazos, verificação de identidade, modelos de resposta) | P0 |
| LGPD-06 | Plano de resposta a incidentes e modelo de comunicação (art. 48) | P0 |
| LGPD-07 | Relatório de impacto (RIPD) do cadastro, CPF e dossiê probatório | P1 |
| LGPD-08 | Política de segurança e controle de acesso administrativo (art. 46; liga a `docs/security`) | P1 |

### E. Terceiros

| ID | Documento | Pri |
| --- | --- | --- |
| TER-01 | Termo de confidencialidade para administradores/suporte | P1 |
| TER-02 | Termo de adesão de instituição/aprovador (se houver parceria) | P2 |
| TER-03 | Contrato com fornecedor de carimbo do tempo (ADR-012) | P1 |

## 4. Princípios de redação (aplicar a todos)

1. PT-BR claro, sereno, verbos nos botões, sem exclamações e sem emoji (identidade v2.1).
2. Léxico proibido: "título executivo", "garantido", "blindado", "certificado judicialmente", "assinatura avançada/
   qualificada", "prova" como promessa. Descrever o aceite como **aceite eletrônico autenticado**.
3. Cada documento tem versão própria, data de vigência, hash e texto renderizado guardado com o aceite (FID-007).
4. Uma única fonte da frase de não intermediação de pagamento, reutilizada na UI e nos documentos.
5. Registro de mudanças legíveis; aceite anterior permanece.
6. Todo `[PENDENTE]` é bloqueio de publicação, verificado por teste (a criar, junto com o léxico P0-09).

## 5. Decisões que bloqueiam a redação

| # | Decisão | Por que bloqueia | Quem |
| --- | --- | --- | --- |
| D-1 | **Quem é o responsável**: pessoa natural ou pessoa jurídica (CNPJ, endereço, e-mail institucional)? | Identificação (T-1/P-1), Marco Civil art. 15, responsabilidade, contratos de fornecedores | Responsável do projeto |
| D-2 | **Modelo comercial**: gratuito no piloto? haverá cobrança futura? | CDC, cláusulas de preço, base legal | Responsável + jurídico |
| D-3 | **Foro e lei aplicável** (domicílio do réu? foro de eleição?) | Cláusula de foro dos Termos e do instrumento | Jurídico |
| D-4 | **Encarregado**: quem e qual e-mail; ou dispensa | LGPD art. 41 | Responsável + jurídico |
| D-5 | **Região da infraestrutura** (L-7) e mecanismo do art. 33 | Texto de transferência internacional | Responsável |
| D-6 | **Convenção probatória**: aceitar cláusula pela qual as partes admitem o método do Repassafe? Limites | CON-01 / T-2 | Jurídico |
| D-7 | **Retenção**: prazos por categoria (conta, acordo, evidência, logs, backups) | LEG-03, P-4 | Jurídico + encarregado |
| D-8 | **Responsabilidade do Repassafe** perante inadimplemento e divergência (mediação? nenhuma?) | T-6, CON-01 | Responsável + jurídico |

## 6. Ordem de trabalho proposta

1. **Rodada 0** — decisões D-1 a D-5 (as demais podem avançar em paralelo como minuta).
2. **Rodada 1 (P0, adesão)** — LEG-01, LEG-02, DEC-01 a DEC-04, LGPD-01/02/03.
3. **Rodada 2 (P0, instrumento)** — CON-01 e a cláusula de método de comprovação (alimenta P0-03, canônico v2).
4. **Rodada 3 (P0, operação LGPD)** — LEG-03, LGPD-04/05/06.
5. **Rodada 4 (P1)** — demais declarações, regras de grupos, RIPD, cookies, confidencialidade.
6. **Integração técnica** — textos em arquivos versionados (`src/features/legal/`), um documento por arquivo,
   hash por documento, teste de léxico e de `[PENDENTE]`; aceite por documento no cadastro.
7. **Revisão externa** por advogado antes da publicação; ata da revisão em `docs/legal/revisoes/`.

## 7. Limites

Normas conferidas na base de legislação: LGPD (arts. 3, 4, 6, 7, 9, 10, 33, 41, 46, 47, 48) e Marco Civil (arts. 13–15),
todas não revogadas. **Não conferidas**: regulamentos da ANPD (dispensa de encarregado para agentes de pequeno
porte, comunicação de incidentes, transferência internacional), CDC, normas do CFM sobre publicidade e relação
médico-instituição, e jurisprudência. A conferência continua na Rodada 0.
