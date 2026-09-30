import { AdminWorkspace } from "@/components/admin-workspace";
export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  return <AdminWorkspace section="ocorrencias" searchParams={searchParams} />;
}
