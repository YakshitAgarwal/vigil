"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { hydrateStories } from "./stories";
import type { Choice, Story } from "./types";

type VigilState = {
  /** False until the browser has mounted, so server and client markup match. */
  ready: boolean;
  now: number;
  stories: Story[];
  human: boolean;
  verifyOpen: boolean;
  openVerify: () => void;
  closeVerify: () => void;
  completeVerify: () => void;
  vote: (id: string, choice: Choice) => void;
};

const VigilContext = createContext<VigilState | null>(null);

export function VigilProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [now, setNow] = useState(0);
  const [stories, setStories] = useState<Story[]>([]);
  const [human, setHuman] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const pending = useRef<{ id: string; choice: Choice } | null>(null);

  useEffect(() => {
    const t = Date.now();
    setNow(t);
    setStories(hydrateStories(t));
    setReady(true);
    const timer = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const applyVote = useCallback((id: string, choice: Choice) => {
    setStories((prev) =>
      prev.map((s) =>
        s.id !== id || s.myVote
          ? s
          : {
              ...s,
              myVote: choice,
              keep: s.keep + (choice === "keep" ? 1 : 0),
              fade: s.fade + (choice === "fade" ? 1 : 0),
            },
      ),
    );
  }, []);

  const vote = useCallback(
    (id: string, choice: Choice) => {
      if (!human) {
        pending.current = { id, choice };
        setVerifyOpen(true);
        return;
      }
      applyVote(id, choice);
    },
    [human, applyVote],
  );

  const completeVerify = useCallback(() => {
    setHuman(true);
    setVerifyOpen(false);
    if (pending.current) {
      applyVote(pending.current.id, pending.current.choice);
      pending.current = null;
    }
  }, [applyVote]);

  const closeVerify = useCallback(() => {
    pending.current = null;
    setVerifyOpen(false);
  }, []);

  const openVerify = useCallback(() => setVerifyOpen(true), []);

  const value = useMemo<VigilState>(
    () => ({
      ready,
      now,
      stories,
      human,
      verifyOpen,
      openVerify,
      closeVerify,
      completeVerify,
      vote,
    }),
    [ready, now, stories, human, verifyOpen, openVerify, closeVerify, completeVerify, vote],
  );

  return <VigilContext.Provider value={value}>{children}</VigilContext.Provider>;
}

export function useVigil(): VigilState {
  const ctx = useContext(VigilContext);
  if (!ctx) throw new Error("useVigil must be used inside <VigilProvider>");
  return ctx;
}
