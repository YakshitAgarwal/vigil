import Link from "next/link";
import { FlameMark } from "./Icons";

export function Wordmark() {
  return (
    <Link href="/" className="inline-flex items-center gap-2 text-tallow" aria-label="Vigil, home">
      <FlameMark className="size-[22px] text-flame" />
      <span className="font-serif text-[1.65rem] font-semibold leading-none tracking-[-0.01em]">
        Vigil
      </span>
    </Link>
  );
}
