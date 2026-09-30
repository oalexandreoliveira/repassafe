import Link from "next/link";
import { ArrowRight } from "lucide-react";

/** One acquisition action across the landing's navigation, hero and closing. */
export function LandingSignupLink({ className }: { className: string }) {
  return (
    <Link href="/cadastro" className={className}>
      Criar conta <ArrowRight size={18} aria-hidden="true" />
    </Link>
  );
}
