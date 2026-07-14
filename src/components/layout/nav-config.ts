import type { Route } from "next";
import {
  LayoutDashboard,
  ScanEye,
  BrainCircuit,
  Radio,
  HeartHandshake,
  BarChart3,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  sub: string;
  href: Route;
  icon: LucideIcon;
  chord: string;
}

export const NAV_ITEMS: NavItem[] = [
  {
    label: "Command",
    sub: "Operations overview",
    href: "/dashboard",
    icon: LayoutDashboard,
    chord: "d",
  },
  {
    label: "Pulse Vision",
    sub: "Crowd & forecasting",
    href: "/vision",
    icon: ScanEye,
    chord: "v",
  },
  {
    label: "Pulse Brain",
    sub: "Decision engine",
    href: "/brain",
    icon: BrainCircuit,
    chord: "b",
  },
  {
    label: "Pulse Dispatch",
    sub: "Responder ops",
    href: "/dispatch",
    icon: Radio,
    chord: "x",
  },
  {
    label: "Pulse Reunite",
    sub: "Lost-child workflow",
    href: "/reunite",
    icon: HeartHandshake,
    chord: "r",
  },
  {
    label: "Analytics",
    sub: "Trends & reports",
    href: "/analytics",
    icon: BarChart3,
    chord: "a",
  },
  {
    label: "Decision Ledger",
    sub: "AI audit trail",
    href: "/ledger",
    icon: ScrollText,
    chord: "l",
  },
];
