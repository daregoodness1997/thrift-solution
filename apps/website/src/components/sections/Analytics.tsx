"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Wallet, Users, ShieldCheck } from "lucide-react";
import { Container, SectionHeading, Badge } from "@/components/ui/Section";

const data = [
  { month: "Jan", saved: 320 },
  { month: "Feb", saved: 480 },
  { month: "Mar", saved: 610 },
  { month: "Apr", saved: 890 },
  { month: "May", saved: 1240 },
  { month: "Jun", saved: 1680 },
  { month: "Jul", saved: 2120 },
  { month: "Aug", saved: 2650 },
  { month: "Sep", saved: 3200 },
  { month: "Oct", saved: 3850 },
  { month: "Nov", saved: 4100 },
  { month: "Dec", saved: 4700 },
];

const stats = [
  { icon: Wallet, label: "Avg. circle pot", value: "₦400K" },
  { icon: Users, label: "Members per circle", value: "12" },
  { icon: ShieldCheck, label: "Funds in escrow", value: "100%" },
];

export function Analytics() {
  return (
    <section id="analytics" className="bg-brand-dark py-20 text-white">
      <Container>
        <SectionHeading
          eyebrow="Insights"
          title={
            <>
              Watch your savings{" "}
              <span className="bg-gradient-to-r from-brand-sage to-brand-accent bg-clip-text text-transparent">
                grow in real time
              </span>
            </>
          }
          description="Every contribution is tracked and visualized. Members and circle leaders get a clear picture of progress, payouts, and trust."
          className="[&_h2]:text-white [&_p]:text-gray-400"
        />

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Community savings growth</span>
              <span className="flex items-center gap-1 text-xs text-brand-sage">
                <TrendingUp className="h-4 w-4" /> +38% this quarter
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="saveFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3D7A52" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#3D7A52" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${v}K`} />
                  <Tooltip
                    contentStyle={{
                      background: "#0A1A12",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 12,
                    }}
                    formatter={(value) => [`₦${value}K`, "Saved"] as [string, string]}
                  />
                  <Area
                    type="monotone"
                    dataKey="saved"
                    stroke="#B8860B"
                    strokeWidth={2.5}
                    fill="url(#saveFill)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <div
                  key={s.label}
                  className="flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-5"
                >
                  <div className="rounded-xl bg-brand-primary/20 p-3 text-brand-sage">
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-display text-2xl font-bold text-white">{s.value}</p>
                    <p className="text-xs text-gray-400">{s.label}</p>
                  </div>
                </div>
              );
            })}
            <div className="rounded-2xl border border-brand-accent/30 bg-brand-accent/10 p-5">
              <p className="text-sm font-semibold text-white">Transparent by design</p>
              <p className="mt-1 text-xs font-light text-gray-300">
                Every member sees the same ledger. No spreadsheets, no disputes.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
