"use client";

import { ReactNode, ReactElement } from "react";

interface PageHeaderProps {
  badgeLabel: string;
  badgeColor?: string;
  badgeIcon?: ReactElement;
  heading: string;
  accentText?: string;
  description?: string;
  right?: ReactNode;
  delay?: number;
}

export function PageHeader({
  badgeLabel,
  badgeIcon,
  heading,
  accentText,
  description,
  right,
}: PageHeaderProps) {
  return (
    <div className="mb-8 pt-2 pb-6 border-b border-slate-200/80 dark:border-slate-800/80">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 text-[10px] font-mono font-bold uppercase tracking-wider">
            {badgeIcon}
            {badgeLabel}
          </span>
          <h1 className="mt-3 font-display text-[clamp(1.25rem,3vw,1.75rem)] font-bold tracking-tight text-slate-900 dark:text-white">
            {heading}{" "}
            {accentText && (
              <span className="bg-gradient-to-r from-blue-600 via-blue-500 to-indigo-600 bg-clip-text font-display font-bold text-transparent">
                {accentText}
              </span>
            )}
          </h1>
          {description && (
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{description}</p>
          )}
        </div>
        {right && <div className="flex items-center gap-3">{right}</div>}
      </div>
    </div>
  );
}
