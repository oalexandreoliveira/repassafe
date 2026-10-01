# Validação do backup de homologação — 30/09/2026

Backup do operador Alexandre Oliveira em
`C:\Users\Alexandre Oliveira\RepassafeSecureBackups\repassafe-staging-20260930T215115Z`.
Manifesto: 2026-09-30T21:52:37.2556329Z; referência Git
`2914986bf0dcef5af8f96f5fae7debb71666f024`.

Validação concluída em 01/10/2026, aproximadamente 02:48 UTC
(30/09 às 23:48 em São Paulo), dentro do RPO de 24 horas.
Schema (143808 bytes), dados (59877 bytes) e papéis (431 bytes)
conferem integralmente com os hashes SHA-256 do manifesto.

Schema e dados restaurados com ON_ERROR_STOP e transações no contêiner
temporário `repassafe_restore_validation_20260930`, imagem Supabase
PostgreSQL 17.6.1.155, `--network none`, sem portas publicadas.
Nenhum banco operacional foi modificado. Papéis gerenciados vieram da imagem;
roles.sql não foi reaplicado sobre papéis reservados. A carga usou
session_replication_role=replica para as referências circulares, conforme
o procedimento oficial de restauração lógica.

Todas as 27 tabelas public/private tiveram contagens comparadas ao COPY do dump,
sem divergências. Principais contagens: profiles 4, shift_offers 2,
shift_applications 2, substitutions 2, shift_agreements 2, audit_events 131,
administrative_access 1; private.registration_drafts 1,
registration_submissions 1, registration_decisions 1, legal_acceptances 2.

Passaram 20 cenários de administrative_access.sql e 20 de registration.sql,
incluindo RLS e separação entre identidade, habilitação e administração.
Ambos terminaram em rollback. A imagem de banco contém um schema Auth antigo:
somente no destino de teste foram fornecidas as funções uid/jwt/role da
instalação Supabase local e os campos email_confirmed_at, phone_confirmed_at
e phone exigidos pelo cadastro. Os testes criaram identidades sintéticas.

## Alcance

Comprova restauração lógica de public/private e os 40 cenários citados.
Não inclui dados Auth/Storage nem arquivos do Storage; referências a identidades
Auth reais não foram recuperadas. Não comprova login real, recuperação integral
do projeto, Security Advisors remotos ou criptografia/cópia off-site.
Nenhuma credencial ou conteúdo dos registros foi incluído no repositório.
O backup original foi preservado fora do repositório. O destino de teste é
descartado após a validação. Esta publicação altera apenas interface e documentação.
