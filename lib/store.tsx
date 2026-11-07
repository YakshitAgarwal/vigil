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
import { QUORUM } from "./rules";
import type { Choice, Story } from "./types";

type VigilState = {
  /** False until the first load from Arkiv has finished, whether it worked or not. */
  ready: boolean;
  /** Set when the last load failed. Cleared by the next successful load. */
  error: string | null;
  reload: () => void;
  now: number;
  stories: Story[];
  human: boolean;
  verifyOpen: boolean;
  openVerify: () => void;
  closeVerify: () => void;
  completeVerify: () => void;
  vote: (id: string, choice: Choice) => void;
};

/** Shape returned by /api/stories. Declared here so no server code is imported. */
type ApiStory = {
  key: string;
  articleId: string;
  source: string;
  postedAt: number;
  headline: string;
  summary: string;
  url: string;
  expiresAt: number;
};

function isApiStory(v: unknown): v is ApiStory {
  if (typeof v !== "object" || v === null) return false;
  const s = v as Record<string, unknown>;
  return (
    typeof s.key === "string" &&
    typeof s.articleId === "string" &&
    typeof s.source === "string" &&
    typeof s.headline === "string" &&
    typeof s.summary === "string" &&
    typeof s.url === "string" &&
    typeof s.postedAt === "number" &&
    Number.isFinite(s.postedAt) &&
    typeof s.expiresAt === "number" &&
    Number.isFinite(s.expiresAt)
  );
}

function toStory(c: ApiStory): Story {
  return {
    id: c.articleId,
    headline: c.headline,
    summary: c.summary,
    source: { name: c.source, url: c.url },
    postedAt: c.postedAt,
    expiresAt: c.expiresAt,
    // Votes are not on Arkiv yet, so every story starts at zero.
    keep: 0,
    fade: 0,
    quorum: QUORUM,
    rounds: [],
    updates: [],
    arkiv: {
      key: c.key,
      contentHash: c.articleId,
      snapshotBlock: null,
      renewalTxs: [],
    },
  };
}

function parseStories(data: unknown): Story[] {
  const list = (data as { stories?: unknown } | null)?.stories;
  if (!Array.isArray(list))
    throw new Error("Unexpected response from /api/stories");
  return list.filter(isApiStory).map(toStory);
}

/** Keeps this browser's local votes when the list is refreshed. */
function mergeLocal(prev: Story[], next: Story[]): Story[] {
  const old = new Map(prev.map((s) => [s.id, s]));
  return next.map((s) => {
    const p = old.get(s.id);
    return p ? { ...s, keep: p.keep, fade: p.fade, myVote: p.myVote } : s;
  });
}

const VigilContext = createContext<VigilState | null>(null);

export function VigilProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [stories, setStories] = useState<Story[]>([]);
  const [human, setHuman] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const pending = useRef<{ id: string; choice: Choice } | null>(null);

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/stories", { cache: "no-store", signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const next = parseStories(await res.json());
      setStories((prev) => mergeLocal(prev, next));
      setNow(Date.now());
      setError(null);
    } catch (err) {
      if (signal?.aborted) return;
      console.error("Loading stories failed", err);
      setError(
        "Couldn’t load stories from Arkiv. Check your connection and try again.",
      );
    } finally {
      if (!signal?.aborted) setReady(true);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setNow(Date.now());
    void load(controller.signal);
    const tick = window.setInterval(() => setNow(Date.now()), 30_000);
    const refresh = window.setInterval(
      () => void load(controller.signal),
      60_000,
    );
    return () => {
      controller.abort();
      window.clearInterval(tick);
      window.clearInterval(refresh);
    };
  }, [load]);

  const reload = useCallback(() => {
    void load();
  }, [load]);

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
      error,
      reload,
      now,
      stories,
      human,
      verifyOpen,
      openVerify,
      closeVerify,
      completeVerify,
      vote,
    }),
    [
      ready,
      error,
      reload,
      now,
      stories,
      human,
      verifyOpen,
      openVerify,
      closeVerify,
      completeVerify,
      vote,
    ],
  );

  return (
    <VigilContext.Provider value={value}>{children}</VigilContext.Provider>
  );
}

export function useVigil(): VigilState {
  const ctx = useContext(VigilContext);
  if (!ctx) throw new Error("useVigil must be used inside <VigilProvider>");
  return ctx;
}
