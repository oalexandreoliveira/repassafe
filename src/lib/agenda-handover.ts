import type { createClient } from "@/lib/supabase/server";
import { log } from "@/lib/observability/logger";

/**
 * Liga "Meu plantão" ao repasse criado a partir dele (oferta publicada ou
 * acordo registrado). O repasse já foi criado: uma falha aqui só deixa a
 * anotação sem o vínculo, e o usuário pode repassar de novo pela agenda.
 */
export async function linkHandover(
  identity: { supabase: Awaited<ReturnType<typeof createClient>> },
  entryId: string,
  target: { offerId: string } | { agreementId: string },
) {
  const { error } = await identity.supabase.rpc("agenda_link_handover", {
    entry_ref: entryId,
    offer_ref: "offerId" in target ? target.offerId : null,
    agreement_ref: "agreementId" in target ? target.agreementId : null,
  });
  if (error)
    log("warn", "agenda.handover_link_failed", {
      entryId,
      code: error.code,
    });
}
