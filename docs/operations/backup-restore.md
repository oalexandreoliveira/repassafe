# Backup e restauração

## Objetivos iniciais

- RPO do piloto: 24 horas com backup diário; reduzir para minutos ao contratar PITR.
- RTO do piloto: 4 horas para banco pequeno, incluindo validação funcional.
- Retenção mínima: 7 dias no provedor e uma cópia lógica semanal criptografada fora
  da conta operacional.

Projetos Supabase Pro ou superiores possuem backups físicos diários. O plano Free
exige exportação lógica regular. Backup do banco não contém os objetos do Storage,
apenas seus metadados; documentos precisam de política própria de cópia quando o
upload entrar no MVP.

## Backup lógico

Execute em runner administrativo protegido, nunca no notebook compartilhado:

```powershell
$env:SUPABASE_DB_URL = "valor-injetado-pelo-cofre"
./scripts/create-logical-backup.ps1 -Environment staging -OutputDirectory "D:/secure-backups"
```

O destino deve ficar fora do repositório. O script produz schema, dados, papéis e
manifesto SHA-256. Depois da execução:

1. criptografar o diretório com chave do cofre corporativo;
2. enviar ao armazenamento off-site com acesso restrito;
3. confirmar hashes após o upload;
4. remover com segurança a cópia temporária;
5. registrar horário, tamanho, operador e resultado, nunca a URL do banco.

## Teste de restauração

Mensalmente e antes do piloto:

1. criar projeto Supabase isolado na mesma região, sem integrações externas;
2. escolher backup anterior ao ponto do incidente;
3. restaurar nele — nunca sobre desenvolvimento, homologação ou produção;
4. reaplicar migrations posteriores apenas se o objetivo do teste exigir;
5. comparar contagens de `profiles`, `shift_offers`, `shift_applications`,
   `substitutions`, `shift_agreements` e `audit_events`;
6. executar `supabase db lint`, Security Advisors e `supabase test db`;
7. testar login fictício e um fluxo completo sem dados reais exportados;
8. registrar RPO observado, RTO observado e divergências;
9. destruir o projeto isolado após aprovação da evidência.

Uma restauração física causa indisponibilidade. Slots e integrações externas devem
ser revistos antes e depois. Senhas de papéis personalizados não fazem parte do
backup diário e precisam ser redefinidas.

## Critério de aceite

Backup só é considerado válido depois de uma restauração bem-sucedida. Falha de
hash, dump vazio, teste RLS reprovado ou diferença de contagem sem explicação torna
o backup inválido e abre incidente S2.
