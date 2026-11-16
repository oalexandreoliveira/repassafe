import { legalVersion } from "./schemas";

export const legalDocuments = {
  terms: {
    title: "Termos de uso",
    version: legalVersion,
    sections: [
      [
        "Responsável e serviço",
        "Alexandre Oliveira é o responsável pelo Repassafe. A plataforma organiza ofertas, candidaturas, confirmações e evidências de repasses de plantões, além de uma agenda pessoal de plantões e pagamentos. Não presta atendimento médico, não emprega participantes e não processa o pagamento combinado entre eles.",
      ],
      [
        "Conta e habilitação",
        "Forneça dados verdadeiros e mantenha seus contatos atualizados. Confirmar a conta não habilita a atuação médica. A verificação profissional e a autorização de cada instituição são processos distintos. A aprovação de grupos não concede direitos médicos. Guarde sua senha e comunique suspeitas de uso indevido pelo canal de suporte.",
      ],
      [
        "Compromissos",
        "Revise horário, local, valor e condições antes de aceitar um plantão. As partes respondem pelas informações declaradas e pelo cumprimento dos acordos. A plataforma preserva os registros de confirmação e permite comunicar ocorrências; uma avaliação não substitui apuração profissional ou institucional.",
      ],
      [
        "Agenda pessoal",
        "A agenda é uma ferramenta de organização individual. As anotações que você cria são visíveis apenas para você, não têm o aceite de outra parte e não constituem acordo registrado nem prova de compromisso entre pessoas; para isso, use o registro de acordo. Você responde pelo que anota, inclusive nomes de instituições ou colegas, e pode editar ou excluir as anotações a qualquer momento. Você pode baixar um arquivo para a agenda do celular, que não se atualiza depois, e repassar um plantão anotado pela publicação ou pelo acordo registrado, com os dados já preenchidos; o repasse segue as regras do fluxo escolhido, e a anotação não vira acordo. Os lembretes de pagamento aparecem na central de notificações e podem ser ajustados ou desligados. O botão de cobrança abre o seu WhatsApp com uma mensagem para você revisar; o Repassafe não envia mensagens a terceiros e não intermedeia pagamentos.",
      ],
      [
        "Uso permitido",
        "Não cadastre informações de pacientes, prontuários ou dados de saúde nas mensagens, anotações, fotos e documentos. Não use contas de terceiros, publique informações falsas ou tente acessar dados sem autorização. A equipe pode solicitar correções ou restringir o acesso, registrando o motivo e oferecendo orientação ao titular.",
      ],
      [
        "Disponibilidade e alterações",
        "Falhas técnicas podem interromper o serviço. Confira as confirmações registradas e procure suporte quando houver dúvida. Alterações relevantes destes termos serão comunicadas com nova versão; os aceites anteriores ficam registrados. As condições acordadas entre as partes permanecem nos respectivos históricos.",
      ],
      [
        "Suporte e encerramento",
        "Em /suporte, envie sua solicitação e guarde o protocolo. Pedidos de correção, contestação, encerramento de conta e exercício de direitos de privacidade são encaminhados à administração. O encerramento não apaga automaticamente evidências cuja conservação seja necessária para cumprir obrigações ou defender direitos.",
      ],
      [
        "O que mudou nesta versão",
        "Versão de 16/11/2026: inclui o arquivo para a agenda do celular e o repasse de um plantão a partir da agenda. A versão de 15/11/2026 incluiu a agenda pessoal, com anotações, lembretes de pagamento e cobrança pelo WhatsApp. Os aceites das versões anteriores, de 15/11/2026 e 29/09/2026, permanecem registrados.",
      ],
    ],
  },
  privacy: {
    title: "Política de privacidade",
    version: legalVersion,
    sections: [
      [
        "Responsável e contato",
        "Alexandre Oliveira é o responsável pelo tratamento de dados no Repassafe. Use /suporte e selecione Privacidade para exercer seus direitos. O formulário gera um protocolo e permite consultar a resposta. Nenhum CNPJ ou endereço eletrônico é presumido nesta política.",
      ],
      [
        "Dados e finalidades",
        "Tratamos identificação civil, CPF, nascimento, contatos e foto para identificar o titular e prevenir duplicidades; CRM, UF, especialidade e RQE para verificar a atuação; vínculos declarados para contextualizar o cadastro; ofertas, candidaturas, acordos e ocorrências para operar os repasses; o e-mail para enviar mensagens de acesso à conta e, depois de confirmado, o registro final do acordo e avisos críticos; e, na agenda pessoal, datas, horários, local, setor, valores, prazos, forma de pagamento, nome de quem paga ou recebe e observações que você informa, para organizar seus plantões e lembrar pagamentos. Senhas e confirmações de contatos são gerenciadas pelo provedor de autenticação. Não envie dados de pacientes.",
      ],
      [
        "Fundamentos",
        "O cadastro, os acordos e a agenda usam dados necessários à execução do serviço e a procedimentos solicitados pelo titular. Registros de segurança e prevenção de abuso atendem à proteção da operação, com acesso limitado. Obrigações legais e defesa de direitos podem justificar conservação de evidências. O aceite desta política registra sua ciência; não constitui autorização genérica para finalidades diferentes.",
      ],
      [
        "Agenda pessoal",
        "As anotações da agenda ficam visíveis somente para você; aprovadores, outros participantes e a equipe não as consultam pela plataforma. Repasses e acordos de que você já participa aparecem na sua agenda a partir dos registros existentes. Ao informar uma instituição, cooperativa ou colega, use apenas o necessário para identificar quem paga ou recebe; não informe CPF, telefone, e-mail nem dados de pacientes. Os lembretes geram avisos internos sem valor, nomes ou local, e não são enviados por e-mail. O arquivo para a agenda do celular é gerado a seu pedido e entregue só a você, com local, setor e horários e, apenas se você marcar, valor e nome de quem paga ou recebe; se a agenda do aparelho sincroniza com outro serviço, o conteúdo segue as regras desse serviço. Ao repassar um plantão a partir da agenda, data, horário, local e setor são copiados para a publicação ou o acordo registrado, que você revisa antes de enviar; a anotação continua privada. O botão de cobrança abre o seu WhatsApp com uma mensagem montada no seu aparelho; o conteúdo só chega ao WhatsApp se você decidir enviar. Você pode editar ou excluir as anotações a qualquer momento, e a exclusão é definitiva.",
      ],
      [
        "Acesso e fornecedores",
        "Dados civis e documentos são restritos ao próprio titular e à equipe autorizada. Outros participantes recebem informações profissionais necessárias ao fluxo; declarações não confirmam vínculos institucionais. Usamos Supabase para autenticação, banco e arquivos, Vercel para hospedagem e Resend para enviar e-mails. O Resend envia as mensagens de acesso à conta, como confirmação de cadastro, recuperação de senha, alteração de e-mail e convites; nelas, recebe o endereço do destinatário, o novo endereço quando houver troca e um link ou código de uso único. Também envia o registro final do acordo e avisos críticos, como seleção, prazo de confirmação, cancelamento e decisão de cadastro; nesses envios, recebe o endereço do destinatário e um resumo mínimo: o tipo de aviso, o prazo de resposta quando houver e um link que exige entrar na conta, sem dados do plantão, valores ou campos livres. Essas operações podem envolver infraestrutura fora do Brasil, sujeita às condições aplicáveis dos fornecedores. SMS aguarda configuração de provedor e não produz confirmação fictícia.",
      ],
      [
        "Conservação e proteção",
        "Restringimos permissões, protegemos arquivos em armazenamento privado e registramos ações relevantes. Dados ficam enquanto necessários à conta, aos acordos, às obrigações aplicáveis e à resolução de disputas; a equipe avalia exclusão ou anonimização quando essas finalidades cessam. Anotações da agenda ficam até você excluí-las ou encerrar a conta. Cópias de segurança seguem sua retenção operacional. Cookies de sessão mantêm a autenticação; não são usados para publicidade nesta versão.",
      ],
      [
        "Direitos",
        "Você pode pedir confirmação do tratamento, acesso, correção, esclarecimento sobre compartilhamento, revisão de decisões e, quando cabível, portabilidade, anonimização ou exclusão. A equipe pode verificar sua identidade sem solicitar a senha. Caso a resposta não resolva seu pedido, é possível recorrer à ANPD. Mudanças relevantes serão comunicadas e versionadas.",
      ],
      [
        "O que mudou nesta versão",
        "Versão de 16/11/2026: informa que as mensagens de acesso à conta, como confirmação de cadastro e recuperação de senha, também são enviadas pelo Resend, e inclui o arquivo para a agenda do celular e o repasse a partir da agenda. A versão de 15/11/2026 incluiu a agenda pessoal (dados anotados, quem vê, lembretes, cobrança pelo WhatsApp e exclusão) e o Resend como fornecedor dos e-mails do registro final e dos avisos críticos. Os aceites das versões anteriores, de 15/11/2026 e 29/09/2026, permanecem registrados.",
      ],
    ],
  },
} as const;
