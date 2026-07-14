"use client";

import * as React from "react";
import {
  HeartHandshake,
  Plus,
  Baby,
  ClipboardList,
  ListChecks,
  History,
  ShieldCheck,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/shared/empty-state";
import { CaseList } from "./components/case-list";
import { DescriptorCard } from "./components/descriptor-card";
import { CandidateMatches } from "./components/candidate-matches";
import { CaseTimeline } from "./components/case-timeline";
import { ReportIntakeDialog } from "./components/report-intake-dialog";
import { useReuniteStore } from "@/stores/reunite-store";
import { useNotificationStore } from "@/stores/notification-store";
import { useScenarioActions } from "@/features/simulation/use-scenario-actions";
import { toast } from "@/components/ui/toast";
import { ZONE_MAP } from "@/lib/stadium/zones";
import type { Candidate } from "@/lib/schemas/domain";

export function ReuniteView() {
  const cases = useReuniteStore((s) => s.cases);
  const setStatus = useReuniteStore((s) => s.setStatus);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const scenarios = useScenarioActions();
  const lostChild = scenarios.find((s) => s.id === "lost-child");

  // Auto-select the first case when none chosen.
  React.useEffect(() => {
    if (!selectedId && cases.length > 0) setSelectedId(cases[0].id);
  }, [cases, selectedId]);

  const selected = cases.find((c) => c.id === selectedId) ?? null;

  const confirmReunion = (candidate: Candidate) => {
    if (!selected) return;
    setStatus(
      selected.id,
      "reunited",
      `${selected.childName} reunited with ${selected.reporterName} — matched via ${candidate.stewardName} near ${
        ZONE_MAP[candidate.zoneId]?.name
      }.`,
    );
    useNotificationStore.getState().notify({
      kind: "reunite",
      title: `${selected.childName} reunited`,
      detail: `Confirmed match near ${ZONE_MAP[candidate.zoneId]?.name}.`,
    });
    toast({
      title: `${selected.childName} safely reunited`,
      description: "Case closed and archived.",
      variant: "success",
    });
  };

  const activeCount = cases.filter(
    (c) => c.status !== "reunited" && c.status !== "archived",
  ).length;
  const reunitedCount = cases.filter((c) => c.status === "reunited").length;

  return (
    <div className="space-y-4">
      <PageHeader
        title="Pulse Reunite"
        description="Privacy-first lost-child reunification — descriptor matching, never facial recognition."
        icon={HeartHandshake}
        actions={
          <div className="flex items-center gap-2">
            {lostChild && (
              <Button variant="secondary" size="sm" onClick={lostChild.run}>
                <Baby /> Simulate report
              </Button>
            )}
            <Button size="sm" onClick={() => setDialogOpen(true)}>
              <Plus /> New report
            </Button>
          </div>
        }
      />

      <div className="flex flex-wrap gap-2">
        <Badge variant="primary">{activeCount} active</Badge>
        <Badge variant="calm">{reunitedCount} reunited</Badge>
        <Badge variant="outline" className="gap-1">
          <ShieldCheck className="size-3" /> No biometric data stored
        </Badge>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Case list */}
        <Card className="flex flex-col lg:max-h-[600px]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="size-4 text-[hsl(var(--primary))]" />
              Cases
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto">
            <CaseList selectedId={selectedId} onSelect={setSelectedId} />
          </CardContent>
        </Card>

        {/* Detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-4">
              <DescriptorCard descriptor={selected.descriptor} />

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ListChecks className="size-4 text-[hsl(var(--primary))]" />
                    Candidate Matches
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CandidateMatches caseItem={selected} onConfirm={confirmReunion} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="size-4 text-[hsl(var(--primary))]" />
                    Case Timeline
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CaseTimeline caseItem={selected} />
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <EmptyState
                  icon={HeartHandshake}
                  title="Select or file a case"
                  description="Choose a case on the left, simulate a report, or file a new one to see Guardian at work."
                />
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <ReportIntakeDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onCreated={setSelectedId}
      />
    </div>
  );
}
