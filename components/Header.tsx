"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useVigil } from "@/lib/store";
import { CheckIcon } from "./Icons";
import { Wordmark } from "./Wordmark";

export function Header() {
  const pathname = usePathname();
  const { human, openVerify } = useVigil();

  const items = [
    { href: "/", label: "Burning now", active: pathname === "/" || pathname.startsWith("/story") },
    { href: "/faded", label: "Faded", active: pathname.startsWith("/faded") },
  ];

  return (
    <header className="border-b border-wick/60">
      <div className="mx-auto flex w-full max-w-[1180px] flex-wrap items-center justify-between gap-x-8 gap-y-3 px-5 py-4 sm:px-8">
        <div className="flex items-center gap-x-10">
          <Wordmark />
          <nav aria-label="Main" className="flex gap-6">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={`border-b-2 py-1.5 text-[15px] ${
                  item.active
                    ? "border-flame text-tallow"
                    : "border-transparent text-smoke hover:text-tallow"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {human ? (
          <span className="inline-flex min-h-10 items-center gap-2 rounded-full border border-flame/50 px-4 text-[14px] text-flame">
            <CheckIcon className="size-4" />
            Verified person
          </span>
        ) : (
          <button
            type="button"
            onClick={openVerify}
            className="min-h-10 rounded-full border border-smoke/50 px-4 text-[14px] text-tallow hover:border-tallow"
          >
            Verify with World ID
          </button>
        )}
      </div>
    </header>
  );
}
