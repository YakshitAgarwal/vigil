import { HOUR, QUORUM } from "./rules";
import type { Story } from "./types";

/**
 * Sample stories. The outlets and places are invented so nothing here
 * reads as a real report. Replace hydrateStories() with a query against
 * Arkiv (see lib/arkiv.ts).
 */
type Seed = {
  id: string;
  headline: string;
  summary: string;
  source: { name: string; url: string };
  postedHoursAgo: number;
  /** Negative means it expired that many hours ago. */
  hoursLeft: number;
  keep: number;
  fade: number;
  rounds?: { endedHoursAgo: number; keep: number; fade: number }[];
  updates?: { hoursAgo: number; text: string; source: string }[];
  snapshotBlock?: number;
};

function fakeHex(seed: string, len = 64): string {
  let h = 2166136261;
  let out = "";
  for (let i = 0; out.length < len; i++) {
    h ^= seed.charCodeAt(i % seed.length) + i;
    h = Math.imul(h, 16777619) >>> 0;
    out += h.toString(16).padStart(8, "0");
  }
  return "0x" + out.slice(0, len);
}

const SEEDS: Seed[] = [
  {
    id: "nandpur-water-cut",
    headline:
      "Water cut in Nandpur enters a fourth day after the pipe repair misses its deadline",
    summary:
      "Supply to 40 wards has been off since Monday. The water board promised a fix by Thursday evening, but crews are still waiting for a replacement valve. Tanker deliveries are covering about a third of normal demand.",
    source: {
      name: "Deccan Dispatch",
      url: "https://example.com/deccan-dispatch/nandpur-water",
    },
    postedHoursAgo: 200,
    hoursLeft: 30,
    keep: 412,
    fade: 97,
    rounds: [{ endedHoursAgo: 138, keep: 351, fade: 88 }],
    updates: [
      {
        hoursAgo: 52,
        text: "The board named a failed valve as the cause and set a new date for Thursday evening.",
        source: "Nandpur Water Board notice",
      },
      {
        hoursAgo: 6,
        text: "A tanker schedule was published for wards 3, 7 and 12.",
        source: "Deccan Dispatch",
      },
    ],
  },
  {
    id: "port-backlog",
    headline:
      "Port authority says the cargo backlog will clear within weeks but has not published a schedule",
    summary:
      "Containers have been waiting up to nine days for clearance. The authority blamed a software migration and said a recovery plan would follow, without giving a date.",
    source: {
      name: "Harbour Ledger",
      url: "https://example.com/harbour-ledger/backlog",
    },
    postedHoursAgo: 94,
    hoursLeft: 74,
    keep: 203,
    fade: 61,
    updates: [
      {
        hoursAgo: 20,
        text: "The authority repeated that the backlog would clear within weeks and gave no schedule.",
        source: "Harbour Ledger",
      },
    ],
  },
  {
    id: "kerwal-schools",
    headline:
      "Reopening date for flood-hit schools in Kerwal is still unconfirmed",
    summary:
      "Eleven schools remain closed for repairs. The district office has said inspections are under way but has not said when classes can resume or where students will be taught meanwhile.",
    source: {
      name: "Public Notice Desk",
      url: "https://example.com/public-notice/kerwal-schools",
    },
    postedHoursAgo: 400,
    hoursLeft: 129,
    keep: 530,
    fade: 40,
    rounds: [
      { endedHoursAgo: 207, keep: 468, fade: 52 },
      { endedHoursAgo: 39, keep: 497, fade: 61 },
    ],
  },
  {
    id: "bus-audit",
    headline:
      "Audit finds one in five city buses off the road, with no repair budget announced",
    summary:
      "The audit covers 612 buses. Most of the idle ones are waiting for parts. The transport department said it would respond to the findings next month.",
    source: {
      name: "Deccan Dispatch",
      url: "https://example.com/deccan-dispatch/bus-audit",
    },
    postedHoursAgo: 8,
    hoursLeft: 160,
    keep: 58,
    fade: 31,
  },
  {
    id: "sarovar-lake",
    headline:
      "Court asks the state to reply to a petition on Sarovar lake encroachment",
    summary:
      "The petition lists 23 structures built inside the lake boundary. The state has two weeks to respond. Residents say work on several of the sites has continued.",
    source: {
      name: "Harbour Ledger",
      url: "https://example.com/harbour-ledger/sarovar",
    },
    postedHoursAgo: 119,
    hoursLeft: 49,
    keep: 144,
    fade: 188,
  },
  {
    id: "rail-fare-review",
    headline:
      "Suburban rail fares rise, and the promised review panel has yet to meet",
    summary:
      "The new fares took effect on the first of the month. The railway said a panel would review them within two weeks, but no members or dates have been announced.",
    source: {
      name: "Public Notice Desk",
      url: "https://example.com/public-notice/rail-fares",
    },
    postedHoursAgo: 250,
    hoursLeft: 96,
    keep: 377,
    fade: 210,
    rounds: [{ endedHoursAgo: 72, keep: 301, fade: 158 }],
  },
  {
    id: "coastal-toll",
    headline: "Toll waiver on the coastal highway is extended by one week",
    summary:
      "The waiver was due to end on Friday. The highway authority extended it without saying what would happen afterwards.",
    source: {
      name: "Harbour Ledger",
      url: "https://example.com/harbour-ledger/toll",
    },
    postedHoursAgo: 157,
    hoursLeft: 11,
    keep: 120,
    fade: 260,
    snapshotBlock: 4_183_902,
  },
  {
    id: "night-market",
    headline: "Night market licence fees are cut after a traders’ protest",
    summary:
      "The municipal body reduced the fee for the next quarter. Traders asked for a permanent change and the body said it would consider that later.",
    source: {
      name: "Public Notice Desk",
      url: "https://example.com/public-notice/night-market",
    },
    postedHoursAgo: 240,
    hoursLeft: -72,
    keep: 96,
    fade: 140,
    snapshotBlock: 4_102_447,
  },
  {
    id: "old-bridge",
    headline:
      "Old Mill Bridge stays closed while inspectors finish their report",
    summary:
      "The bridge was closed after a crack was found in a support. Inspectors said the report would be ready soon.",
    source: {
      name: "Deccan Dispatch",
      url: "https://example.com/deccan-dispatch/old-bridge",
    },
    postedHoursAgo: 312,
    hoursLeft: -144,
    keep: 180,
    fade: 301,
    snapshotBlock: 4_061_730,
  },
];

export function hydrateStories(now: number): Story[] {
  return SEEDS.map((s) => {
    const rounds = (s.rounds ?? []).map((r) => ({
      endedAt: now - r.endedHoursAgo * HOUR,
      keep: r.keep,
      fade: r.fade,
    }));
    return {
      id: s.id,
      headline: s.headline,
      summary: s.summary,
      source: s.source,
      postedAt: now - s.postedHoursAgo * HOUR,
      expiresAt: now + s.hoursLeft * HOUR,
      keep: s.keep,
      fade: s.fade,
      quorum: QUORUM,
      rounds,
      updates: (s.updates ?? []).map((u) => ({
        at: now - u.hoursAgo * HOUR,
        text: u.text,
        source: u.source,
      })),
      arkiv: {
        key: fakeHex(`key:${s.id}`),
        contentHash: fakeHex(`hash:${s.id}`),
        snapshotBlock: s.snapshotBlock ?? null,
        renewalTxs: rounds.map((_, i) => fakeHex(`tx:${s.id}:${i}`)),
      },
      round: "0",
    };
  });
}
