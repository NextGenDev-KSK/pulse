import type { Metadata } from "next";
import { ReuniteView } from "@/features/reunite/reunite-view";

export const metadata: Metadata = { title: "Pulse Reunite" };

export default function ReunitePage() {
  return <ReuniteView />;
}
