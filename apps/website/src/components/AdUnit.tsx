"use client";

import { useEffect } from "react";

interface AdUnitProps {
  slot: string;
  format?: "auto" | "fluid" | "rectangle" | "vertical" | "horizontal";
  className?: string;
  fullWidthResponsive?: boolean;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

export function AdUnit({
  slot,
  format = "auto",
  className = "",
  fullWidthResponsive = true,
}: AdUnitProps) {
  const pubId = process.env.NEXT_PUBLIC_ADSENSE_PUB_ID;
  const slotId = process.env.NEXT_PUBLIC_ADSENSE_SLOT_ID || slot;

  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      // AdSense error
    }
  }, []);

  if (!pubId) return null;

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: "block" }}
      data-ad-client={pubId}
      data-ad-slot={slotId}
      data-ad-format={format}
      data-full-width-responsive={fullWidthResponsive}
    />
  );
}
