import {
  AppScreen,
  RootTopBar,
  ScreenHeading,
} from "@/components/ui/app-shell";
import { ShiftCardSkeleton } from "@/components/ui/shift-card";
import { TabBar } from "@/components/ui/tab-bar";

/** Agenda · carregando: mesma estrutura da tela, sem dados. */
export default function LoadingAgenda() {
  return (
    <AppScreen header={<RootTopBar />} tabBar={<TabBar agenda />}>
      <ScreenHeading title="Agenda" />
      <p className="sr-only" role="status">
        Carregando agenda
      </p>
      <ShiftCardSkeleton />
      <ShiftCardSkeleton />
      <ShiftCardSkeleton />
    </AppScreen>
  );
}
