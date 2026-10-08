import {
  AppScreen,
  RootTopBar,
  ScreenHeading,
} from "@/components/ui/app-shell";
import { ShiftCardSkeleton } from "@/components/ui/shift-card";
import { TabBar } from "@/components/ui/tab-bar";

/** S02 · carregando: skeleton de 3 cartões. */
export default function LoadingShifts() {
  return (
    <AppScreen header={<RootTopBar />} tabBar={<TabBar />}>
      <ScreenHeading title="Plantões abertos" />
      <p className="sr-only" role="status">
        Carregando plantões
      </p>
      <ShiftCardSkeleton />
      <ShiftCardSkeleton />
      <ShiftCardSkeleton />
    </AppScreen>
  );
}
