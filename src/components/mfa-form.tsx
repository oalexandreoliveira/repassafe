"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Enrollment = {
  factorId: string;
  qrCode: string;
  secret: string;
};

export function MfaForm({
  factorId,
  staleFactorIds = [],
}: {
  factorId?: string;
  staleFactorIds?: string[];
}) {
  const router = useRouter();
  const started = useRef(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState(
    factorId
      ? "Informe o código do aplicativo autenticador."
      : "Preparando MFA…",
  );
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (factorId || started.current) return;
    started.current = true;

    const enroll = async () => {
      const supabase = createClient();
      for (const staleFactorId of staleFactorIds) {
        const { error: cleanupError } = await supabase.auth.mfa.unenroll({
          factorId: staleFactorId,
        });
        if (cleanupError) {
          setMessage("Não foi possível reiniciar a configuração do MFA.");
          return;
        }
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: "Repassafe Administração",
      });
      if (error) {
        setMessage("Não foi possível iniciar a configuração do MFA.");
        return;
      }
      setEnrollment({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      });
      setMessage("Escaneie o QR code e informe o código de seis dígitos.");
    };

    void enroll();
  }, [factorId, staleFactorIds]);

  async function verify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const selectedFactorId = factorId ?? enrollment?.factorId;
    if (!selectedFactorId || !/^\d{6}$/.test(code)) {
      setMessage("Informe um código válido de seis dígitos.");
      return;
    }

    setPending(true);
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: selectedFactorId,
      code,
    });
    if (error) {
      setPending(false);
      setMessage(
        "Código inválido ou expirado. Gere um novo código e tente novamente.",
      );
      return;
    }

    router.replace("/admin");
    router.refresh();
  }

  return (
    <div className="form-stack">
      {enrollment ? (
        <div className="mfa-enrollment">
          {/* QR TOTP é fornecido pelo Supabase como data URL SVG. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={enrollment.qrCode} alt="QR code para configurar o MFA" />
          <p className="form-help">
            Entrada manual: <code>{enrollment.secret}</code>
          </p>
        </div>
      ) : null}
      <form className="form-stack" onSubmit={verify}>
        <label>
          Código do autenticador
          <input
            autoComplete="one-time-code"
            inputMode="numeric"
            maxLength={6}
            name="code"
            onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))}
            pattern="[0-9]{6}"
            required
            value={code}
          />
        </label>
        <button
          className="button button-primary"
          disabled={pending || (!factorId && !enrollment)}
        >
          {pending
            ? "Verificando…"
            : factorId
              ? "Validar acesso"
              : "Ativar MFA"}
        </button>
      </form>
      <p className="form-message" role="status">
        {message}
      </p>
    </div>
  );
}
