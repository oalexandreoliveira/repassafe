import { randomUUID } from "node:crypto";
import { GroupCreateScreen } from "@/components/screens/groups";
import { groupIdentity, readGroupOverview } from "@/lib/groups";

export default async function NewGroupPage() {
  const identity = await groupIdentity();
  const overview = await readGroupOverview(identity);
  return (
    <GroupCreateScreen eligible={overview.eligible} requestId={randomUUID()} />
  );
}
