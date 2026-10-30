# Conferência das normas — Etapa 0

Data: 08/10/2026 · Método: consulta aos textos em vigor (base de legislação com link ao Planalto; todos os
dispositivos abaixo retornaram como **não revogados**). Não é parecer jurídico: serve de insumo ao parecer
(pendência L-4 do [plano](plano-adequacao.md)).

## 1. Dispositivos conferidos

| Norma | Conteúdo conferido | Fonte |
| --- | --- | --- |
| CC, art. 104 | Validade exige agente capaz, objeto lícito/possível/determinado ou determinável, forma prescrita ou não defesa em lei | [Planalto](https://www.planalto.gov.br/ccivil_03/leis/2002/l10406compilada.htm) |
| CC, art. 107 | Declaração de vontade não depende de forma especial, salvo exigência legal | idem |
| CPC, art. 369 | Meios legais e moralmente legítimos de prova, ainda que não especificados | [Planalto](https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2015/lei/l13105.htm) |
| CPC, art. 373 (§§ 1º–4º) | Ônus da prova; distribuição diversa por decisão fundamentada **ou convenção das partes** (salvo direito indisponível ou excessiva dificuldade) | idem |
| CPC, art. 783 | Execução funda-se em obrigação certa, líquida e exigível | idem |
| CPC, art. 784, III e § 4º | Documento particular assinado pelo devedor e por 2 testemunhas; em título eletrônico admite-se qualquer modalidade de assinatura eletrônica prevista em lei, **dispensadas as testemunhas quando a integridade for conferida por provedor de assinatura** | idem |
| CPC, art. 786, parágrafo único | Simples operações aritméticas não retiram a liquidez | idem |
| CPC, art. 787 | Se a prestação do devedor depende de contraprestação, o credor deve provar que a cumpriu | idem |
| CPC, art. 798, I, c/d e II, b | Exequente instrui com título, prova de termo/condição e de contraprestação; indica nomes e CPF/CNPJ | idem |
| MP 2.200-2, art. 10, § 1º e § 2º | ICP-Brasil gera presunção de veracidade quanto aos signatários; **outro meio de comprovação de autoria e integridade** não é obstado, desde que **admitido pelas partes como válido ou aceito por quem o documento for oposto** | [Planalto](https://www.planalto.gov.br/ccivil_03/mpv/Antigas_2001/2200-2.htm) |
| Lei 14.063/2020, art. 3º e 4º | Define assinatura **simples** (identifica o signatário; associa dados), **avançada** (associação unívoca, controle sob elevado nível de confiança, qualquer modificação posterior detectável, além de ser admitida pelas partes) e **qualificada** (certificado ICP-Brasil) | [Planalto](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2020/lei/L14063.htm) |
| Lei 14.063/2020, art. 14 | Documentos eletrônicos de profissionais de saúde "relacionados à sua área de atuação" são válidos com assinatura avançada ou qualificada | idem |
| Lei 13.874/2019, art. 10 (inclui art. 2º-A, § 7º na Lei 12.682/2012) | É lícita a reprodução em papel de documento digital com **mecanismo de verificação de integridade e autenticidade**; o ônus de demonstrar os requisitos é do particular | [Planalto](https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2019/lei/L13874.htm) |

**Não conferida nesta etapa:** Lei 13.709/2018 (LGPD) — será conferida junto com a política de retenção (P0-06) e o
inventário de dados (SEG-006).

## 2. Distinção entre obrigação legal e recomendação de engenharia

| Tema | Natureza | Leitura para o projeto (a validar pelo jurídico) |
| --- | --- | --- |
| Forma livre da declaração de vontade (CC 107) | Obrigação/regra legal | O registro eletrônico não precisa de forma especial para existir como acordo; a dificuldade é **provar** |
| Prova por qualquer meio legítimo e ônus (CPC 369, 373) | Regra legal | O dossiê serve à prova; não gera presunção automática |
| Convenção sobre ônus da prova e sobre aceitar o meio de comprovação (CPC 373 § 3º; MP 2.200-2 art. 10 § 2º) | Faculdade das partes | **Recomendação:** o termo do acordo pode registrar que as partes admitem o método do Repassafe como meio de comprovação de autoria e integridade. Redação e limites: jurídico |
| Executividade: título + certeza/liquidez/exigibilidade (CPC 783, 784 III e § 4º, 786) | Regra legal | Documento gerado pelo app **não é, por si, título executivo**. Estruturar valor e vencimento (já feito no fluxo B) ajuda liquidez/exigibilidade, mas não substitui assinatura do devedor e os demais requisitos |
| "Integridade conferida por provedor de assinatura" (CPC 784 § 4º) | Regra legal | A cadeia interna de hashes **não é** "provedor de assinatura". Para qualquer discurso de executividade será preciso provedor que confira integridade (L-1) |
| Contraprestação (CPC 787, 798 I d) | Regra legal | Quem executa pode ter de provar que cumpriu a sua parte → reforça o registro bilateral de **execução do plantão** (PRV-006, hoje ausente no fluxo B) |
| CPF/CNPJ na petição (CPC 798 II b) | Regra legal (instrução do processo) | Tensão com minimização: a matriz sugeria "sem CPF integral" no documento. **Decisão a tomar** (jurídico + DPO): manter CPF fora do documento e fornecer à parte, sob pedido, por canal controlado |
| Níveis de assinatura (Lei 14.063 art. 4º) | Classificação legal | O aceite atual, no máximo, aproxima-se da **simples**. Chamar de "avançada" exige: associação unívoca, controle exclusivo, detecção de modificação, **e admissão pelas partes**. Hoje não há mecanismo de assinatura que sustente isso |
| Art. 14 da Lei 14.063 (profissionais de saúde) | Regra legal de escopo | Dirige-se a documentos de saúde (p.ex. receitas). **Provável inaplicabilidade** a contrato de repasse; confirmar com jurídico antes de citar ou descartar |
| Cópia impressa com verificação (Lei 13.874 art. 10) | Regra legal | **Recomendação:** impressão/PDF com código de verificação e instruções (PRV-005) |

A advertência da própria especificação permanece: a Lei 14.063 não se impõe indistintamente a contratos privados;
sua utilidade aqui é como **classificação de referência** e para dimensionar o provedor.

## 3. Impactos sobre o plano

1. Acrescentar ao pacote L-4 (modelo contratual) a **cláusula de admissão do meio de comprovação** e eventual
   convenção probatória (MP 2.200-2 art. 10 § 2º; CPC 373 § 3º).
2. L-1 (provedor): critério adicional — o provedor deve **conferir a integridade** do documento de forma que
   sustente o CPC 784 § 4º; verificar as cláusulas e relatórios efetivamente oferecidos.
3. Nova decisão **L-11**: tratamento do CPF das partes no dossiê (CPC 798 II b × minimização).
4. P1-07 (execução no fluxo B) sobe de importância (CPC 787/798).
5. Linguagem: manter proibição de "título executivo", "garantido" e afins; descrever o aceite como "aceite
   eletrônico autenticado" e não como "assinatura avançada/qualificada".

## 4. Limites desta conferência

Texto vigente conferido; **não** foram consultados jurisprudência, doutrina nem atos regulamentares. A conclusão
sobre validade, executividade e valor probatório de cada documento depende do caso concreto e de advogado.
