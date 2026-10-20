# Política de privacidade do Repassafe — MINUTA v0.1

Status: **minuta para revisão de advogado e do encarregado. Não publicar.** Itens `[PENDENTE: …]` bloqueiam a
publicação. Substitui a versão `2026-09-29`. Fundamentos conferidos: LGPD arts. 6, 7, 9, 10, 33, 41, 46 e 48.
A tabela da seção 3 deve ser validada contra o inventário `LGPD-01` (a criar) e contra o esquema real do banco.

---

## 1. Quem trata seus dados

1.1. **Controlador:** Alexandre Oliveira, pessoa natural, `[PENDENTE: CPF/endereço]`.
1.2. **Encarregado (LGPD, art. 41):** `[PENDENTE: D-4 — nome e e-mail, ou fundamento da dispensa conforme norma da
ANPD, mantendo o canal público]`. Canal para exercer direitos: /suporte, categoria Privacidade (gera protocolo).

## 2. Princípios

Tratamos apenas o necessário para cada finalidade, informamos o que fazemos, protegemos os dados e prestamos
contas, conforme o art. 6º da LGPD. **Não coletamos nem aceitamos dados de pacientes** nem dados de saúde.

## 3. Quais dados, para quê e com que fundamento

| Dados | Finalidade | Base legal (art. 7º) | Quem acessa | Conservação `[PENDENTE: D-7]` |
| --- | --- | --- | --- | --- |
| Nome civil, CPF, nascimento, telefone, e-mail, foto | Identificar a pessoa, evitar contas duplicadas, permitir o acesso | V — execução do contrato/procedimentos preliminares a pedido do titular | Você; equipe autorizada | Conta ativa + `[prazo]` |
| CRM, UF, especialidade, RQE | Verificar a atuação profissional e exibir “CRM verificado” às outras partes | V; IX (confiança entre médicos) `[PENDENTE: teste de legítimo interesse, art. 10]` | Equipe; outras partes (apenas CRM/UF, selo) | Idem |
| Vínculos declarados (instituição, setor) | Contextualizar cadastro e plantões | V | Equipe; partes do plantão | Idem |
| Ofertas, candidaturas, acordos, execuções, pagamentos informados, divergências | Operar os repasses e manter o histórico | V; VI (exercício regular de direitos) para a manutenção do registro | Partes; equipe em caso de suporte | `[prazo de evidência]` |
| Comprovantes anexados | Permitir à outra parte conferir o pagamento informado | V | Partes do acordo | Com o acordo |
| Eventos de auditoria, hashes, datas e horas | Integridade do registro e prova do aceite | VI; II quando houver obrigação legal; IX (segurança) | Equipe autorizada | Com o acordo |
| Registros de acesso, IP e dispositivo `[PENDENTE: L-5 — decidir se coleta]` | Segurança e prevenção de fraude | IX `[PENDENTE: teste]`; II se obrigação legal aplicável | Equipe de segurança | `[prazo]` |
| Mensagens de suporte e protocolos | Atender pedidos e contestações | V; VI | Equipe autorizada | `[prazo]` |
| Senhas e códigos de confirmação | Autenticação | V | Apenas o provedor de autenticação; não os vemos | Enquanto a conta existir |

3.1. **Consentimento** não é a base do cadastro nem dos acordos. O aceite desta política registra **ciência**, não
autorização genérica para outras finalidades. Se pedirmos consentimento para algo opcional, será separado e
revogável (art. 9º).
3.2. O tratamento de dados pessoais é condição para usar o serviço, pois o cadastro identificado é essencial
(art. 9º, § 3º). Você pode exercer os direitos listados na seção 8.
3.3. **CPF.** Nos documentos dos acordos exibimos o CPF **mascarado** e guardamos um compromisso criptográfico que
permite verificá-lo sem expô-lo. `[PENDENTE: ADR-014 — política de revelação do CPF completo a uma parte, sob pedido e
por canal controlado]`.

## 4. Com quem compartilhamos

4.1. **Outras partes de um acordo ou grupo:** nome de exibição, selo “CRM verificado”, CRM/UF e as condições do acordo.
Dados civis (CPF, nascimento, telefone, foto de documento) **não** são exibidos à outra parte.
4.2. **Fornecedores (operadores):** Supabase (autenticação, banco de dados e arquivos), Vercel (hospedagem)
`[PENDENTE: atualizar lista, e-mail e SMS se contratados; carimbo de tempo, ADR-012]`. Eles tratam os dados em nosso
nome e sob contrato `[PENDENTE: LGPD-04 — DPAs assinados]`.
4.3. **Autoridades:** quando a lei exigir ou para defender direitos em processo, na medida necessária.
4.4. Não vendemos dados nem os usamos para publicidade.

## 5. Transferência internacional

Nossos fornecedores podem processar dados fora do Brasil (região atual: `[PENDENTE: D-5 — confirmar, hoje us-east-2]`).
Fazemos isso apenas com uma das garantias do art. 33 da LGPD, `[PENDENTE: LGPD-04 — indicar: cláusulas-padrão
contratuais ou outra hipótese, após conferência dos regulamentos da ANPD]`.

## 6. Quanto tempo guardamos

6.1. Guardamos os dados enquanto a conta existir e pelo prazo necessário para: cumprir obrigações legais, preservar o
histórico dos acordos de que a outra parte também participa e defender direitos. Prazos por categoria constam da
Política de Retenção `[PENDENTE: LEG-03, D-7]`.
6.2. Ao fim do prazo, eliminamos ou anonimizamos os dados. Cópias de segurança são sobrescritas conforme seu ciclo
`[PENDENTE: prazo do backup]`.
6.3. O encerramento da conta não apaga imediatamente evidências de acordos confirmados (ver Termos, 7.2).

## 7. Segurança e incidentes

7.1. Restringimos acessos por perfil, usamos armazenamento privado, registramos ações relevantes e exigimos
verificação em duas etapas dos administradores. Nenhuma medida elimina todo risco.
7.2. Em incidente que possa causar risco ou dano relevante, comunicaremos você e a ANPD, descrevendo dados afetados,
riscos e medidas, conforme o art. 48 da LGPD e a regulamentação `[PENDENTE: LGPD-06 — prazo regulamentar]`.

## 8. Seus direitos

Você pode pedir, a qualquer tempo e gratuitamente: confirmação do tratamento; acesso; correção; anonimização,
bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade; portabilidade `[PENDENTE: verificar
regulamentação]`; informação sobre compartilhamento; informação sobre a possibilidade de não consentir e suas
consequências; revogação de consentimento, quando for a base; e revisão de decisões automatizadas. Pode ser preciso
confirmar sua identidade, **sem pedir sua senha**. Respondemos em `[PENDENTE: prazo]`. Se a resposta não resolver, você
pode reclamar à ANPD.

## 9. Decisões automatizadas

O Repassafe não toma decisões exclusivamente automatizadas sobre você com efeito jurídico. Regras do sistema
(por exemplo, vencimento por data) seguem condições que você aceitou. `[PENDENTE: confirmar com produto]`

## 10. Cookies e armazenamento local

Usamos cookies e armazenamento **estritamente necessários** à sessão e à segurança. Não há cookies de publicidade
nesta versão. Se isso mudar, haverá política específica e pedido de escolha.

## 11. Menores

O serviço é destinado a maiores de 18 anos. Se soubermos de cadastro de menor, a conta será encerrada.

## 12. Mudanças

Alterações relevantes geram nova versão, com aviso `[PENDENTE: prazo]`. A versão e a data constam no topo e o aceite
é registrado com a versão exibida.
