"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogHeader, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { toast } from "@/components/ui/toast";
import { useReuniteStore } from "@/stores/reunite-store";
import { ZONES, ZONE_MAP } from "@/lib/stadium/zones";
import { uid } from "@/lib/utils";
import type { ReuniteCase } from "@/lib/schemas/domain";

const schema = z.object({
  childName: z.string().min(1, "Required"),
  reporterName: z.string().min(1, "Required"),
  reporterContact: z.string().min(3, "Required"),
  lastSeenZoneId: z.string().min(1),
  minutesAgo: z.number().min(0).max(120),
  freeText: z.string().min(12, "Describe the child in a bit more detail"),
});
type FormValues = z.infer<typeof schema>;

const reportableZones = ZONES.filter((z) => z.kind !== "pitch");

export function ReportIntakeDialog({
  open,
  onClose,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}) {
  const addCase = useReuniteStore((s) => s.addCase);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      lastSeenZoneId: "facility-food",
      minutesAgo: 5,
    },
  });

  const onSubmit = (values: FormValues) => {
    const now = Date.now();
    const id = uid("rnt");
    const newCase: ReuniteCase = {
      id,
      status: "reported",
      childName: values.childName,
      reporterName: values.reporterName,
      reporterContact: values.reporterContact,
      freeText: values.freeText,
      descriptor: {
        ageBand: "unknown",
        gender: "unknown",
        hair: "unknown",
        upperColor: "unknown",
        upperItem: "unknown",
        lowerColor: "unknown",
        lowerItem: "unknown",
        accessories: [],
        distinguishingFeatures: "",
        lastSeenZoneId: values.lastSeenZoneId,
        minutesAgo: values.minutesAgo,
      },
      candidates: [],
      createdAt: now,
      reunitedAt: null,
      timeline: [
        {
          t: now,
          label: "reported",
          detail: `${values.reporterName} reported ${values.childName} missing near ${
            ZONE_MAP[values.lastSeenZoneId]?.name
          }.`,
        },
      ],
    };
    addCase(newCase);
    toast({
      title: `Report filed for ${values.childName}`,
      description: "Guardian is extracting a descriptor now.",
      variant: "info",
    });
    reset();
    onCreated(id);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} size="max-w-lg" labelledBy="intake-title">
      <DialogHeader
        id="intake-title"
        title="File a lost-child report"
        description="Guardian will extract a privacy-safe descriptor and begin the search."
      />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="childName">Child&apos;s name</Label>
            <Input id="childName" placeholder="Leo" {...register("childName")} />
            {errors.childName && (
              <p className="text-xs text-[hsl(var(--critical))]">
                {errors.childName.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reporterName">Reporter</Label>
            <Input
              id="reporterName"
              placeholder="Parent / guardian"
              {...register("reporterName")}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="reporterContact">Contact</Label>
            <Input
              id="reporterContact"
              placeholder="+44 …"
              {...register("reporterContact")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minutesAgo">Minutes missing</Label>
            <Input
              id="minutesAgo"
              type="number"
              {...register("minutesAgo", { valueAsNumber: true })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="lastSeenZoneId">Last seen</Label>
          <Select id="lastSeenZoneId" {...register("lastSeenZoneId")}>
            {reportableZones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="freeText">Description</Label>
          <Textarea
            id="freeText"
            rows={4}
            placeholder="What are they wearing? Hair, height, any distinctive items?"
            {...register("freeText")}
          />
          {errors.freeText && (
            <p className="text-xs text-[hsl(var(--critical))]">
              {errors.freeText.message}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">File report</Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
