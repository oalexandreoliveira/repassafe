import { LegalDocument } from "@/components/legal-document";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  path: "/privacidade",
  title: "Política de Privacidade",
  description:
    "Como o Repassafe trata dados pessoais de médicos e instituições, com que finalidades, com quem compartilha e como exercer seus direitos. Sem dados de pacientes.",
});

export default function PrivacyPage() {
  return <LegalDocument document="privacy" />;
}
