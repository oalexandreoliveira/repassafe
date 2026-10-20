# Declarações do cadastro e avisos obrigatórios — MINUTA v0.1

Status: minuta para revisão. Textos curtos, para gravar com versão e hash no evento de aceite. Revisar contra o
léxico proibido (sem "garantido", "executivo", "assinatura avançada").

## DEC-01 — Veracidade e habilitação (cadastro)

Caixa de seleção, obrigatória, desmarcada por padrão:

> Declaro que as informações que informei são verdadeiras e que sou médico(a) com registro regular no CRM indicado.
> Entendo que o Repassafe verifica o CRM, mas isso não confirma vínculo, credenciamento ou permissão de nenhuma
> instituição.

## DEC-02 — Ciência dos documentos (cadastro)

Duas caixas separadas, cada uma com link para o documento e a versão:

> Li e aceito os Termos de uso (versão `{{versão}}`).
> Li a Política de privacidade (versão `{{versão}}`) e sei como exercer meus direitos.

A segunda registra **ciência**, não consentimento (art. 9º LGPD).

## DEC-03 — Aviso de dados de pacientes (campos livres e anexos)

Aviso fixo abaixo de cada campo livre, anexo e do suporte:

> Não inclua nomes, leitos, prontuários ou qualquer dado de pacientes.

Complemento em anexo de comprovante: “Cubra dados de terceiros que não sejam necessários para mostrar o pagamento.”

## DEC-04 — Aceite do acordo (fluxos A e B)

Texto acima do botão, com o resumo completo exibido antes:

> Quem repassa pagará R$ `{{valor}}` a quem assume até `{{data}}`. Esta data-limite vale mesmo se o hospital atrasar o
> pagamento. `{{frase fixa de não intermediação}}`
> Ao aceitar, registro meu aceite eletrônico a estas condições, e reconheço o método de comprovação descrito nos
> Termos (4.9). Este aceite não é assinatura avançada ou qualificada.

Botão: **Aceitar estas condições**. Antes do aceite, `{{confirmação por senha}}` (ADR-013).

## DEC-05 — Acompanhamento do pagamento

- Pagador: “Informei o pagamento” + data e valor. Texto de apoio: “Esta informação é sua declaração; o recebimento
  depende da confirmação de quem recebe.”
- Beneficiário: “Confirmar recebimento”. Texto: “Confirmo que recebi o valor informado.”
- Divergência: “Registrar divergência”. Aviso: “Descreva o fato, sem dados de pacientes. Autor e horário ficam
  registrados e visíveis à outra parte.”
- Prazo vencido: “Prazo vencido — recebimento não confirmado.” Sem afirmar inadimplemento.

## DEC-06 a DEC-08 — A redigir

Execução do plantão (L-6), manifestação de aprovador institucional (não é manifestação da instituição), cancelamento
e distrato. Dependem das decisões L-6 e P1-06.
