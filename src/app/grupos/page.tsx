import { GroupsScreen } from "@/components/screens/groups";
import { groupIdentity, groupViewer, readGroupOverview } from "@/lib/groups";

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ saiu?: string }>;
}) {
  const { saiu } = await searchParams;
  const identity = await groupIdentity();
  const [overview, viewer] = await Promise.all([
    readGroupOverview(identity),
    groupViewer(identity),
  ]);
  return <GroupsScreen overview={overview} {...viewer} left={saiu === "1"} />;
}
