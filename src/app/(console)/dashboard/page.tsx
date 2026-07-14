import type { Metadata } from "next";
import { DashboardView } from "@/features/operations/dashboard-view";

export const metadata: Metadata = { title: "Command" };

export default function DashboardPage() {
  return <DashboardView />;
}
