# Ambientes

| Ambiente        | Supabase                     | Vercel          | Dados             |
| --------------- | ---------------------------- | --------------- | ----------------- |
| desenvolvimento | projeto local ou dev         | execução local  | apenas fictícios  |
| homologação     | projeto dedicado             | preview/staging | seed fictício     |
| produção        | projeto dedicado e protegido | produção        | dados autorizados |

## Projetos atuais

- desenvolvimento: `repassafe-dev` (`xutxikndushzmejsyvuo`), `us-east-2`;
- homologação: `repassafe-staging` (`gfcbnfzyucggdwjtybnm`), `us-east-2`;
- produção: não provisionada devido ao limite do plano gratuito.

Homologação nunca deve receber tráfego ou dados de produção. Quando houver capacidade, produção será criada como projeto independente, preferencialmente em `sa-east-1`.

Variáveis nunca são compartilhadas entre ambientes. Produção exige aprovação manual e migrations previamente validadas em homologação.

## Promoção de banco

1. aplicar a migration em desenvolvimento e executar os testes de RLS;
2. revisar os advisors de segurança e desempenho;
3. aplicar a mesma migration, sem alterações, em homologação;
4. repetir testes e advisors antes de promover futuramente para produção.

O bucket `professional-documents` é privado, limitado a 10 MiB e aceita somente PDF, JPEG e PNG. Nesta sprint ele não possui políticas de acesso pelo cliente; integrações de upload e regras funcionais ficam para uma sprint posterior.

