"use client";

import { Shirt, User, Sparkles, MapPin, Clock, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ZONE_MAP } from "@/lib/stadium/zones";
import type { Descriptor } from "@/lib/schemas/domain";

export function DescriptorCard({ descriptor }: { descriptor: Descriptor }) {
  const rows: { icon: React.ComponentType<{ className?: string }>; label: string; value: string }[] = [
    { icon: User, label: "Age / gender", value: `${descriptor.ageBand} · ${descriptor.gender}` },
    { icon: Shirt, label: "Upper body", value: `${descriptor.upperColor} ${descriptor.upperItem}` },
    { icon: Shirt, label: "Lower body", value: `${descriptor.lowerColor} ${descriptor.lowerItem}` },
    { icon: Sparkles, label: "Hair", value: descriptor.hair },
    {
      icon: Tag,
      label: "Accessories",
      value: descriptor.accessories.length ? descriptor.accessories.join(", ") : "none",
    },
    {
      icon: MapPin,
      label: "Last seen",
      value: ZONE_MAP[descriptor.lastSeenZoneId]?.name ?? descriptor.lastSeenZoneId,
    },
    { icon: Clock, label: "Time missing", value: `~${descriptor.minutesAgo} min` },
  ];

  return (
    <div className="rounded-lg border border-border bg-background/40 p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Structured Descriptor
        </p>
        <Badge variant="calm">Privacy-safe</Badge>
      </div>
      <dl className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {rows.map((row) => {
          const Icon = row.icon;
          return (
            <div key={row.label} className="flex items-start gap-2">
              <Icon className="mt-0.5 size-4 shrink-0 text-[hsl(var(--primary))]" />
              <div className="min-w-0">
                <dt className="text-[11px] text-muted-foreground">{row.label}</dt>
                <dd className="truncate text-sm font-medium capitalize">
                  {row.value}
                </dd>
              </div>
            </div>
          );
        })}
      </dl>
      {descriptor.distinguishingFeatures && (
        <div className="mt-3 rounded-md border border-accent/25 bg-accent/[0.06] px-3 py-2">
          <p className="text-[11px] text-muted-foreground">
            Distinguishing feature
          </p>
          <p className="text-sm font-medium">{descriptor.distinguishingFeatures}</p>
        </div>
      )}
    </div>
  );
}
