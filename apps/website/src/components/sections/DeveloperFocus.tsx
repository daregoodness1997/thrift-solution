"use client";

import { useState } from "react";
import { Copy, Check, Code2, Webhook, KeyRound } from "lucide-react";
import { Container, SectionHeading, Badge } from "@/components/ui/Section";

const code = `import { Gfw } from "@gfw/sdk";

const client = new Gfw(process.env.GFW_API_KEY);

// Create a new empowerment circle
const circle = await client.circles.create({
  name: "Family Circle",
  contribution: 25000,        // ₦25,000 per cycle
  frequency: "monthly",
  members: ["adaeze@email.com", "tunde@email.com"],
});

// Contributions are held in escrow automatically
await client.contributions.collect(circle.id);`;

export function DeveloperFocus() {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section id="developers" className="bg-brand-cream dark:bg-slate-950 py-20">
      <Container>
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div>
            <SectionHeading
              align="left"
              eyebrow="For Developers"
              title={
                <>
                  A powerful API for{" "}
                  <span className="bg-gradient-to-r from-brand-primary to-brand-accent bg-clip-text text-transparent">
                    communal finance
                  </span>
                </>
              }
              description="Embed empowerment circles, escrow, and payouts into your own product. REST-first, webhook-ready, and documented end to end."
            />

            <div className="mt-8 flex flex-col gap-4">
              {[
                { icon: KeyRound, title: "Simple authentication", desc: "API keys and scoped tokens in seconds." },
                { icon: Webhook, title: "Real-time webhooks", desc: "Get notified on contributions and payouts." },
                { icon: Code2, title: "SDKs & snippets", desc: "Drop-in helpers for Node, Python, and Go." },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="flex gap-4 rounded-xl border border-brand-primary/10 dark:border-slate-800 bg-white dark:bg-slate-900 p-4">
                    <div className="h-fit rounded-lg bg-brand-primary/10 dark:bg-blue-900/30 p-2 text-brand-primary dark:text-blue-400">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-brand-dark dark:text-slate-100">{f.title}</h4>
                      <p className="text-xs font-light text-brand-muted dark:text-slate-400">{f.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-800 bg-brand-dark shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 px-4 py-3">
              <div className="flex gap-1.5">
                <span className="h-3 w-3 rounded-full bg-red-500/80" />
                <span className="h-3 w-3 rounded-full bg-yellow-500/80" />
                <span className="h-3 w-3 rounded-full bg-green-500/80" />
              </div>
              <span className="font-mono text-[11px] text-gray-400">create-circle.ts</span>
              <button
                onClick={copy}
                className="flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-gray-400 transition-colors hover:bg-white/5 hover:text-white"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <pre className="overflow-x-auto p-5 font-mono text-[12.5px] leading-relaxed text-gray-200">
              <code>
                <span className="text-purple-400">import</span> {"{ Gfw }"}{" "}
                <span className="text-purple-400">from</span>{" "}
                <span className="text-green-300">&quot;@gfw/sdk&quot;</span>;
                {"\n\n"}
                <span className="text-purple-400">const</span> client ={" "}
                <span className="text-purple-400">new</span>{" "}
                <span className="text-sky-300">Gfw</span>(
                <span className="text-orange-300">process.env.GFW_API_KEY</span>);
                {"\n\n"}
                <span className="text-gray-500">// Create a new empowerment circle</span>
                {"\n"}
                <span className="text-purple-400">const</span> circle ={" "}
                <span className="text-purple-400">await</span> client.circles.
                <span className="text-sky-300">create</span>({"{"}
                {"\n  "}name: <span className="text-green-300">&quot;Family Circle&quot;</span>,
                {"\n  "}contribution: <span className="text-orange-300">25000</span>,{"      "}
                <span className="text-gray-500">// ₦25,000 per cycle</span>
                {"\n  "}frequency: <span className="text-green-300">&quot;monthly&quot;</span>,
                {"\n  "}members: [<span className="text-green-300">&quot;adaeze@email.com&quot;</span>],
                {"\n}"}){"\n\n"}
                <span className="text-gray-500">// Held in escrow automatically</span>
                {"\n"}
                <span className="text-purple-400">await</span> client.contributions.
                <span className="text-sky-300">collect</span>(circle.id);
              </code>
            </pre>
          </div>
        </div>
      </Container>
    </section>
  );
}
