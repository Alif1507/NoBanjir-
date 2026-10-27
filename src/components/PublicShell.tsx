import { SiteFooter } from "./SiteFooter.tsx";
import { SiteHeader } from "./SiteHeader.tsx";
import type { ReactNode } from "react";
import { Breadcrumbs } from "./Breadcrumbs.tsx";

export function PublicShell({ children }: { children: ReactNode }) {
  return <><SiteHeader/><main id="main-content" tabIndex={-1} className="secondary-main content-width"><Breadcrumbs/>{children}</main><SiteFooter/></>;
}
