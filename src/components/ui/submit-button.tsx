"use client";

import { useFormStatus } from "react-dom";
import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";

/** Submit for server-action forms: shows the spinner while the action runs. */
export function SubmitButton({
  pendingLabel,
  children,
  ...props
}: Omit<ComponentProps<typeof Button>, "type" | "loading"> & {
  /** Texto durante o envio; por padrão mantém o rótulo. */
  pendingLabel?: string;
}) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} {...props}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
