"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Envio desabilitado até que o formulário tenha a escolha exigida (um radio
 * marcado, ou a concordância obrigatória).
 */
export function SelectionSubmit({
  children,
  form,
  requires = "input[type=radio]:checked",
}: {
  children: string;
  /** id do formulário, quando o botão fica fora dele (rodapé fixo). */
  form?: string;
  /** Seletor que precisa existir no formulário para habilitar o envio. */
  requires?: string;
}) {
  const button = useRef<HTMLButtonElement>(null);
  const [selected, setSelected] = useState(false);
  useEffect(() => {
    const target = button.current?.form;
    if (!target) return;
    const update = () => setSelected(Boolean(target.querySelector(requires)));
    update();
    target.addEventListener("change", update);
    return () => target.removeEventListener("change", update);
  }, [requires]);
  return (
    <Button ref={button} type="submit" form={form} block disabled={!selected}>
      {children}
    </Button>
  );
}
