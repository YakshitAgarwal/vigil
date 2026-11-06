import { DAY, HOUR } from "./rules";

const MIN = 60_000;

export function formatLeft(ms: number): string {
  if (ms <= 0) return "0m";
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / HOUR);
  const m = Math.floor((ms % HOUR) / MIN);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function formatLeftWords(ms: number): string {
  if (ms <= 0) return "no time";
  const d = Math.floor(ms / DAY);
  const h = Math.floor((ms % DAY) / HOUR);
  const m = Math.floor((ms % HOUR) / MIN);
  const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;
  if (d > 0) return `${plural(d, "day")} ${plural(h, "hour")}`;
  if (h > 0) return `${plural(h, "hour")} ${plural(m, "minute")}`;
  return plural(m, "minute");
}

export function ago(ms: number, now: number): string {
  const diff = Math.max(0, now - ms);
  if (diff < MIN) return "just now";
  if (diff < HOUR) {
    const m = Math.floor(diff / MIN);
    return `${m} ${m === 1 ? "minute" : "minutes"} ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} ${h === 1 ? "hour" : "hours"} ago`;
  }
  const d = Math.floor(diff / DAY);
  return `${d} ${d === 1 ? "day" : "days"} ago`;
}

export function times(n: number): string {
  if (n === 1) return "once";
  if (n === 2) return "twice";
  return `${n} times`;
}

export function shortDate(ms: number): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(ms);
}

export function shortHex(h: string): string {
  return h.length > 14 ? `${h.slice(0, 8)}…${h.slice(-4)}` : h;
}
