import type { Metadata } from "next";
import { LedgerView } from "@/features/ledger/ledger-view";

export const metadata: Metadata = { title: "Decision Ledger" };

export default function LedgerPage() {
  return <LedgerView />;
}
