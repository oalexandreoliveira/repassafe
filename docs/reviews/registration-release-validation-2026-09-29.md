# Validação da expansão do cadastro — 29/09/2026

Entrega na branch codex/full-registration. O isolamento administrativo anterior
foi mergeado no PR #19, commit 9e2e97edf2962d61755d2edf5b5b595ce9d2f0d2,
e publicado em repassafe-staging.

## Cobertura

Conta por e-mail e senha, recuperação e reenvio; identidade civil protegida;
CPF com checksum e unicidade, nascimento válido, telefone normalizado e único;
rascunho retomável e controle de versão; atuação médica opcional, CRM/UF,
especialidade/RQE, declaração institucional sem concessão de acesso; foto
privada com decodificação, remoção de metadados e limites; Termos e Privacidade
versionados com hash e aceite; envio idempotente com snapshots; correções por
campo, resposta e reenvio; decisão administrativa independente com evidência
CRM e RQE, validade configurável e bloqueio de novas operações após expiração;
histórico e notas internas separados; canal próprio de suporte e privacidade.

Os textos jurídicos foram redigidos para o responsável informado, Alexandre
Oliveira, sem inventar CNPJ ou canal externo. Não houve revisão jurídica externa.
Suporte sem conta registra protocolo e contato; acompanhamento dentro do site
é disponível para solicitações vinculadas à conta. Respostas externas não têm
envio automático de e-mail nesta entrega.

SMS tem integração e limites de tentativa/reenvio, mas fica desabilitado por
padrão até configurar o provedor no Supabase e SMS_VERIFICATION_ENABLED=true.
Nenhum telefone recebe selo confirmado por simples preenchimento. Expiração
do OTP é controlada pelo provedor; os cenários reais de entrega, expiração e
reenvio ficam para a ativação desse serviço.

## Verificação

- 46 testes unitários em 15 arquivos passaram.
- 116 cenários pgTAP em 9 arquivos passaram no Supabase local.
- Os seis testes de navegador iniciais passaram, incluindo retomada, envio,
  correção e preservação da versão anterior.
- O cadastro passou novamente após a correção da foto, verificando carregamento
  efetivo da imagem antes de capturar desktop e celular. A rota própria exige
  autenticação e consulta apenas a foto do titular, sem liberar URLs externas
  na política de segurança do site.
- Teste adicional de cadastro, suporte e documentos passou em 1440px e 390px,
  com verificação de overflow, ampliação CSS de 200% e teclado no suporte.
- TypeScript, ESLint, formatação, auditoria estática de 21 tabelas públicas,
  verificações de escopo e prontidão operacional passaram.
- Advisors locais retornaram sem issues. Homologação tem aviso preexistente
  de proteção contra senhas vazadas desabilitada; tabelas internas sem políticas
  acessíveis a clientes permanecem restritas por grants/RLS.

Capturas e testes visuais usam apenas contas sintéticas locais. A administração
recebe validação funcional no banco e revisão de fonte; este relatório não
afirma inspeção visual autenticada remota nem certificação WCAG integral.
A documentação Impeccable registra tokens existentes e preserva a identidade.

## Operação

Backup anterior à migração criado e restaurado: ver
docs/operations/backup-restore-validation-2026-09-29.md. O script de backup foi
ampliado para dados public e private, incluindo os novos registros privados.
O backup anterior não contém esses registros ainda inexistentes; rate-limit
privado preexistente é estado transitório não recuperado naquele dump.
Auth e arquivos do Storage exigem cobertura operacional separada.

Banco deve receber a migração full_registration antes da publicação do código.
Rollback da aplicação deve preservar o schema novo e corrigir à frente;
atualizações diretas de identidade do fluxo antigo passam a ser negadas.
