# judith-studie

Online research study for the University of Gießen, Abteilung Klinische Psychologie, investigating how social context influences pain assessment. Participants (at home, in their browser) watch video/audio clips and photos of people and rate their perceived pain, credibility, and other impressions. All responses are logged to Supabase.

Deployed via GitHub Pages at `schmerzbeurteilung-jlu.de` (see [.github/workflows/deploy.yml](.github/workflows/deploy.yml), triggered on push to `main`).

## Stack

- Vue 3 (`<script setup>`, Composition API) + TypeScript + Vite
- Pinia for state (`useSupabaseStore`, `useProgressStore`)
- Supabase JS client ([src/lib/supabaseClient.ts](src/lib/supabaseClient.ts)) for all persistence — no custom backend

## Study flow

Login ([src/components/Login.vue](src/components/Login.vue)) → four sequential phases driven by `progressStore.phase`, rendered in [src/components/Main.vue](src/components/Main.vue):

1. **Phase 1 — [PhaseOne.vue](src/components/PhaseOne.vue)**: consent + demographic questionnaire → `form_data`
2. **Phase 2 — [PhaseTwo.vue](src/components/PhaseTwo.vue)**: instructions, audio/video hardware check, then 3 "context" scenarios (bus, doctor/`praxis`, pension office) shown in randomized order, each with 12 video+rating rounds → `video_ratings`
3. **Phase 3 — [PhaseThree.vue](src/components/PhaseThree.vue)**: 36 photo ratings (same people as in the videos) → `photo_ratings`, followed by final questions ([FinalQuestions.vue](src/components/PhaseThreeComponents/FinalQuestions.vue)) → `final_ratings`
4. **Ending — [Ending.vue](src/components/Ending.vue)**: debrief + ending questions (`EndingQuestions.vue`) → `ending_questions`

Progress (which phase a participant last reached) is tracked per-participant in `progress`, keyed by `participant_number`, so a study session (~150 min) can be resumed.

### Login / participant identity

- Login requires a shared study password (`klinPsych`, hardcoded in [Login.vue](src/components/Login.vue)) plus a 3-digit participant number.
- The **first digit of the participant number determines the study group** (between-subjects condition):
  - `1xx` → `CDM`
  - `2xx` → `SCT`
  - `3xx` → `KG`
- Group affects which audio files are played ([videoManager.ts](src/utils/videoManager.ts) `getAudioSource`) and which context/instruction text is shown ([src/text/context.json](src/text/context.json)).

### Video/photo assignment

[src/utils/videoManager.ts](src/utils/videoManager.ts) and [src/utils/photoManager.ts](src/utils/photoManager.ts) hold the fixed catalog of 36 people (young/old × male/female × pain-specific/unspecific).

The phase-2 **trial plan** is built by the pure module [src/utils/trialPlan.ts](src/utils/trialPlan.ts) (`generateTrialPlan` / `validateTrialPlan`). Hard requirement, validated on generation and covered by `npm test` ([src/utils/__tests__/trialPlan.test.ts](src/utils/__tests__/trialPlan.test.ts)): within each context every combination of self-report (`audioType`: no/slight/strong pain) × facial expression (`videoType`: pain-specific = yes / unspecific = no) appears **exactly twice** (one male, one female) → 12 trials per context. Context order, person→context assignment, audio pairing and order within a context are randomized under that constraint; per context young ≥ old.

The plan is generated **once** per participant (PhaseOne submit), saved to `trial_plans`, and re-used in PhaseTwo (loaded from the DB after a reload). Never call `initializeVideoOrder()` a second time for the same participant — the pre-Oct-2026 code did exactly that (PhaseOne + PhaseTwo mount) and, because it mutated shared catalog objects, carried stale audio assignments into a fresh context assignment, which destroyed the balance for almost all of the first 130 participants.

## Supabase

Project: **videoFragebogen** (`ctsptoeoypyrtoxuujlv`, `eu-central-1`).

**Two data collections, two schemas:**
- `public` — first collection (June 2025 – Oct 2026, ~130 participants, unbalanced trials). Archive; do not write to it. A local backup is in `backups/` (gitignored).
- `study_v2` — second collection after the balancing fix. The client ([src/lib/supabaseClient.ts](src/lib/supabaseClient.ts)) is pinned to this schema via `db.schema`. Created by [supabase/migrations/20261022_01_study_v2_schema.sql](supabase/migrations/20261022_01_study_v2_schema.sql); the schema must also be listed under "Exposed schemas" in the Supabase API settings.

Active tables (same names in both schemas, RLS disabled — intentional for this study, anon key is used client-side):

| Table | Written by | Purpose |
|---|---|---|
| `form_data` | `saveUserData` | Phase 1 demographics + consent |
| `progress` | `saveProgress`/`loadProgress` | Per-participant resume point (upsert on `participant_number`) |
| `trial_plans` | `saveTrialPlan`/`loadTrialPlan` | (`study_v2` only) the participant's balanced trial plan as JSON, one row per participant |
| `video_ratings` | `saveRating` | Pain/credibility/difficulty ratings per video seen; in `study_v2` also `context`, `video_type`, `person_id`. `video_index` is 1-based (1–36). View `v_balance_check` must show n = 2 everywhere |
| `photo_ratings` | `savePhotoRating` | Trait ratings per photo seen (trustworthiness, sympathy, aura, valence, attractiveness, stress, empathy) |
| `final_ratings` | `saveFinalRatings` | End-of-study ratings (exaggeration, faking, understating, suppression, empathy per context) |
| `ending_questions` | `saveEndingQuestions` | Debrief consent questions (informed, wants deletion, agrees to silence) |

All Supabase reads/writes go through [src/useSupabase.store.ts](src/useSupabase.store.ts) — that's the file to check when adding a new field or table.

**Writes are never plain inserts.** Every save goes through the persister in [src/lib/persist.ts](src/lib/persist.ts): the row is parked in a localStorage outbox first, sent as an `upsert` on its natural key (e.g. `participant_number,video_index`), retried with back-off, and removed from the outbox only after the server confirmed it. Leftovers are flushed on the next login of that participant number and on the browser's `online` event. The unique indexes behind the `onConflict` keys come from [supabase/migrations/20261022_03_unique_keys_for_idempotent_writes.sql](supabase/migrations/20261022_03_unique_keys_for_idempotent_writes.sql) — a new table needs a natural key there before the app may write to it. Background: in the first collection fire-and-forget inserts silently dropped single ratings, and an insert with a column the table did not yet have (`empathy`, Sept 2025 – July 2026) cost 96 participants all their photo ratings.

Phase transitions use `progressStore.setPhase(PHASE.x)` with an explicit target, never a blind increment.

**Backups / keep-alive.** [.github/workflows/supabase-daily.yml](.github/workflows/supabase-daily.yml) runs daily: one REST read keeps the Free-plan project from auto-pausing, and [scripts/export-supabase.mjs](scripts/export-supabase.mjs) exports all tables of `study_v2` and `public` into an AES-encrypted artifact (90 days retention, secret `BACKUP_PASSPHRASE`; the repo is public, so never upload plain data). Locally: `set -a; . ./.env.local; set +a; SUPABASE_URL=$VITE_API_BACKEND_URL SUPABASE_KEY=$VITE_API_BACKEND_KEY npm run backup` → `backups/<date>/` (gitignored).

**Ignore these tables** — not part of the active study, leftover/unrelated: `image_reports`, `weguess_images`, `test_images`.

## Notes

- UI copy is in German (participants are German-speaking study subjects).
- `dist/` is a committed build output directory (from GH Pages deploy) — don't hand-edit it, it's regenerated by CI.
