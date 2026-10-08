import { notFound } from "next/navigation";
import { z } from "zod";
import { GroupDetailScreen } from "@/components/screens/groups";
import { groupIdentity, groupViewer, readGroup } from "@/lib/groups";

export default async function GroupPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ criado?: string; entrou?: string }>;
}) {
  const [{ id }, { criado, entrou }] = await Promise.all([
    params,
    searchParams,
  ]);
  if (!z.uuid().safeParse(id).success) notFound();
  const identity = await groupIdentity();
  const [detail, viewer] = await Promise.all([
    readGroup(identity, id),
    groupViewer(identity),
  ]);
  if (!detail) notFound();
  return (
    <GroupDetailScreen
      detail={detail}
      {...viewer}
      notice={
        criado === "1" ? "created" : entrou === "1" ? "joined" : undefined
      }
    />
  );
}
