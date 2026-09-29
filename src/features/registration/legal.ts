import { legalVersion } from "./schemas";

export const legalDocuments = {
  terms: {
    title: "Termos de uso",
    version: legalVersion,
    sections: [
      [
        "Responsável e serviço",
        "Alexandre Oliveira é o responsável pelo Repassafe. A plataforma organiza ofertas, candidaturas, confirmações e evidências de repasses de plantões. Não presta atendimento médico, não emprega participantes e não processa o pagamento combinado entre eles.",
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
        "Uso permitido",
        "Não cadastre informações de pacientes, prontuários ou dados de saúde nas mensagens, fotos e documentos. Não use contas de terceiros, publique informações falsas ou tente acessar dados sem autorização. A equipe pode solicitar correções ou restringir o acesso, registrando o motivo e oferecendo orientação ao titular.",
      ],
      [
        "Disponibilidade e alterações",
        "Falhas técnicas podem interromper o serviço. Confira as confirmações registradas e procure suporte quando houver dúvida. Alterações relevantes destes termos serão comunicadas com nova versão; os aceites anteriores ficam registrados. As condições acordadas entre as partes permanecem nos respectivos históricos.",
      ],
      [
        "Suporte e encerramento",
        "Em /suporte, envie sua solicitação e guarde o protocolo. Pedidos de correção, contestação, encerramento de conta e exercício de direitos de privacidade são encaminhados à administração. O encerramento não apaga automaticamente evidências cuja conservação seja necessária para cumprir obrigações ou defender direitos.",
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
        "Tratamos identificação civil, CPF, nascimento, contatos e foto para identificar o titular e prevenir duplicidades; CRM, UF, especialidade e RQE para verificar a atuação; vínculos declarados para contextualizar o cadastro; e ofertas, candidaturas, acordos e ocorrências para operar os repasses. Senhas e confirmações de contatos são gerenciadas pelo provedor de autenticação. Não envie dados de pacientes.",
      ],
      [
        "Fundamentos",
        "O cadastro e os acordos usam dados necessários à execução do serviço e a procedimentos solicitados pelo titular. Registros de segurança e prevenção de abuso atendem à proteção da operação, com acesso limitado. Obrigações legais e defesa de direitos podem justificar conservação de evidências. O aceite desta política registra sua ciência; não constitui autorização genérica para finalidades diferentes.",
      ],
      [
        "Acesso e fornecedores",
        "Dados civis e documentos são restritos ao próprio titular e à equipe autorizada. Outros participantes recebem informações profissionais necessárias ao fluxo; declarações não confirmam vínculos institucionais. Usamos Supabase para autenticação, banco e arquivos e Vercel para hospedagem. Essas operações podem envolver infraestrutura fora do Brasil, sujeita às condições aplicáveis dos fornecedores. SMS aguarda configuração de provedor e não produz confirmação fictícia.",
      ],
      [
        "Conservação e proteção",
        "Restringimos permissões, protegemos arquivos em armazenamento privado e registramos ações relevantes. Dados ficam enquanto necessários à conta, aos acordos, às obrigações aplicáveis e à resolução de disputas; a equipe avalia exclusão ou anonimização quando essas finalidades cessam. Cópias de segurança seguem sua retenção operacional. Cookies de sessão mantêm a autenticação; não são usados para publicidade nesta versão.",
      ],
      [
        "Direitos",
        "Você pode pedir confirmação do tratamento, acesso, correção, esclarecimento sobre compartilhamento, revisão de decisões e, quando cabível, portabilidade, anonimização ou exclusão. A equipe pode verificar sua identidade sem solicitar a senha. Caso a resposta não resolva seu pedido, é possível recorrer à ANPD. Mudanças relevantes serão comunicadas e versionadas.",
      ],
    ],
  },
} as const;
