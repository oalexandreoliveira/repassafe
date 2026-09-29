# Validação do backup de homologação — 29/09/2026

Backup lógico criado pelo operador Alexandre Oliveira em
`C:\Users\Alexandre Oliveira\RepassafeSecureBackups\repassafe-staging-20260929T212620Z`.
Manifesto criado em 2026-09-29T21:27:32.8644306Z, referência Git
`1b0f0501c83d7ff7186f2dc2f3b92476e18fe9b0`.

## Integridade e restauração

Os três arquivos conferem com os hashes SHA-256 do manifesto:
schema.sql (119444 bytes), data.sql (45916 bytes) e roles.sql (431 bytes).
Nenhuma credencial ou conteúdo do dump foi incluído no repositório.

Schema e dados foram restaurados no contêiner temporário
`repassafe_restore_validation_20260929`, PostgreSQL Supabase 17.6.1.155,
sem rede externa. Os papéis e pré-requisitos gerenciados foram fornecidos
pela imagem; roles.sql não foi reaplicado sobre papéis reservados.
As referências circulares foram tratadas exclusivamente nesse destino isolado
com `session_replication_role=replica` durante a carga transacional dos dados.

Contagens após a carga: profiles 3, shift_offers 2, shift_applications 2,
substitutions 2, shift_agreements 2 e audit_events 114.
Após aplicar a migração de isolamento administrativo, audit_events passou a
115, incluindo o evento esperado `administration.access_granted`.

A migração posterior de isolamento administrativo também foi testada nesse
destino. Identidades Auth sintéticas e funções auxiliares compatíveis com
as claims atuais foram usadas como pré-requisitos do teste, sem restaurar
contas reais. Os 20 cenários de supabase/tests/administrative_access.sql
passaram novamente; o teste terminou com rollback.

## Alcance e pendências

Esta evidência comprova a restauração lógica dos dados da aplicação em public
e os cenários de isolamento administrativo. O dump de dados não inclui auth,
storage, schemas privados ou arquivos armazenados no Storage; não comprova
recuperação integral do projeto, senhas, login real ou recuperação de arquivos.
Novos dados privados do cadastro exigirão ampliar a cobertura do backup antes
de publicar essa expansão.

Criptografia e cópia para armazenamento externo restrito ainda não foram
comprovadas. O artefato original foi preservado fora do repositório.
