"use client";

import { useEffect, useRef, useState } from "react";
import { useVigil } from "@/lib/store";
import { verifyHuman } from "@/lib/worldid";

export function VerifyDialog() {
  const { verifyOpen, closeVerify, completeVerify } = useVigil();
  const ref = useRef<HTMLDialogElement>(null);
  const [status, setStatus] = useState<"idle" | "checking" | "failed">("idle");

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (verifyOpen && !dialog.open) {
      setStatus("idle");
      dialog.showModal();
    }
    if (!verifyOpen && dialog.open) dialog.close();
  }, [verifyOpen]);

  async function run() {
    setStatus("checking");
    const result = await verifyHuman();
    if (result.ok) {
      completeVerify();
    } else {
      setStatus("failed");
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={closeVerify}
      onClick={(e) => {
        if (e.target === ref.current) closeVerify();
      }}
      aria-labelledby="verify-title"
      className="m-auto w-[min(98vw,30rem)] rounded-xl border border-wick bg-dusk p-0 text-tallow"
    >
      <div className="p-7">
        <h2
          id="verify-title"
          className="font-serif text-[1.65rem] font-medium leading-tight"
        >
          Verify you’re a person
        </h2>
        <p className="mt-3 text-[15px] leading-relaxed text-smoke">
          Each person gets one vote on each story. World ID proves you’re a real
          person without telling Vigil who you are.
        </p>

        {status === "failed" && (
          <p role="alert" className="mt-4 text-[14px] text-heat">
            World ID couldn’t confirm you. Open the World App and try again.
          </p>
        )}

        <div className="mt-7 flex items-stretch gap-3">
          <button
            type="button"
            onClick={run}
            disabled={status === "checking"}
            className="min-h-11 cursor-pointer flex-1 rounded-full bg-flame px-3 text-center text-[15px] font-semibold leading-tight text-night hover:bg-[#ffc064] disabled:opacity-60"
          >
            {status === "checking"
              ? "Checking"
              : status === "failed"
                ? "Try again"
                : "Continue with World ID"}
          </button>
          <button
            type="button"
            onClick={closeVerify}
            className="min-h-11 cursor-pointer flex-1 rounded-full bg-white px-3 text-center text-[15px] font-medium leading-tight text-night hover:bg-tallow"
          >
            Cancel
          </button>
        </div>
      </div>
    </dialog>
  );
}
