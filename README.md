# Vigil: frontend

Next.js 15 (App Router) and Tailwind CSS v4. Sample data only, so it runs with no backend.

```bash
npm install
npm run dev
```

Open http://localhost:3000. Fonts (Spectral and Schibsted Grotesk) load through `next/font/google`, so the first build needs network access.

## What is in the box

| Route | What it shows |
| --- | --- |
| `/` | The story closest to the end of voting as the lead, then the rest of the feed and the rules |
| `/story/[id]` | Headline, summary, burn line, vote panel, "Check the count", and the update timeline |
| `/faded` | Stories that expired without a renewal |

## Design

- **Signature element:** the burn line (`components/BurnLine.tsx`, CSS in `app/globals.css`). A fuse is one week long and shortens as time passes. The tick marks where voting closes (1 day left). Amber means open, orange means voting closed and not renewed, dotted ash means faded.
- **Colour:** deep blue night (`#16203a`), tallow text, amber flame for "keep", moon blue for "fade". Tokens are in the `@theme` block.
- **Type:** Spectral for headlines and story text, Schibsted Grotesk for interface text.
- **Motion:** one motion that plays by itself: the lead story burns down to its real length once on load. Everything else responds to a click. Reduced motion is respected.

## Where the real pieces plug in

- `lib/stories.ts` and `lib/arkiv.ts`: replace `hydrateStories()` with an Arkiv query. The entity design is written at the top of `lib/arkiv.ts`.
- `lib/worldid.ts`: replace the simulated `verifyHuman()` with the IDKit v4 flow. The verify step must happen on your server, and the action should be scoped per story.
- `lib/store.tsx`: `vote()` currently updates local state. It should send the verified proof to your relayer, which writes the vote entity.
- `lib/rules.ts`: round length, when voting closes, and the quorum are constants here. Keep them identical to your keeper script.

## Notes

- Do not enable permissionless extension on story entities. It would let anyone override the vote.
- Faded stories need a tombstone entity with a longer lifetime, because expired entities disappear from Arkiv queries. The Faded page says "30 days" to match that.
- Countdowns update every 30 seconds. The first paint shows a skeleton until the browser mounts, so server and client times never disagree.
- This project was written without network access, so it has not been installed, type-checked or built. The burn line and vote meter CSS was checked in a browser screenshot. Run `npm run build` first and expect to fix small things.
