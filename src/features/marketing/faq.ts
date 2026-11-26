/**
 * Perguntas frequentes da página inicial. O mesmo texto alimenta a seção
 * visível e o JSON-LD FAQPage, que precisa coincidir com o que a página mostra.
 * Use só fatos confirmados em PRODUCT.md e as frases fixas de design/DESIGN.md §8.
 */
export const faqItems = [
  {
    question: "O que é o Repassafe?",
    answer:
      "É uma plataforma para médicos repassarem e assumirem plantões com colegas de CRM verificado. Quem não pode cumprir o plantão publica a oferta, os interessados se candidatam, as duas partes confirmam as condições e o acordo fica registrado.",
  },
  {
    question: "Já uso um app de agenda de plantões. Preciso do Repassafe?",
    answer:
      "A agenda organiza o seu mês, e o Repassafe também tem uma, com plantões, valores, prazos de pagamento e lembrete para cobrar. O que ele acrescenta é o repasse: uma anotação guarda só a sua versão; no acordo registrado, você e o colega aceitam as mesmas condições, com data-limite de pagamento, e o registro não pode ser editado. Repasses confirmados entram na agenda sozinhos.",
  },
  {
    question: "Quem pode usar?",
    answer:
      "Médicos com cadastro aprovado e CRM verificado pela equipe do Repassafe. Responsáveis por grupos institucionais também podem participar para decidir sobre repasses, mesmo sem atuar como médicos. O Repassafe está em piloto privado: você pode criar a conta ou entrar na lista de espera.",
  },
  {
    question: "Como o CRM é verificado?",
    answer:
      "Depois de criar a conta e confirmar o e-mail, você completa a identificação e os dados profissionais. A equipe confere o CRM antes de liberar repasses. A habilitação profissional e o acesso a grupos institucionais são analisados separadamente.",
  },
  {
    question: "Quem vê o plantão que eu publico?",
    answer:
      "Depende de onde você publica. Uma oferta de grupo aparece só para os membros daquele grupo. Uma oferta livre aparece para todos os médicos com cadastro aprovado.",
  },
  {
    question: "Preciso de aprovação da coordenação?",
    answer:
      "Depende do grupo. Quando um grupo institucional exige aprovação, o repasse só é concluído depois que o responsável registra a decisão. Grupos de colegas criados por médicos não substituem a autorização da instituição.",
  },
  {
    question: "O Repassafe intermedeia o pagamento?",
    answer:
      "Não. Valores e pagamento são combinados diretamente entre vocês. O Repassafe não intermedeia pagamentos.",
  },
  {
    question: "Posso informar dados de pacientes?",
    answer:
      "Não. O Repassafe trata apenas do repasse do plantão. Não inclua nomes, leitos ou qualquer dado de pacientes.",
  },
  {
    question: "O acordo pode ser alterado depois de registrado?",
    answer:
      "Não. O registro guarda as condições confirmadas e não pode ser editado. Se algo mudar, é preciso cancelar o acordo e iniciar um novo repasse.",
  },
  {
    question: "Quanto custa?",
    answer: "O piloto é gratuito.",
  },
] as const;
