import type { Metadata } from "next";
import { DispatchView } from "@/features/dispatch/dispatch-view";

export const metadata: Metadata = { title: "Pulse Dispatch" };

export default function DispatchPage() {
  return <DispatchView />;
}
