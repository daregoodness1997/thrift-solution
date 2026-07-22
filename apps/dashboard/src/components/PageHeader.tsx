"use client";

import { ReactNode } from "react";
import { config } from "@thrift/config";
import { ColorBar, ColorfulBadge, FadeInUp } from "@thrift/ui";

interface PageHeaderProps {
  badgeLabel: string;
  badgeColor?: string;
  heading: string;
  accentText?: string;
  description?: string;
  right?: ReactNode;
  delay?: number;
}

export function PageHeader({
  badgeLabel,
  badgeColor = config.colors.primary,
  heading,
  accentText,
  description,
  right,
  delay = 100,
}: PageHeaderProps) {
  return (
    <>
      <ColorBar />
      <FadeInUp delay={delay}>
        <div className="mb-8 mt-8 flex flex-wrap items-start justify-between gap-4 border-b border-black/5 dark:border-slate-800 pb-6">
          <div>
            <ColorfulBadge label={badgeLabel} color={badgeColor} />
            <h1 className="mt-3 font-display text-[clamp(1.25rem,3vw,1.75rem)] font-bold tracking-tight text-brand-dark dark:text-slate-100">
              {heading}{" "}
              {accentText && (
                <span className="bg-gradient-to-r from-brand-primary via-brand-sage to-brand-accent bg-clip-text font-display font-bold text-transparent">
                  {accentText}
                </span>
              )}
            </h1>
            {description && (
              <p className="mt-1 text-xs font-light text-gray-500 dark:text-slate-400">{description}</p>
            )}
          </div>
          {right && <div>{right}</div>}
        </div>
      </FadeInUp>
    </>
  );
}
