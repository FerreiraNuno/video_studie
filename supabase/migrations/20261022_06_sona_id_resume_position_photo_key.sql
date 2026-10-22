-- =============================================================================
-- Run BEFORE deploying the app version that uses these columns (idempotent).
--
-- 1. form_data: the questionnaire asks for VP-Stunden + SONA ID but the app
--    never stored them (lost for the whole first collection).
-- 2. progress.position: in-phase resume point (phase 2: progressIndex +
--    videoIndex, phase 3: progressIndex + photoIndex + the photo order), so a
--    reload no longer restarts the phase. Stored server-side (not only in
--    localStorage) so a participant can continue on another device.
-- 3. photo_ratings: natural key becomes (participant, person) instead of
--    (participant, position). The position was only stable while the random
--    photo order survived – a person must never be rated twice, a position may
--    legitimately be re-used after a reload on a device without the saved
--    order. The app treats a unique violation as "already stored", so there
--    must be exactly ONE unique key per table.
-- =============================================================================

alter table study_v2.form_data
  add column if not exists wants_vp_hours boolean,
  add column if not exists sona_id        text;

alter table study_v2.progress
  add column if not exists position jsonb;

drop index if exists study_v2.photo_ratings_participant_photo_uidx;
create unique index if not exists photo_ratings_participant_person_uidx
  on study_v2.photo_ratings (participant_number, photo_filename);

notify pgrst, 'reload schema';
