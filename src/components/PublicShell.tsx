import { SiteFooter } from "./SiteFooter.tsx";
import { SiteHeader } from "./SiteHeader.tsx";
import type { ReactNode } from "react";

export function PublicShell({ children }: { children: ReactNode }) {
  return <><SiteHeader/><main className="secondary-main content-width">{children}</main><SiteFooter/></>;
}
