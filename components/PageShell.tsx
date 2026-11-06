import type { ReactNode } from "react";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <main id="main" className="mx-auto w-full max-w-[1180px] px-5 pb-28 sm:px-8">
      {children}
    </main>
  );
}

export function Skeleton() {
  return (
    <div className="pt-20" aria-busy="true">
      <p className="sr-only">Loading stories</p>
      <div className="h-12 w-3/4 rounded bg-dusk/70" />
      <div className="mt-4 h-12 w-1/2 rounded bg-dusk/70" />
      <div className="mt-12 h-1.5 w-full rounded bg-dusk/70" />
    </div>
  );
}
