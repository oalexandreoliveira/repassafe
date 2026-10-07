import { notFound } from "next/navigation";
import { connection } from "next/server";

/** Páginas de /dev existem em desenvolvimento e staging; produção responde 404. */
export async function requireDevPages() {
  await connection();
  if (
    process.env.NODE_ENV === "production" &&
    process.env.APP_ENV !== "staging"
  )
    notFound();
}
