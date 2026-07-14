import type { Metadata } from "next";
import { BrainView } from "@/features/brain/brain-view";

export const metadata: Metadata = { title: "Pulse Brain" };

export default function BrainPage() {
  return <BrainView />;
}
