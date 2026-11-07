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

type VoteError = { id: string; message: string };

type VigilState = {
  ready: boolean;
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
  votingId: string | null;
  voteError: VoteError | null;
};

type ApiStory = {
  key: string;
  articleId: string;
  source: string;
  postedAt: number;
  headline: string;
  summary: string;
  url: string;
  expiresAt: number;
  expiresAtBlock: string;
  keep: number;
  fade: number;
};

const isNum = (v: unknown): v is number =>
  typeof v === "number" && Number.isFinite(v);

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
    typeof s.expiresAtBlock === "string" &&
    isNum(s.postedAt) &&
    isNum(s.expiresAt) &&
    isNum(s.keep) &&
    isNum(s.fade)
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
    keep: c.keep,
    fade: c.fade,
    quorum: QUORUM,
    round: c.expiresAtBlock,
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

// Which way this browser voted, per story and round. A renewal starts a new round, so a
// renewed story lets you vote again. The server enforces one vote, this only remembers it.
const VOTES_KEY = "vigil-my-votes-v2";
const voteKey = (id: string, round: string) => `${id}:${round}`;

function loadMyVotes(): Record<string, Choice> {
  try {
    const raw = localStorage.getItem(VOTES_KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    if (typeof parsed !== "object" || parsed === null) return {};
    const out: Record<string, Choice> = {};
    for (const [k, c] of Object.entries(parsed)) {
      if (c === "keep" || c === "fade") out[k] = c;
    }
    return out;
  } catch {
    return {};
  }
}

function saveMyVotes(votes: Record<string, Choice>): void {
  try {
    localStorage.setItem(VOTES_KEY, JSON.stringify(votes));
  } catch {
    // storage may be unavailable, the vote is still saved on Arkiv
  }
}

const VigilContext = createContext<VigilState | null>(null);

export function VigilProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(0);
  const [stories, setStories] = useState<Story[]>([]);
  const [human, setHuman] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [votingId, setVotingId] = useState<string | null>(null);
  const [voteError, setVoteError] = useState<VoteError | null>(null);
  const pending = useRef<{ id: string; choice: Choice } | null>(null);
  const myVotes = useRef<Record<string, Choice>>({});

  const load = useCallback(async (signal?: AbortSignal) => {
    try {
      const res = await fetch("/api/stories", { cache: "no-store", signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const next = parseStories(await res.json()).map((s) => {
        const mine = myVotes.current[voteKey(s.id, s.round)];
        return mine ? { ...s, myVote: mine } : s;
      });
      setStories(next);
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
    myVotes.current = loadMyVotes();
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

  const rememberVote = useCallback(
    (id: string, round: string | null, choice: Choice) => {
      if (!round) return;
      myVotes.current = { ...myVotes.current, [voteKey(id, round)]: choice };
      saveMyVotes(myVotes.current);
    },
    [],
  );

  // A new vote: show it straight away. The next refresh replaces the count with Arkiv's.
  const applyVote = useCallback(
    (id: string, round: string | null, choice: Choice) => {
      rememberVote(id, round, choice);
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
    },
    [rememberVote],
  );

  // A vote that Arkiv already has: the count already includes it.
  const markVoted = useCallback(
    (id: string, round: string | null, choice: Choice) => {
      rememberVote(id, round, choice);
      setStories((prev) =>
        prev.map((s) => (s.id === id ? { ...s, myVote: choice } : s)),
      );
    },
    [rememberVote],
  );

  const submitVote = useCallback(
    async (id: string, choice: Choice) => {
      setVotingId(id);
      setVoteError(null);
      try {
        const res = await fetch("/api/vote", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ articleId: id, choice }),
        });
        const data: { error?: string; choice?: unknown; round?: unknown } =
          await res.json().catch(() => ({}));
        const round = typeof data.round === "string" ? data.round : null;
        if (res.ok) {
          applyVote(id, round, choice);
          return;
        }
        if (
          res.status === 409 &&
          (data.choice === "keep" || data.choice === "fade")
        ) {
          markVoted(id, round, data.choice);
          return;
        }
        throw new Error(data.error ?? `HTTP ${res.status}`);
      } catch (err) {
        setVoteError({
          id,
          message:
            err instanceof Error ? err.message : "Couldn’t save your vote.",
        });
      } finally {
        setVotingId(null);
      }
    },
    [applyVote, markVoted],
  );

  const vote = useCallback(
    (id: string, choice: Choice) => {
      if (!human) {
        pending.current = { id, choice };
        setVerifyOpen(true);
        return;
      }
      void submitVote(id, choice);
    },
    [human, submitVote],
  );

  const completeVerify = useCallback(() => {
    setHuman(true);
    setVerifyOpen(false);
    if (pending.current) {
      void submitVote(pending.current.id, pending.current.choice);
      pending.current = null;
    }
  }, [submitVote]);

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
      votingId,
      voteError,
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
      votingId,
      voteError,
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
