# Ambientes

| Ambiente | Supabase | Vercel | Dados |
|---|---|---|---|
| desenvolvimento | projeto local ou dev | execução local | apenas fictícios |
| homologação | projeto dedicado | preview/staging | seed fictício |
| produção | projeto dedicado e protegido | produção | dados autorizados |

Variáveis nunca são compartilhadas entre ambientes. Produção exige aprovação manual e migrations previamente validadas em homologação.
