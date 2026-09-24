# Dossiê eletrônico do acordo

## Objetivo

Materializar o snapshot do repasse confirmado como um documento humano-legível,
conferível pelas partes e acompanhado de uma trilha de evidências. A solução
registra fatos técnicos do fluxo; não promete impedir uma contestação nem
substitui análise jurídica sobre validade, exigibilidade ou responsabilidade.

## Conteúdo e aceite registrados

- A publicação e cada edição anterior à primeira candidatura exigem que o
  titular confirme que é responsável pela oferta e que os dados e condições
  estão corretos. O evento autenticado é associado à oferta e à versão final.
- O substituto precisa confirmar que leu e aceita as condições do plantão.
- Quando o grupo exige aprovação, a decisão favorável do aprovador ativo é
  registrada como evento distinto; ela não substitui o aceite das partes.
- O documento canônico inclui identificadores e nomes das partes, grupo e
  instituição, horário, setor, valor, pagamento, instante de confirmação e
  referência de aprovação, quando aplicável.
- O documento e os eventos são append-only no banco e acessíveis às partes e
  aprovadores ativos do grupo. Administração acessa pela aplicação com MFA.

## Integridade e verificação

- O banco conserva a serialização exata do conteúdo canônico e seu SHA-256.
- Cada evento contém o SHA-256 do conteúdo do evento, o hash do evento anterior
  e o hash do documento ao qual pertence.
- A página `/acordos/[id]` recalcula o hash do conteúdo e verifica a continuidade
  da cadeia. Divergência é exibida, não corrigida automaticamente.
- A página é formatada para impressão; o usuário pode usar a função do navegador
  “Imprimir ou salvar como PDF”. O PDF baixado ainda não é um artefato binário
  gerado e preservado pelo servidor, e seu próprio hash não é registrado.

## Limites e controles pendentes antes de uso probatório externo

- O hash e a cadeia detectam alterações em relação aos dados apresentados; não
  identificam sozinhos quem operou a conta nem impedem alteração por um operador
  privilegiado do banco. Não há ainda assinatura independente ou carimbo de
  tempo confiável externo.
- IP, user-agent/dispositivo e geolocalização não são coletados por esta etapa.
  Antes de adicioná-los, definir aviso/base legal, retenção, controle de acesso,
  precisão e proxy de borda confiável. Cabeçalhos de IP arbitrários não devem ser
  tratados como evidência confiável; geolocalização não será obrigatória.
- A autenticação atual e o aceite gravado pelo banco não equivalem a uma
  assinatura eletrônica avançada/qualificada. Avaliar reautenticação/MFA e
  fornecedor de assinatura/carimbo com assessoria jurídica.
- A redação final das obrigações — especialmente pagador, beneficiário, prazo,
  cancelamento, desistência e efeitos da aprovação institucional — precisa de
  validação jurídica brasileira antes que o artefato seja divulgado como
  contrato juridicamente suficiente.
- A primeira versão do documento aplica-se a acordos gerados após a migration.
  Acordos anteriores continuam disponíveis no registro operacional, mas não
  recebem retroativamente uma cadeia de aceite que não foi coletada à época.
- Ofertas já existentes sem confirmação do titular não poderão ter candidato
  selecionado após a migration até que as condições sejam revisadas e confirmadas.
  Se já houver candidaturas e a edição não for mais permitida, será necessário
  cancelar e republicar a oferta para colher o aceite explícito. A tela informa
  essa condição ao titular antes de ocultar a ação de seleção.

## Próximos passos

1. Validar com assessoria jurídica o texto e o modelo de aceite, sem alterar
   silenciosamente o conteúdo já aceito.
2. Persistir PDF final gerado no servidor e seu hash próprio em armazenamento
   privado com política de retenção e procedimento de exportação/verificação.
3. Definir captura minimizada de IP e user-agent no ingresso confiável, aviso de
   privacidade, retenção e exportação da cadeia de custódia.
4. Avaliar assinatura eletrônica e carimbo de tempo independentes conforme o
   risco e o parecer jurídico.
