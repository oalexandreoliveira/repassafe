"use client";

import { Copy, Share2 } from "lucide-react";
import { useActionState, useState, useSyncExternalStore } from "react";
import {
  createGroupAction,
  createInviteAction,
  groupCommandAction,
  joinGroupAction,
  renameGroupAction,
} from "@/app/grupos/actions";
import { ActionFeedback } from "@/components/screens/auth-screen";
import groupStyles from "@/components/screens/groups.module.css";
import styles from "@/components/screens/screens.module.css";
import type { ButtonVariant } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { ConfirmSubmit } from "@/components/ui/confirm-submit";
import { SelectField, TextField } from "@/components/ui/field";
import { inviteValidityOptions } from "@/features/groups/labels";
import {
  initialGroupActionState,
  type GroupActionState,
} from "@/features/groups/types";
import { formatAuditTime } from "@/features/shifts/format";

type FormAction = (
  previous: GroupActionState,
  formData: FormData,
) => Promise<GroupActionState>;

const noopGroupAction: FormAction = async (previous) => previous;

export function CreateGroupForm({
  requestId,
  preview = false,
}: {
  requestId: string;
  /** Prévias de tela: envia para uma ação sem efeito. */
  preview?: boolean;
}) {
  const action = preview ? noopGroupAction : createGroupAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialGroupActionState,
  );
  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="requestId" value={requestId} />
      <TextField
        id="group-name"
        name="name"
        label="Nome do grupo"
        maxLength={80}
        required
        autoComplete="off"
        hint="Use o nome que os colegas já reconhecem. Ex.: Plantonistas UTI Adulto."
        error={state.fieldErrors?.name}
      />
      <ActionFeedback state={state} />
      <Button type="submit" block loading={pending}>
        Criar grupo
      </Button>
    </form>
  );
}

export function RenameGroupForm({
  requestId,
  groupId,
  name,
  preview = false,
}: {
  requestId: string;
  groupId: string;
  name: string;
  /** Prévias de tela: envia para uma ação sem efeito. */
  preview?: boolean;
}) {
  const action = preview ? noopGroupAction : renameGroupAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialGroupActionState,
  );
  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="groupId" value={groupId} />
      <TextField
        id="group-rename"
        name="name"
        label="Novo nome"
        defaultValue={name}
        maxLength={80}
        required
        autoComplete="off"
        error={state.fieldErrors?.name}
      />
      <ActionFeedback state={state} />
      <Button type="submit" variant="secondary" block loading={pending}>
        Salvar nome
      </Button>
    </form>
  );
}

const noSubscription = () => () => {};

/** Link recém-gerado: só aparece agora, porque o banco guarda apenas o hash. */
export function InviteLink({
  path,
  expiresAt,
  groupName,
}: {
  path: string;
  expiresAt?: string;
  groupName: string;
}) {
  const [status, setStatus] = useState("");
  // Endereço completo no navegador; no servidor (prévias) mostra o caminho.
  const origin = useSyncExternalStore(
    noSubscription,
    () => window.location.origin,
    () => "",
  );
  const url = () => new URL(path, window.location.origin).toString();
  const text = `Convite para o grupo ${groupName} no Repassafe. Só entra quem tem CRM verificado.`;
  async function copy() {
    try {
      await navigator.clipboard.writeText(url());
      setStatus("Link copiado.");
    } catch {
      setStatus("Não foi possível copiar. Selecione o link e copie.");
    }
  }
  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: groupName, text, url: url() });
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url()}`);
      setStatus("Convite copiado. Cole no grupo do WhatsApp.");
    } catch (error) {
      if ((error as Error)?.name !== "AbortError")
        setStatus("Não foi possível compartilhar. Copie o link.");
    }
  }
  return (
    <div className={groupStyles.linkBox}>
      <TextField
        id="invite-link"
        name="inviteLink"
        label="Link de convite"
        readOnly
        value={`${origin}${path}`}
        onFocus={(event) => event.currentTarget.select()}
        hint={
          expiresAt
            ? `Válido até ${formatAuditTime(expiresAt)}. Ele aparece só agora; para compartilhar depois, gere outro.`
            : "Ele aparece só agora; para compartilhar depois, gere outro."
        }
      />
      <Button type="button" block icon={<Share2 size={18} />} onClick={share}>
        Compartilhar convite
      </Button>
      <Button
        type="button"
        variant="secondary"
        block
        icon={<Copy size={18} />}
        onClick={copy}
      >
        Copiar link
      </Button>
      <p className={styles.help} role="status">
        {status}
      </p>
    </div>
  );
}

export function InviteForm({
  requestId,
  groupId,
  groupName,
  preview = false,
  previewInvitePath,
  previewExpiresAt,
}: {
  requestId: string;
  groupId: string;
  groupName: string;
  /** Prévias de tela: envia para uma ação sem efeito. */
  preview?: boolean;
  /** Prévias: começa no estado "link gerado". */
  previewInvitePath?: string;
  previewExpiresAt?: string;
}) {
  const action = preview ? noopGroupAction : createInviteAction;
  const [state, formAction, pending] = useActionState<
    GroupActionState,
    FormData
  >(
    action,
    previewInvitePath
      ? {
          status: "success",
          message: "Link de convite gerado.",
          invitePath: previewInvitePath,
          inviteExpiresAt: previewExpiresAt,
        }
      : initialGroupActionState,
  );
  return (
    <>
      {/* Depois de gerar, compartilhar é a ação principal; o link vem antes. */}
      {state.invitePath ? (
        <InviteLink
          key={state.invitePath}
          path={state.invitePath}
          expiresAt={state.inviteExpiresAt}
          groupName={groupName}
        />
      ) : null}
      <form action={formAction} className={styles.form}>
        <input type="hidden" name="requestId" value={requestId} />
        <input type="hidden" name="groupId" value={groupId} />
        <SelectField
          id="invite-validity"
          name="validityDays"
          label="Validade do link"
          defaultValue="7"
          error={state.fieldErrors?.validityDays}
        >
          {inviteValidityOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </SelectField>
        {state.status === "error" ? <ActionFeedback state={state} /> : null}
        <Button
          type="submit"
          variant={state.invitePath ? "secondary" : "primary"}
          block
          loading={pending}
        >
          {state.invitePath ? "Gerar outro link" : "Gerar link de convite"}
        </Button>
      </form>
    </>
  );
}

/** Ação de gestão com confirmação (revogar, remover, transferir, sair, arquivar). */
export function GroupCommandForm({
  requestId,
  groupId,
  operation,
  fields = {},
  label,
  question,
  confirmLabel,
  keepLabel = "Voltar",
  variant = "ghost",
  preview = false,
}: {
  requestId: string;
  groupId: string;
  operation:
    "revoke_invite" | "remove_member" | "transfer" | "leave" | "archive";
  fields?: Record<string, string>;
  label: string;
  question: string;
  confirmLabel: string;
  keepLabel?: string;
  variant?: ButtonVariant;
  /** Prévias de tela: envia para uma ação sem efeito. */
  preview?: boolean;
}) {
  const action = preview ? noopGroupAction : groupCommandAction;
  const [state, formAction] = useActionState(action, initialGroupActionState);
  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="groupId" value={groupId} />
      <input type="hidden" name="operation" value={operation} />
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <ConfirmSubmit
        question={question}
        confirmLabel={confirmLabel}
        keepLabel={keepLabel}
        variant={variant}
      >
        {label}
      </ConfirmSubmit>
      <ActionFeedback state={state} />
    </form>
  );
}

export function JoinGroupForm({
  requestId,
  token,
  preview = false,
}: {
  requestId: string;
  token: string;
  /** Prévias de tela: envia para uma ação sem efeito. */
  preview?: boolean;
}) {
  const action = preview ? noopGroupAction : joinGroupAction;
  const [state, formAction, pending] = useActionState(
    action,
    initialGroupActionState,
  );
  return (
    <form action={formAction} className={styles.form}>
      <input type="hidden" name="requestId" value={requestId} />
      <input type="hidden" name="token" value={token} />
      <ActionFeedback state={state} />
      <Button type="submit" block loading={pending}>
        Entrar no grupo
      </Button>
    </form>
  );
}
