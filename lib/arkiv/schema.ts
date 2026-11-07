import { bytes, defineSchema, key, str, u64 } from "@arkiv-network/sdk/schema";

// Names must be unique to your project, because anyone can write to Arkiv.
export const StorySchema = defineSchema("vigil.story", {
  article_id: str().indexed(), // sha-256 of the article URL, used to avoid double posts
  source: str().indexed(),
  posted_at: u64().indexed(), // ms since epoch
  body: bytes(), // JSON: { headline, summary, url }
});

export const VoteSchema = defineSchema("vigil.vote", {
  story: key().indexed(),
  round: u64().indexed(),
  choice: str().indexed(), // "keep" | "fade"
  voter: str().indexed(), // hashed World ID nullifier
});
