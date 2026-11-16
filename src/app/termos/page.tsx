import { LegalDocument } from "@/components/legal-document";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata({
  path: "/termos",
  title: "Termos de Uso",
  description:
    "Termos de uso do Repassafe: conta e habilitação, compromissos, uso permitido, agenda pessoal e suporte no repasse de plantões entre médicos.",
});

export default function TermsPage() {
  return <LegalDocument document="terms" />;
}
