"use client";

import { ScanEye, Map } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StadiumMap } from "./components/stadium-map";
import { ZoneInspector } from "./components/zone-inspector";
import { ZoneRiskTable } from "./components/zone-risk-table";

export function VisionView() {
  return (
    <div className="space-y-4">
      <PageHeader
        title="Pulse Vision"
        description="Live crowd perception across the stadium digital twin."
        icon={ScanEye}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Map className="size-4 text-[hsl(var(--primary))]" />
              Stadium Heatmap · Digital Twin
            </CardTitle>
          </CardHeader>
          <CardContent>
            <StadiumMap className="aspect-[16/10]" />
          </CardContent>
        </Card>

        <ZoneInspector />
      </div>

      <ZoneRiskTable />
    </div>
  );
}
