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
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "1rem",
            marginBottom: "2rem",
            marginTop: "2rem",
            borderBottom: "1px solid #EAEAEA",
            paddingBottom: "1.5rem",
          }}
        >
          <div>
            <ColorfulBadge label={badgeLabel} color={badgeColor} />
            <h1
              style={{
                fontSize: "clamp(1.25rem, 3vw, 1.75rem)",
                fontWeight: 300,
                color: "#1A1A1A",
                letterSpacing: "-0.025em",
                marginTop: "0.75rem",
              }}
            >
              {heading}{" "}
              {accentText && (
                <span
                  style={{
                    fontStyle: "italic",
                    fontFamily: "'Playfair Display', serif",
                    color: badgeColor,
                    fontWeight: 500,
                  }}
                >
                  {accentText}
                </span>
              )}
            </h1>
            {description && (
              <p
                style={{
                  fontSize: "12px",
                  color: "#717171",
                  fontWeight: 300,
                  marginTop: "0.25rem",
                }}
              >
                {description}
              </p>
            )}
          </div>
          {right && <div>{right}</div>}
        </div>
      </FadeInUp>
    </>
  );
}
