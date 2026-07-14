import type { Metadata } from "next";
import { VisionView } from "@/features/vision/vision-view";

export const metadata: Metadata = { title: "Pulse Vision" };

export default function VisionPage() {
  return <VisionView />;
}
