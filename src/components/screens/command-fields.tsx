import { randomUUID } from "node:crypto";

/** Campos ocultos dos comandos de fluxo: id idempotente e alvo. */
export function CommandFields({ targetId }: { targetId?: string }) {
  return (
    <>
      <input type="hidden" name="commandId" value={randomUUID()} />
      {targetId ? (
        <input type="hidden" name="targetId" value={targetId} />
      ) : null}
    </>
  );
}

export type FormAction = (formData: FormData) => void | Promise<void>;
