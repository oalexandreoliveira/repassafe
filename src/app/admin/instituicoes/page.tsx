import { AdminWorkspace } from "@/components/admin-workspace";
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  return <AdminWorkspace section="instituicoes" searchParams={searchParams} />;
}
