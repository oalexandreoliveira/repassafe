import {
  RegistrationOverview,
  type RegistrationData,
} from "@/components/screens/registration-overview";
import { readRegistration } from "@/lib/registration";
import { safeReturnPath } from "@/features/groups/invite-path";

export default async function CompleteRegistrationPage({
  searchParams,
}: {
  searchParams: Promise<{ proximo?: string }>;
}) {
  const { registration, user } = await readRegistration();
  const destination = safeReturnPath((await searchParams).proximo) ?? undefined;
  return (
    <RegistrationOverview
      registration={registration as RegistrationData}
      user={user}
      smsEnabled={process.env.SMS_VERIFICATION_ENABLED === "true"}
      destination={destination}
    />
  );
}
