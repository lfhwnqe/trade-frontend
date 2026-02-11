"use client";

import { usePathname } from "next/navigation";
import TradeShell from "./trade-shell";
import DevtoolsShell from "./devtools-shell";

export default function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith("/trade/devtools")) {
    return <DevtoolsShell>{children}</DevtoolsShell>;
  }
  return <TradeShell>{children}</TradeShell>;
}
