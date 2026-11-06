export function FlameMark({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className} fill="currentColor">
      <path d="M12.6 1.2c.5 3.6 5 6.1 5 11.4a5.6 5.6 0 0 1-11.2 0c0-2.3 1.1-3.8 2.3-5.5.3 1.4 1 2.3 1.9 2.9-.3-3.3.1-6.5 2-8.8Z" />
    </svg>
  );
}

export function CheckIcon({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3.5 8.5 3 3 6-7" />
    </svg>
  );
}

export function ChevronLeft({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m10 3.5-4.5 4.5L10 12.5" />
    </svg>
  );
}
