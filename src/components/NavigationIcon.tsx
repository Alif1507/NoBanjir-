export type NavigationIconName = "home" | "monitor" | "report" | "guide" | "info" | "menu" | "close" | "user" | "chevron" | "up";
const paths: Record<NavigationIconName, string> = {
  home: "m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z",
  monitor: "M3 4h18v13H3ZM8 21h8m-4-4v4M6 11h3l2-4 3 7 2-3h2",
  report: "M6 3h12a2 2 0 0 1 2 2v16l-4-2-4 2-4-2-4 2V5a2 2 0 0 1 2-2Zm2 5h8m-8 4h8m-8 4h5",
  guide: "M12 5v16m0-16C9 2 5 3 3 4v15c3-1 6-1 9 2m0-16c3-3 7-2 9-1v15c-3-1-6-1-9 2",
  info: "M12 11v6m0-10v.1M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
  menu: "M4 6h16M4 12h16M4 18h16", close: "m6 6 12 12M6 18 18 6",
  user: "M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM4 21v-2a8 8 0 0 1 16 0v2",
  chevron: "m8 10 4 4 4-4", up: "m6 12 6-6 6 6m-6-6v14",
};
export function NavigationIcon({ name, className }: { name: NavigationIconName; className?: string }) {
  return <svg className={className} width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={paths[name]}/></svg>;
}
