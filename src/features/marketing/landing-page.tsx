"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  ScanEye,
  BrainCircuit,
  Radio,
  HeartHandshake,
  ArrowRight,
  Activity,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP, AGENT_META } from "@/lib/constants";

const AGENT_ICONS = {
  sentinel: ScanEye,
  strategist: BrainCircuit,
  marshal: Radio,
  guardian: HeartHandshake,
} as const;

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.5, ease: "easeOut" as const },
  }),
};

export function LandingPage() {
  const agents = Object.entries(AGENT_META);

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pulse-aurora" />

      {/* Nav */}
      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <PulseLogo />
          <span className="text-lg font-semibold tracking-tight">
            {APP.name}
          </span>
        </div>
        <nav className="flex items-center gap-2">
          <Link href="/login">
            <Button variant="ghost" size="sm">
              Sign in
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button size="sm">
              Launch console
              <ArrowRight />
            </Button>
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-24 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={0}
          className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-surface/40 px-3.5 py-1.5 text-xs text-muted-foreground backdrop-blur"
        >
          <Sparkles className="size-3.5 text-[hsl(var(--primary))]" />
          Agentic AI Operating System · PromptWars Challenge 4
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={1}
          className="mx-auto max-w-4xl text-balance text-5xl font-bold leading-[1.05] tracking-tight sm:text-7xl"
        >
          The AI{" "}
          <span className="text-gradient">nervous system</span> for smart
          stadiums.
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={2}
          className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground"
        >
          PULSE senses 62,000 people in real time, forecasts crowd risk before
          it forms, reasons about every incident with Gemini, and dispatches the
          nearest responder — automatically. Not a chatbot. A command center
          that thinks.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={3}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <Link href="/dashboard">
            <Button size="lg">
              <Zap />
              Launch live console
            </Button>
          </Link>
          <Link href="/login">
            <Button size="lg" variant="secondary">
              Sign in
            </Button>
          </Link>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          custom={4}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <Activity className="size-3.5 text-[hsl(var(--calm))]" /> Live
            simulation — no setup required
          </span>
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="size-3.5 text-[hsl(var(--primary))]" />{" "}
            Privacy-first · no facial recognition
          </span>
        </motion.div>
      </section>

      {/* Agents */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pb-24">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map(([key, meta], i) => {
            const Icon = AGENT_ICONS[key as keyof typeof AGENT_ICONS];
            return (
              <motion.div
                key={key}
                variants={fadeUp}
                initial="hidden"
                whileInView="show"
                viewport={{ once: true }}
                custom={i}
                className="glass group rounded-lg p-5 text-left transition-transform hover:-translate-y-1"
              >
                <div className="mb-4 inline-flex size-11 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 text-[hsl(var(--primary))]">
                  <Icon className="size-5" />
                </div>
                <p className="text-[11px] font-medium uppercase tracking-wider text-[hsl(var(--accent))]">
                  {meta.role}
                </p>
                <h3 className="mt-0.5 text-lg font-semibold">{meta.name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">
                  {meta.blurb}
                </p>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* Loop */}
      <section className="relative z-10 mx-auto max-w-4xl px-6 pb-28 text-center">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
          Observe → Reason → Decide → Act
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          Every PULSE agent runs a continuous decision loop against a live
          telemetry stream. Every decision is explained in plain language and
          written to an immutable audit ledger.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3 text-sm">
          {["Observe", "Reason", "Decide", "Act", "Verify"].map((step, i) => (
            <div key={step} className="flex items-center gap-3">
              <div className="glass rounded-full px-4 py-2 font-medium">
                {step}
              </div>
              {i < 4 && <ArrowRight className="size-4 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </section>

      <footer className="relative z-10 border-t border-border/60 py-8 text-center text-xs text-muted-foreground">
        {APP.name} · {APP.venue} — a reference deployment for {APP.fixture}.
      </footer>
    </div>
  );
}

function PulseLogo() {
  return (
    <span className="relative inline-flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
      <Activity className="size-[18px] text-primary-foreground" strokeWidth={2.5} />
    </span>
  );
}
