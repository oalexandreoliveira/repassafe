import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import HandoverGuidePage, {
  metadata as guideMetadata,
} from "@/app/repasse-de-plantao/page";
import sitemap from "@/app/sitemap";
import { LandingFaq } from "@/components/landing-faq";
import { faqItems } from "@/features/marketing/faq";
import {
  handoverGuide,
  handoverGuideSources,
} from "@/features/marketing/handover-guide";
import {
  handoverGuideStructuredData,
  homeStructuredData,
  siteUrl,
} from "@/lib/seo";

afterEach(cleanup);

const paymentNotice =
  "Valores e pagamento são combinados diretamente entre vocês. O Repassafe não intermedeia pagamentos.";

describe("perguntas frequentes", () => {
  it("mostra cada pergunta como item recolhível com a resposta", () => {
    const { container } = render(<LandingFaq />);
    const items = container.querySelectorAll("details");
    expect(items).toHaveLength(faqItems.length);
    faqItems.forEach(({ question, answer }, index) => {
      const item = items[index] as HTMLElement;
      expect(
        within(item).getByRole("heading", { level: 3, name: question }),
      ).toBeInTheDocument();
      expect(within(item).getByText(answer)).toBeInTheDocument();
    });
    expect(screen.getByRole("link", { name: /Leia o guia/ })).toHaveAttribute(
      "href",
      handoverGuide.path,
    );
  });

  it("publica no FAQPage exatamente o texto visível", () => {
    const faqPage = homeStructuredData()["@graph"].find(
      (node) => node["@type"] === "FAQPage",
    ) as { mainEntity: { name: string; acceptedAnswer: { text: string } }[] };
    expect(
      faqPage.mainEntity.map(({ name, acceptedAnswer }) => [
        name,
        acceptedAnswer.text,
      ]),
    ).toEqual(faqItems.map(({ question, answer }) => [question, answer]));
  });

  it("usa as frases fixas de pagamento e de dados de pacientes", () => {
    const answers = faqItems.map(({ answer }) => answer).join(" ");
    expect(answers).toContain(paymentNotice);
    expect(answers).toContain(
      "Não inclua nomes, leitos ou qualquer dado de pacientes.",
    );
  });
});

describe("guia de repasse de plantão", () => {
  it("renderiza título, fontes oficiais e o aviso de pagamento", () => {
    render(<HandoverGuidePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: handoverGuide.title }),
    ).toBeInTheDocument();
    for (const { href } of handoverGuideSources) {
      expect(
        screen
          .getAllByRole("link")
          .some((link) => link.getAttribute("href") === href),
      ).toBe(true);
    }
    expect(screen.getByText(paymentNotice)).toBeInTheDocument();
    expect(
      screen.getByText(/salvo por justo\s+impedimento \(art\. 9º\)/),
    ).toBeInTheDocument();
  });

  it("é indexável, canônico, datado e está no sitemap", () => {
    const url = `${siteUrl}${handoverGuide.path}`;
    expect(guideMetadata.robots).toEqual({ index: true, follow: true });
    expect(guideMetadata.alternates?.canonical).toBe(url);
    expect(guideMetadata.openGraph).toMatchObject({
      type: "article",
      publishedTime: handoverGuide.datePublished,
    });
    expect(sitemap()).toContainEqual({
      url,
      lastModified: handoverGuide.dateModified,
    });
    const [article, breadcrumb] = handoverGuideStructuredData()["@graph"];
    expect(article).toMatchObject({
      "@type": "Article",
      headline: handoverGuide.title,
      mainEntityOfPage: url,
    });
    expect(breadcrumb["@type"]).toBe("BreadcrumbList");
  });
});
