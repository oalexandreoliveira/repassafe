"use client";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useRef, useState, useSyncExternalStore } from "react";
const subscribe = () => () => {};

export function MobileNavigation() {
  const [open, setOpen] = useState(false);
  const ready = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);
  return (
    <div
      className="mobile-navigation"
      onKeyDown={(event) => {
        if (event.key === "Escape" && open) {
          close();
          trigger.current?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        className="mobile-menu-trigger"
        type="button"
        disabled={!ready}
        aria-expanded={open}
        aria-controls="mobile-links"
        aria-label={open ? "Fechar menu" : "Abrir menu"}
        onClick={() => setOpen(!open)}
      >
        {open ? <X size={22} /> : <Menu size={22} />} Menu
      </button>
      <nav
        id="mobile-links"
        className="mobile-links"
        hidden={!open}
        aria-label="Navegação móvel"
      >
        <a href="#como-funciona" onClick={close}>
          Como funciona
        </a>
        <a href="#seguranca" onClick={close}>
          Segurança
        </a>
        <a href="#acordo" onClick={close}>
          Rastreabilidade
        </a>
        <Link href="/entrar" onClick={close}>
          Entrar
        </Link>
        <Link href="/cadastro" onClick={close}>
          Criar conta
        </Link>
        <Link href="/suporte" onClick={close}>
          Suporte
        </Link>
      </nav>
    </div>
  );
}
