import {
  RegistrationOverview,
  type RegistrationData,
} from "@/components/screens/registration-overview";
import { readRegistration } from "@/lib/registration";

export default async function CompleteRegistrationPage() {
  const { registration, user } = await readRegistration();
  return (
    <RegistrationOverview
      registration={registration as RegistrationData}
      user={user}
      smsEnabled={process.env.SMS_VERIFICATION_ENABLED === "true"}
    />
  );
}
