# Passo 5 — validação de segurança

## Escopo validado

Esta entrega cobre US-1201, US-1202 e US-1203 no recorte atual do MVP:

- menor privilégio por grants e RLS;
- isolamento por usuário, grupo, papel e participação no repasse;
- MFA AAL2 para administração;
- auditoria imutável das ações críticas;
- rate limiting distribuído nas mutações expostas;
- testes automatizados permitidos e negados.

## Matriz RLS

| Recurso             | Responsável                     | Candidato/substituto | Aprovador do grupo  | Não membro | Anônimo |
| ------------------- | ------------------------------- | -------------------- | ------------------- | ---------- | ------- |
| Oferta do grupo     | leitura                         | leitura              | leitura             | negado     | negado  |
| Candidatura         | todas da própria oferta         | somente própria      | negado              | negado     | negado  |
| Substituição        | própria                         | própria              | grupo sob aprovação | negado     | negado  |
| Acordo              | próprio                         | próprio              | grupo sob aprovação | negado     | negado  |
| Auditoria completa  | somente admin via servidor+AAL2 | negado               | negado              | negado     | negado  |
| Comandos de domínio | gatilho validado                | gatilho validado     | decisão validada    | negado     | negado  |

O arquivo `supabase/tests/security_rls_matrix.sql` materializa essa matriz com cinco
identidades distintas. Grants impedem operações não previstas antes mesmo da
avaliação das policies.

## Auditoria

Eventos registram ator, tipo, entidade, identificador, metadados mínimos e horário.
Incluem login bem-sucedido ou falho, logout, cadastro, alteração de perfil,
administração, publicação, candidatura, seleção, confirmação, decisão e
cancelamento. Atualização e exclusão são bloqueadas por gatilho, inclusive para o
cliente administrativo da aplicação.

Falhas de login guardam apenas uma impressão SHA-256 parcial e salgada do e-mail.
IP e e-mail em texto puro não entram nos contadores nem nos eventos.

## Rate limiting

Os identificadores são normalizados, combinados com `RATE_LIMIT_PEPPER` e resumidos
com SHA-256 no servidor. Um gatilho privado executa `INSERT ... ON CONFLICT DO
UPDATE`, tornando a contagem atômica entre instâncias. Ao exceder o limite, a
transação retorna `rate_limit_exceeded`; a aplicação usa resposta genérica em
autenticação e registra o evento de segurança.

O segredo deve ter ao menos 32 caracteres, ser diferente por ambiente e permanecer
somente no servidor. A proteção da aplicação complementa — não substitui — os
limites do Supabase Auth e a proteção de borda da hospedagem.

## Evidências automatizadas

- `pnpm check:security`: todas as tabelas públicas têm RLS e revogação explícita;
  não há `SECURITY DEFINER` público, `auth.role()` ou autorização por
  `user_metadata`.
- `tests/security-controls.test.ts`: políticas e contrato da migration.
- `supabase/tests/security_rls_matrix.sql`: matriz real de acesso permitido/negado.
- `supabase/tests/security_rate_limit.sql`: limite, concorrência lógica, ausência de
  persistência na superfície pública e imutabilidade da auditoria.
- CI executa `supabase test db` em banco local descartável.

## Verificação operacional antes do piloto

1. Configurar `RATE_LIMIT_PEPPER` por ambiente.
2. Aplicar migrations em desenvolvimento e homologação.
3. Executar `supabase test db` e `supabase db advisors --type security`.
4. Confirmar no advisor ausência dos alertas 0011, 0013, 0015, 0028 e 0029.
5. Exercitar bloqueio 429-equivalente e consulta administrativa com MFA AAL2.
