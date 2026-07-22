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
import { TrendingUp, GraduationCap, Users, Globe2 } from "lucide-react";
import { Container, SectionHeading, Badge } from "@/components/ui/Section";

const data = [
  { month: "Jan", learners: 320 },
  { month: "Feb", learners: 480 },
  { month: "Mar", learners: 610 },
  { month: "Apr", learners: 890 },
  { month: "May", learners: 1240 },
  { month: "Jun", learners: 1680 },
  { month: "Jul", learners: 2120 },
  { month: "Aug", learners: 2650 },
  { month: "Sep", learners: 3200 },
  { month: "Oct", learners: 3850 },
  { month: "Nov", learners: 4100 },
  { month: "Dec", learners: 4700 },
];

const stats = [
  { icon: GraduationCap, label: "Skills trained", value: "48+" },
  { icon: Users, label: "Active learners", value: "12K+" },
  { icon: Globe2, label: "Countries reached", value: "34" },
];

export function Analytics() {
  return (
    <section id="analytics" className="bg-brand-dark py-20 text-white">
      <Container>
        <SectionHeading
          eyebrow="Impact"
          title={
            <>
              Expanding access to{" "}
              <span className="bg-gradient-to-r from-brand-sage to-brand-accent bg-clip-text text-transparent">
                education and opportunity
              </span>
            </>
          }
          description="Every month, more people gain the skills, confidence, and resources they need to build better futures. See how our community is growing."
          className="[&_h2]:text-white [&_p]:text-gray-400"
        />

        <div className="mt-14 grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.06] to-white/[0.02] p-6">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm font-semibold text-white">Learner growth worldwide</span>
              <span className="flex items-center gap-1 text-xs text-brand-sage">
                <TrendingUp className="h-4 w-4" /> +38% this quarter
              </span>
            </div>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="saveFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.7} />
                      <stop offset="100%" stopColor="#3B82F6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="month" tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: "#9CA3AF", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}`} />
                  <Tooltip
                    contentStyle={{
                      background: "#0B1220",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 12,
                      color: "#fff",
                      fontSize: 12,
                    }}
                    formatter={(value) => [`${value}`, "Learners"] as [string, string]}
                  />
                  <Area
                    type="monotone"
                    dataKey="learners"
                    stroke="#0EA5E9"
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
              <p className="text-sm font-semibold text-white">Education changes everything</p>
              <p className="mt-1 text-xs font-light text-gray-300">
                When people gain skills and opportunity, entire communities thrive.
              </p>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
