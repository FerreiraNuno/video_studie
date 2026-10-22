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
4. **Ending — [Ending.vue](src/components/Ending.vue)**: debrief + ending questions (`EndingQuestions.vue`) → `ending_questions`; submitting them sets phase 5 (`PHASE.completed`), after which a login only shows the closing message

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

The phase-2 **trial plan** is built by the pure module [src/utils/trialPlan.ts](src/utils/trialPlan.ts) (`generateTrialPlan` / `validateTrialPlan`). Hard requirement, validated on generation and covered by `npm test` ([src/utils/__tests__/trialPlan.test.ts](src/utils/__tests__/trialPlan.test.ts); the same run covers the persister and writer in `src/lib/__tests__/`): within each context every combination of self-report (`audioType`: no/slight/strong pain) × facial expression (`videoType`: pain-specific = yes / unspecific = no) appears **exactly twice** (one male, one female) → 12 trials per context. Context order, person→context assignment, audio pairing and order within a context are randomized under that constraint; per context young ≥ old.

The plan is generated **once** per participant (PhaseOne submit; a plan already saved for the number is loaded and reused instead), saved to `trial_plans`, and re-used in PhaseTwo (loaded from the DB after a reload). Never call `initializeVideoOrder()` a second time for the same participant — the pre-Oct-2026 code did exactly that (PhaseOne + PhaseTwo mount) and, because it mutated shared catalog objects, carried stale audio assignments into a fresh context assignment, which destroyed the balance for almost all of the first 130 participants. PhaseTwo generates a plan only when the database confirmed none exists; a failed read shows the reload message instead (a fresh plan would be upserted over the saved one and no longer match the ratings already stored).

**Phase-2 trial timing (decided by the study team, Oct 2026): a trial ends when the self-report audio ends**, not when the video ends. Videos run 3–10 s, the audio 4–6.3 s, so longer videos are cut off and shorter ones freeze on the last frame until the audio finishes. This is intended stimulus exposure — do not change [Video.vue](src/components/PhaseTwoComponents/Video.vue) to wait for the video.

The phase-2 step sequence (88 steps: intro/tests, then per context intro, scenario, 12 video+rating pairs with reminders after 4 and 8) is generated once in [src/utils/phaseTwoSteps.ts](src/utils/phaseTwoSteps.ts); [PhaseTwo.vue](src/components/PhaseTwo.vue) renders `PHASE2_STEPS[progressIndex]` and the resume helpers read the same table, so do not hard-code step numbers anywhere else. A reload during phase 2 or 3 resumes at the current video / photo via `progress.position` (see [src/utils/resume.ts](src/utils/resume.ts); the phase-3 photo order is stored there too, randomized once per participant). Should the position be missing (e.g. an old row), the phase restarts; re-submitted ratings for stored positions are then ignored by the insert-once write path (first answer wins).

## Tests

`npm test` (Vitest, < 2 s) and `npm run test:e2e` (Playwright, ~2 min); both run in the deploy workflow before the build, so a red run blocks the deploy.

- **Pure modules** (`src/utils/__tests__`, `src/lib/__tests__`): trial plan balance, the phase-2 step table, resume points, persister, writer.
- **Component tests** (`src/components/**/__tests__`, happy-dom): the media step machines are driven by dispatching `playing`/`ended`/`error` on the elements and advancing fake timers — no media is decoded. The phase flow tests mount `PhaseTwo`/`PhaseThree` with stub children ([src/test/stubs.ts](src/test/stubs.ts)) and walk every step. All of them replace the Supabase client with the in-memory fake in [src/test/fakeSupabase.ts](src/test/fakeSupabase.ts) via `vi.mock('@/lib/supabaseClient', …)`, so the real stores, persister and writer run. `clearTrialPlan()` in `videoManager.ts` exists for these tests only.
- **Schema contract** ([src/__tests__/schemaContract.test.ts](src/__tests__/schemaContract.test.ts)): every column a store write produces must be declared in `supabase/migrations/`. Adding a column means adding a migration first, or this test fails.
- **End-to-end** ([e2e/study.spec.ts](e2e/study.spec.ts)): one participant through the whole study in headless Chromium, with reloads in phases 2 and 3. Media requests are answered with the sub-second fixtures in `e2e/fixtures/`, photo display timers are skipped with Playwright's clock, and Supabase is the in-memory PostgREST in [e2e/fakePostgrest.ts](e2e/fakePostgrest.ts) (the app is pointed at `http://localhost:5174/supabase` by [playwright.config.ts](playwright.config.ts)). Nothing reaches the real project. Locally: `npx playwright install chromium` once.

## Supabase

Project: **videoFragebogen** (`ctsptoeoypyrtoxuujlv`, `eu-central-1`), org `klinPsych`, on the **Free plan** since 2026-10-22 (needs the daily keep-alive below).

**Migrations** live in [supabase/migrations/](supabase/migrations/), are idempotent, and are applied in file order (01–07 applied as of 2026-10-23) with `psql` through the session-pooler URI in `.env.local` (`SUPABASE_DB_URL`, gitignored, full access — never print it):

```bash
set -a; . ./.env.local; set +a; psql "$SUPABASE_DB_URL" -X -v ON_ERROR_STOP=1 -f supabase/migrations/<file>.sql
```

The same connection is used to delete test participants' rows after a dev-server run. The Supabase MCP connector is useful for read-only SQL, logs and advisors only; its `apply_migration` and destructive statements come back `declined` without a prompt in the desktop app. There is no Supabase CLI setup.

**Two data collections, two schemas:**
- `public` — first collection (June 2025 – Oct 2026, ~130 participants, unbalanced trials). Archive; do not write to it. A local backup is in `backups/` (gitignored).
- `study_v2` — second collection after the balancing fix. The client ([src/lib/supabaseClient.ts](src/lib/supabaseClient.ts)) is pinned to this schema via `db.schema`. Created by [supabase/migrations/20261022_01_study_v2_schema.sql](supabase/migrations/20261022_01_study_v2_schema.sql); the schema must also be listed under "Exposed schemas" in the Supabase API settings.

Active tables (same names in both schemas; the anon key is used client-side, RLS makes the data tables **write-only** for it — see below):

| Table | Written by | Purpose |
|---|---|---|
| `form_data` | `saveUserData` | Phase 1 demographics + consent |
| `progress` | `saveProgress`/`loadProgress` | Per-participant resume point (upsert on `participant_number`) |
| `trial_plans` | `saveTrialPlan`/`loadTrialPlan` | (`study_v2` only) the participant's balanced trial plan as JSON, one row per participant |
| `video_ratings` | `saveRating` | Pain/credibility/difficulty ratings per video seen; in `study_v2` also `context`, `video_type`, `person_id`, and how the stimulus ended (`instruction_end_reason`, `trial_end_reason`; anything other than `ended` / `audio_ended` means the participant did not get the full stimulus and the trial should be excluded; null after a reload during the rating). `video_index` is 1-based (1–36). View `v_balance_check` must show n = 2 everywhere |
| `photo_ratings` | `savePhotoRating` | Trait ratings per photo seen (trustworthiness, sympathy, aura, valence, attractiveness, stress, empathy) |
| `final_ratings` | `saveFinalRatings` | End-of-study ratings (exaggeration, faking, understating, suppression, empathy per context) |
| `ending_questions` | `saveEndingQuestions` | Debrief consent questions (informed, wants deletion, agrees to silence) |

All Supabase reads/writes go through [src/useSupabase.store.ts](src/useSupabase.store.ts) — that's the file to check when adding a new field or table.

**Writes never go straight to the client.** Every save goes through the persister in [src/lib/persist.ts](src/lib/persist.ts): the row is parked in a localStorage outbox first, written once on its natural key (e.g. `participant_number,video_index`; insert for data tables, upsert for `progress`/`trial_plans`), retried with back-off, and removed from the outbox only after the server confirmed it. Leftovers are flushed on the next login of that participant number and on the browser's `online` event. The unique indexes behind the `onConflict` keys come from [supabase/migrations/20261022_03_unique_keys_for_idempotent_writes.sql](supabase/migrations/20261022_03_unique_keys_for_idempotent_writes.sql) — a new table needs a natural key there before the app may write to it. Background: in the first collection fire-and-forget inserts silently dropped single ratings, and an insert with a column the table did not yet have (`empathy`, Sept 2025 – July 2026) cost 96 participants all their photo ratings.

Phase transitions use `progressStore.setPhase(PHASE.x)` with an explicit target, never a blind increment. `progress` writes are serialized, newest value wins ([src/lib/serializeLatest.ts](src/lib/serializeLatest.ts)), so two upserts of the row can never land out of order. Login loads progress exactly once via `progressStore.startStudy()`; a failed read keeps the participant on the login page — it must never fall back to phase 1, because submitting the questionnaire again would overwrite the trial plan.

All Supabase requests time out after 20 s ([src/lib/fetchWithTimeout.ts](src/lib/fetchWithTimeout.ts)); the timeout surfaces as a normal error that the persister retries.

**Row Level Security** ([supabase/migrations/20261022_04_row_level_security.sql](supabase/migrations/20261022_04_row_level_security.sql)): the anon key may only insert into the data tables (no read, update or delete; a retry that hits the unique index is treated as success, see [src/lib/supabaseWriter.ts](src/lib/supabaseWriter.ts)); `progress` and `trial_plans` are readable and upsertable; the `public` archive is not reachable through the API at all. Reading data therefore needs the dashboard, SQL, or the service_role key (repo secret `SUPABASE_SERVICE_KEY`, used only by the backup workflow). A new table needs policies here, or the app's writes fail with 42501.

**Backups / keep-alive.** [.github/workflows/supabase-daily.yml](.github/workflows/supabase-daily.yml) runs daily: one REST read keeps the Free-plan project from auto-pausing, and [scripts/export-supabase.mjs](scripts/export-supabase.mjs) exports all tables of `study_v2` and `public` into an AES-encrypted artifact (90 days retention; the repo is public, so never upload plain data). Repo secrets: `VITE_API_BACKEND_URL`/`VITE_API_BACKEND_KEY` (anon key, also used by the deploy), `SUPABASE_SERVICE_KEY` (export), `BACKUP_PASSPHRASE` (a copy is in `backups/BACKUP_PASSPHRASE.txt`, gitignored; without it the artifacts are unreadable). A red "Supabase daily" run means the project is at risk of being paused. Locally: `SUPABASE_URL=https://ctsptoeoypyrtoxuujlv.supabase.co SUPABASE_KEY=<service_role key> npm run backup` → `backups/<date>/` (gitignored).

**Ignore these tables** — not part of the active study, leftover/unrelated: `image_reports`, `weguess_images`, `test_images`.

## Notes

- UI copy is in German (participants are German-speaking study subjects).
- `dist/` is gitignored build output; the GH Pages deploy builds it in CI with the `VITE_API_BACKEND_*` repo secrets.
