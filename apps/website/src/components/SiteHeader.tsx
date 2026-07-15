"use client";

import { usePathname } from "next/navigation";
import { Header, Button } from "@thrift/ui";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/marketplace" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Pricing", href: "/pricing" },
  { label: "About", href: "/about" },
  { label: "Donate", href: "/donate" },
];

export function SiteHeader() {
  const pathname = usePathname();

  const nav = navItems.map((item) => ({
    ...item,
    active: pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)),
  }));

  return (
    <Header
      nav={nav}
      actions={<Button size="sm" onClick={() => (window.location.href = "/register")}>Join a Circle</Button>}
    />
  );
}
