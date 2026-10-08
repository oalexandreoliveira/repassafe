import type { Metadata } from "next";
import {
  Bell,
  Calendar,
  Check,
  ChevronLeft,
  Clock,
  FileText,
  Inbox,
  MapPin,
  Share2,
  Users,
} from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/button";
import {
  CheckboxField,
  SearchField,
  SelectField,
  TextAreaField,
  TextField,
} from "@/components/ui/field";
import { EmptyState } from "@/components/ui/empty-state";
import { FilterChip, FilterChipList } from "@/components/ui/filter-chip";
import { IconButton } from "@/components/ui/icon-button";
import { InfoBanner } from "@/components/ui/info-banner";
import { InfoTile, InfoTileGrid } from "@/components/ui/info-tile";
import { KeyValueList } from "@/components/ui/key-value-list";
import { Logo } from "@/components/ui/logo";
import { NotificationItem } from "@/components/ui/notification-item";
import {
  CandidateCard,
  CrmVerifiedSeal,
  PersonRow,
} from "@/components/ui/person";
import { ProgressSteps, StepList } from "@/components/ui/progress";
import {
  AuditTrail,
  RegistryBlock,
  RegistryCard,
  RegistrySeal,
} from "@/components/ui/registry";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { ShiftCard, ShiftCardSkeleton } from "@/components/ui/shift-card";
import { StatusChip } from "@/components/ui/status-chip";
import { TabBar } from "@/components/ui/tab-bar";
import { Toggle } from "@/components/ui/toggle";
import {
  Fab,
  GroupLabel,
  RootTopBar,
  ScreenHeading,
  TopBar,
} from "@/components/ui/app-shell";
import {
  applicationPresentation,
  offerPresentation,
  substitutionPresentation,
} from "@/features/shifts/presentation";
import {
  formatAuditTime,
  formatDayHeading,
  formatDuration,
  formatHourRange,
  formatHourRangeShort,
  formatPeriod,
  formatShiftDay,
} from "@/features/shifts/format";
import { offerStatusLabels } from "@/features/shifts/schemas";
import type { ShiftStatus } from "@/styles/theme";
import { requireDevPages } from "../enabled";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Catálogo de componentes | Repassafe",
  robots: { index: false, follow: false },
};

// Dados fictícios: sábado, 10/10/2026, 19:00 → domingo, 11/10, 07:00 (Fortaleza).
const start = "2026-10-10T22:00:00.000Z";
const end = "2026-10-11T10:00:00.000Z";

const colorTokens = [
  "ink",
  "ink-2",
  "teal",
  "teal-dark",
  "mint",
  "mist",
  "base",
  "white",
  "amber",
  "text-secondary",
  "text-muted",
  "border",
  "divider",
  "track",
  "disabled",
];

const tones: { tone: ShiftStatus; label: string }[] = [
  { tone: "open", label: "Aberto" },
  { tone: "pending", label: "Aguardando candidato" },
  { tone: "institutional", label: "Em aprovação institucional" },
  { tone: "confirmed", label: "Confirmado" },
  { tone: "registered", label: "Acordo registrado" },
  { tone: "cancelled", label: "Cancelado" },
  { tone: "empty", label: "Sem candidaturas" },
];

const typeScale = [
  ["display", "Repasse confirmado"],
  ["h1", "Plantões abertos"],
  ["h1-sm", "Detalhe do plantão"],
  ["h2", "Próximos passos"],
  ["card-title", "UTI Adulto · Hospital Exemplo"],
  ["body", "Você recebe um aviso assim que houver resposta."],
  ["body-sm", "Publicados nos seus 3 grupos"],
  ["label", "Observações operacionais"],
  ["caption", "Publicado há 20 min · 2 candidaturas"],
  ["micro", "Plantões · Publicar · Acordos · Perfil"],
  ["mono", "sha256 3f9a…c21e"],
];

const sections = [
  ["marca", "Marca e cores"],
  ["tipografia", "Tipografia"],
  ["botoes", "Button e IconButton"],
  ["status", "StatusChip e mapeamento"],
  ["filtros", "FilterChip"],
  ["cartoes", "ShiftCard"],
  ["campos", "Campos"],
  ["segmentos", "SegmentedControl"],
  ["avisos", "InfoBanner"],
  ["pessoas", "PersonRow e CandidateCard"],
  ["dados", "KeyValueList, Toggle e InfoTile"],
  ["progresso", "ProgressSteps e StepList"],
  ["registro", "AuditTrail e RegistrySeal"],
  ["notificacoes", "NotificationItem"],
  ["estrutura", "TopBar, FAB e TabBar"],
  ["vazio", "EmptyState"],
] as const;

function Section({
  id,
  children,
}: {
  id: (typeof sections)[number][0];
  children: React.ReactNode;
}) {
  const title = sections.find(([key]) => key === id)?.[1];
  return (
    <section id={id} className={styles.section} aria-labelledby={`${id}-title`}>
      <h2 id={`${id}-title`} className={styles.sectionTitle}>
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function ComponentCatalogPage() {
  await requireDevPages();

  const shiftDay = formatShiftDay(start);
  const shortHours = formatHourRangeShort(start, end);

  return (
    <main className={styles.page}>
      <header className={styles.intro}>
        <Logo />
        <h1>Catálogo de componentes</h1>
        <p>
          Componentes de design/DESIGN.md §6 com dados fictícios. Disponível
          apenas fora de produção.
        </p>
        <nav aria-label="Seções do catálogo">
          <ul className={styles.toc}>
            {sections.map(([id, title]) => (
              <li key={id}>
                <a href={`#${id}`}>{title}</a>
              </li>
            ))}
          </ul>
        </nav>
      </header>

      <Section id="marca">
        <div className={styles.row}>
          <Logo />
          <Logo variant="symbol" height={30} alt="" />
          <Logo variant="symbol-small" height={24} alt="" />
        </div>
        <div className={styles.darkSurface}>
          <Logo variant="horizontal-negative" />
        </div>
        <ul className={styles.swatches}>
          {colorTokens.map((token) => (
            <li key={token} className={styles.swatch}>
              <span style={{ background: `var(--rs-${token})` }} />
              <code>--rs-{token}</code>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="tipografia">
        {typeScale.map(([token, sample]) => (
          <p key={token} className={styles.typeSample}>
            <small>--rs-type-{token}</small>
            <span
              style={{
                font: `var(--rs-type-${token})`,
                letterSpacing: `var(--rs-track-${token}, 0)`,
              }}
            >
              {sample}
            </span>
          </p>
        ))}
        <GroupLabel>{formatDayHeading(start)}</GroupLabel>
      </Section>

      <Section id="botoes">
        <div className={styles.stack}>
          <Button block>Publicar plantão</Button>
          <Button variant="secondary" block>
            Voltar aos plantões
          </Button>
          <Button variant="ghost" block>
            Cancelar candidatura
          </Button>
          <Button variant="dark" block>
            Variante escura
          </Button>
          <Button size="sm" block>
            Ver plantão
          </Button>
          <Button
            variant="secondary"
            size="sm"
            block
            icon={<Share2 size={18} />}
          >
            Compartilhar no grupo
          </Button>
          <Button block loading>
            Publicando
          </Button>
          <Button block disabled>
            Selecionar e revisar condições
          </Button>
          <ButtonLink href="#botoes" variant="secondary" block>
            Link com aparência de botão
          </ButtonLink>
        </div>
        <div className={styles.row}>
          <IconButton label="Voltar" icon={<ChevronLeft size={20} />} />
          <IconButton label="Notificações" icon={<Bell size={20} />} />
          <IconButton
            label="Notificações, há novas"
            icon={<Bell size={20} />}
            badge
          />
        </div>
      </Section>

      <Section id="status">
        <div className={styles.row}>
          {tones.map(({ tone, label }) => (
            <StatusChip key={tone} tone={tone}>
              {label}
            </StatusChip>
          ))}
        </div>
        <p className={styles.note}>
          Mapeamento de apresentação dos estados da oferta (os enums do domínio
          não mudam).
        </p>
        <table className={styles.mapping}>
          <thead>
            <tr>
              <th scope="col">Domínio</th>
              <th scope="col">Mural</th>
              <th scope="col">Titular</th>
            </tr>
          </thead>
          <tbody>
            {Object.keys(offerStatusLabels).map((status) => {
              const mural = offerPresentation({
                offerStatus: status,
                view: "mural",
              });
              const owner = offerPresentation({
                offerStatus: status,
                view: "owner",
                activeApplications: 2,
              });
              return (
                <tr key={status}>
                  <td>
                    <code>{status}</code>
                  </td>
                  <td>
                    <StatusChip tone={mural.tone}>{mural.label}</StatusChip>
                  </td>
                  <td>
                    <StatusChip tone={owner.tone}>{owner.label}</StatusChip>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className={styles.row}>
          {(
            [
              substitutionPresentation("pending_institutional_approval"),
              applicationPresentation("active"),
              applicationPresentation("confirmed"),
            ] as const
          ).map((item) => (
            <StatusChip key={item.label} tone={item.tone}>
              {item.label}
            </StatusChip>
          ))}
        </div>
      </Section>

      <Section id="filtros">
        <FilterChipList label="Filtrar plantões">
          <FilterChip selected>Esta semana</FilterChip>
          <FilterChip>Noturno</FilterChip>
          <FilterChip>UTI</FilterChip>
          <FilterChip>Fim de semana</FilterChip>
        </FilterChipList>
      </Section>

      <Section id="cartoes">
        <GroupLabel>{formatDayHeading(start)}</GroupLabel>
        <ShiftCard
          status={offerPresentation({
            offerStatus: "open_normal",
            view: "mural",
          })}
          group="Plantonistas UTI"
          title="UTI Adulto · Hospital Exemplo"
          date="10/10"
          time={shortHours}
          meta="Publicado há 20 min"
          action={
            <ButtonLink href="#cartoes" size="sm" block>
              Ver plantão
            </ButtonLink>
          }
        />
        <ShiftCard
          status={offerPresentation({
            offerStatus: "open_normal",
            view: "mural",
          })}
          group="Clínica PS"
          title="Pronto-socorro · Hospital Exemplo"
          date="10/10"
          time="07h – 19h"
          meta="Publicado há 2 h"
          href="#cartoes"
        />
        <ShiftCard
          status={offerPresentation({
            offerStatus: "open_normal",
            view: "owner",
            activeApplications: 3,
          })}
          group="Clínica PS"
          title="Pronto-socorro · Hospital Exemplo"
          date={shiftDay}
          time="07h – 19h"
          meta="Escolha até sex, 18h"
          selected
        />
        <ShiftCardSkeleton />
      </Section>

      <Section id="campos">
        <SearchField
          label="Buscar setor ou hospital"
          name="busca"
          placeholder="Buscar setor ou hospital"
        />
        <SelectField label="Grupo" name="grupo" defaultValue="uti">
          <option value="uti">Plantonistas UTI · Hospital Exemplo</option>
          <option value="">Oferta livre — sem grupo</option>
        </SelectField>
        <TextField label="Setor" name="setor" defaultValue="UTI Adulto" />
        <TextField
          label="Setor"
          name="setor-erro"
          defaultValue="U"
          error="Informe o setor com pelo menos 2 caracteres."
        />
        <div className={styles.dateGrid}>
          <TextField
            label="Data"
            name="data"
            type="date"
            defaultValue="2026-10-10"
          />
          <TextField
            label="Início"
            name="inicio"
            type="time"
            defaultValue="19:00"
          />
          <TextField label="Fim" name="fim" type="time" defaultValue="07:00" />
        </div>
        <TextAreaField
          label="Observações operacionais"
          name="observacoes"
          placeholder="Ex.: passagem de plantão presencial às 18h45 com a equipe de enfermagem."
        />
        <InfoBanner variant="warning">
          Não inclua nomes, leitos ou qualquer dado de pacientes.
        </InfoBanner>
        <CheckboxField
          label="Li e concordo com as condições acima. Sei que, depois de registrado, o acordo não pode ser alterado."
          name="concordo"
        />
      </Section>

      <Section id="segmentos">
        <SegmentedControl
          label="Meus plantões publicados"
          segments={[
            { label: "Abertos", count: 2, href: "#segmentos", active: true },
            { label: "Andamento", count: 1, href: "#segmentos-andamento" },
            { label: "Registrados", href: "#segmentos-registrados" },
          ]}
        />
      </Section>

      <Section id="avisos">
        <InfoBanner>
          Você só assume o plantão depois que os dois confirmarem as condições e
          o acordo for registrado. Valores são combinados diretamente com quem
          publicou.
        </InfoBanner>
        <InfoBanner icon={Share2}>
          Depois de publicar, você pode compartilhar o link no grupo do
          WhatsApp. Quem tocar cai direto neste plantão.
        </InfoBanner>
        <InfoBanner variant="warning">
          Não inclua nomes, leitos ou qualquer dado de pacientes.
        </InfoBanner>
        <InfoBanner variant="neutral">
          Este grupo exige <strong>aprovação da coordenação</strong> antes do
          acordo ser registrado.
        </InfoBanner>
        <InfoBanner variant="dark">
          Valores e pagamento são combinados diretamente entre vocês. O
          Repassafe não intermedeia pagamentos.
        </InfoBanner>
      </Section>

      <Section id="pessoas">
        <PersonRow label="Publicado por" name="Dr. Rafael Souza" verified />
        <div className={styles.row}>
          <CrmVerifiedSeal />
        </div>
        <fieldset className={styles.stack} style={{ border: 0, padding: 0 }}>
          <legend className="sr-only">Escolher substituto</legend>
          <CandidateCard
            inputName="substituto"
            value="ana"
            name="Dra. Ana Moreira"
            details="Intensivista"
            meta="Candidatou-se hoje, 14:32"
            defaultChecked
          />
          <CandidateCard
            inputName="substituto"
            value="rafael"
            name="Dr. Rafael Souza"
            details="Clínica médica"
            meta="Candidatou-se hoje, 15:05"
            verified
          />
          <CandidateCard
            inputName="substituto"
            value="lia"
            name="Dra. Lia Costa"
            meta="Candidatou-se ontem, 21:48"
          />
        </fieldset>
      </Section>

      <Section id="dados">
        <KeyValueList
          items={[
            { label: "Plantão", value: "UTI Adulto · Hospital Exemplo" },
            { label: "Período", value: formatPeriod(start, end) },
            { label: "Aprovação da coordenação", value: "Exigida pelo grupo" },
            {
              label: "Responsabilidade",
              value:
                "Transferida integralmente a quem assume a partir do início do plantão.",
              stacked: true,
            },
          ]}
        />
        <div className={styles.frame} style={{ padding: "4px 16px" }}>
          <Toggle
            label="Avisar membros do grupo"
            name="avisar"
            defaultChecked
          />
          <Toggle label="Opção desligada" name="desligado" />
        </div>
        <InfoTileGrid label="Dados do plantão">
          <InfoTile icon={Calendar} label="Data" value={shiftDay} />
          <InfoTile
            icon={Clock}
            label="Horário"
            value={formatHourRange(start, end)}
          />
          <InfoTile icon={MapPin} label="Local" value="Hospital Exemplo" />
          <InfoTile
            icon={Inbox}
            label="Duração"
            value={formatDuration(start, end)}
          />
        </InfoTileGrid>
      </Section>

      <Section id="progresso">
        <ProgressSteps
          total={2}
          current={2}
          caption="Etapa 2 de 2 · é assim que os colegas vão ver"
        />
        <ProgressSteps
          total={5}
          current={3}
          caption="Etapa 3 de 5 · depois: aprovação da coordenação e registro"
        />
        <StepList
          title="Próximos passos"
          steps={[
            {
              title: "Candidatura enviada",
              description: `UTI Adulto · ${shiftDay}, ${shortHours}`,
              state: "done",
            },
            {
              title: "Escolha de quem publicou",
              description: "Aguardando a decisão",
              state: "current",
            },
            {
              title: "Confirmação das condições",
              description: "Os dois aceitam os mesmos termos",
              state: "upcoming",
            },
            {
              title: "Acordo registrado",
              description: "Com data, hora e trilha de auditoria",
              state: "upcoming",
            },
          ]}
        />
      </Section>

      <Section id="registro">
        <RegistryCard
          title="Registro do acordo"
          badge={<StatusChip tone="registered">Imutável</StatusChip>}
        >
          <RegistryBlock
            lines={[
              "ACORDO 7d1c2e9a-0000-4000-8000-000000000000",
              `registrado ${formatAuditTime(end)}`,
              "sha256 3f9a6b0c1d2e3f405162738495a6b7c8d9e0f1a2b3c4d5e6f708192a3b4c5d6e",
            ]}
          />
        </RegistryCard>
        <AuditTrail
          events={[
            {
              label: "Plantão publicado",
              time: "10/10 09:12",
              dateTime: "2026-10-10T12:12:00.000Z",
            },
            {
              label: "Substituto selecionado",
              time: "10/10 16:40",
              dateTime: "2026-10-10T19:40:00.000Z",
            },
            {
              label: "Condições aceitas pelos dois",
              time: "10/10 17:02",
              dateTime: "2026-10-10T20:02:00.000Z",
            },
            {
              label: "Aprovado pela coordenação",
              time: "10/10 18:15",
              dateTime: "2026-10-10T21:15:00.000Z",
            },
          ]}
        />
        <RegistrySeal
          title="Selo de acordo registrado"
          detail="ACORDO 7d1c2e9a · sha256 3f9a…5d6e · 10/10 18:15"
        />
      </Section>

      <Section id="notificacoes">
        <NotificationItem
          tone="action"
          icon={Check}
          title="Você foi selecionado"
          body="Pronto-socorro · Dom 11/10, 07h – 19h. Confirme as condições."
          time="agora"
          dateTime="2026-10-10T12:00:00.000Z"
          unread
          action={
            <ButtonLink href="#notificacoes" size="sm" block>
              Confirmar condições
            </ButtonLink>
          }
        />
        <NotificationItem
          tone="info"
          icon={Calendar}
          title="Novo plantão disponível"
          body={`UTI Adulto · ${shiftDay}, ${shortHours} · Plantonistas UTI`}
          time="2 min"
          dateTime="2026-10-10T11:58:00.000Z"
          href="#notificacoes"
        />
        <NotificationItem
          tone="info"
          icon={Users}
          title="2 novas candidaturas"
          body="Para o seu plantão de domingo no Pronto-socorro"
          time="1 h"
          dateTime="2026-10-10T11:00:00.000Z"
          href="#notificacoes"
        />
        <NotificationItem
          tone="history"
          icon={FileText}
          title="Repasse confirmado"
          body="Enfermaria, 08/10"
          time="ontem"
          dateTime="2026-10-09T12:00:00.000Z"
          href="#notificacoes"
        />
      </Section>

      <Section id="estrutura">
        <div className={styles.frame}>
          <RootTopBar unread notificationsHref="#estrutura" />
          <div style={{ padding: "4px 20px 16px" }}>
            <ScreenHeading
              title="Plantões abertos"
              subtitle="Publicados nos seus 3 grupos"
            />
          </div>
        </div>
        <div className={styles.frame}>
          <TopBar title="Detalhe do plantão" backHref="#estrutura" />
        </div>
        <Fab href="#estrutura" placement="static">
          Publicar plantão
        </Fab>
        <div className={styles.frame}>
          <TabBar placement="static" active="plantoes" />
        </div>
        <div className={styles.frame}>
          <TabBar placement="static" active="publicar" />
        </div>
        <div className={styles.frame}>
          <TabBar placement="static" active="perfil" canPublish={false} />
        </div>
      </Section>

      <Section id="vazio">
        <EmptyState
          icon={Calendar}
          title="Nenhum plantão aberto nos seus grupos"
          action={
            <ButtonLink href="#vazio" block>
              Publicar plantão
            </ButtonLink>
          }
        />
        <EmptyState icon={Check} title="Candidatura enviada">
          Dr. Rafael Souza vai escolher entre os candidatos. Você recebe um
          aviso assim que houver resposta.
        </EmptyState>
      </Section>
    </main>
  );
}
