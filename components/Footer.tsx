export function Footer() {
  const items = ["© Vigil 2026", "ETHGlobal Mumbai 2026", "Arkiv", "World ID"];

  return (
    <footer className="border-t border-wick/60">
      <div className="mx-auto flex justify-center items-center w-full max-w-[1180px] flex-col gap-2 px-5 py-8 text-[14px] text-smoke sm:flex-row sm:items-center sm:gap-x-4 sm:px-8">
        {items.map((item, i) => (
          <div key={item} className="flex items-center gap-x-4">
            {i > 0 && (
              <span
                aria-hidden="true"
                className="hidden size-1 shrink-0 rounded-full bg-ash sm:block"
              />
            )}
            <p>{item}</p>
          </div>
        ))}
      </div>
    </footer>
  );
}
