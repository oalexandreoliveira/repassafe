/**
 * Guia público sobre repasse de plantão. Fontes conferidas nos documentos
 * oficiais em 16/11/2026; ao alterar o texto, atualize dateModified.
 */
export const handoverGuide = {
  path: "/repasse-de-plantao",
  title: "Como repassar um plantão médico com segurança",
  description:
    "Guia para repassar um plantão médico: o que diz o Código de Ética Médica, como escolher o substituto, combinar as condições e registrar o acordo.",
  datePublished: "2026-11-16",
  dateModified: "2026-11-16",
} as const;

export const handoverGuideSteps = [
  {
    title: "Confira as regras do serviço",
    text: "Pergunte à coordenação ou à direção técnica qual antecedência é exigida, se a troca precisa de aprovação e como a escala oficial é atualizada.",
  },
  {
    title: "Escolha um substituto habilitado",
    text: "Prefira um colega com inscrição regular no CRM do estado onde fica o serviço e, quando o setor exigir, com a especialidade necessária.",
  },
  {
    title: "Combine as condições por escrito",
    text: "Data, horário de início e de término, local e setor, valor e forma de pagamento. Condições vagas costumam virar dúvida depois do plantão.",
  },
  {
    title: "Obtenha a aprovação necessária",
    text: "Quando o serviço exige, o repasse só vale depois da decisão da coordenação. Confirme que a escala oficial mostra quem vai cumprir o plantão.",
  },
  {
    title: "Guarde o registro",
    text: "Mantenha o combinado num lugar que as duas partes possam consultar, com a data da confirmação. Ele ajuda a esclarecer responsabilidades se surgir uma dúvida.",
  },
  {
    title: "Faça a passagem pelos canais do serviço",
    text: "As informações dos pacientes seguem pelo prontuário e pelos meios do serviço, nunca pelo combinado do repasse.",
  },
] as const;

export const handoverGuideMistakes = [
  "Fechar o repasse com uma mensagem no grupo, sem confirmar as condições.",
  "Não avisar a coordenação e deixar a escala oficial desatualizada.",
  "Deixar valor, horário ou forma de pagamento para combinar depois.",
  "Enviar dados de pacientes em conversas sobre o repasse.",
  "Sair do plantão antes da chegada de quem assume o turno seguinte.",
] as const;

export const handoverGuideSources = [
  {
    label:
      "Código de Ética Médica, Resolução CFM nº 2.217/2018, art. 9º (Conselho Federal de Medicina)",
    href: "https://portal.cfm.org.br/images/PDF/cem2019.pdf",
  },
  {
    label:
      "Parecer CRM-PR nº 2.882/2022, escalas de plantões de urgência e emergência (Conselho Regional de Medicina do Paraná)",
    href: "https://sistemas.cfm.org.br/normas/arquivos/pareceres/PR/2022/2882_2022.pdf",
  },
] as const;
