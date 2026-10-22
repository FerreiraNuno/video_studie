-- =============================================================================
-- Run BEFORE deploying the app version that writes these columns (idempotent).
--
-- video_ratings gets two columns that say how the stimulus presentation of
-- the rated trial ended, so trials without a proper stimulus can be excluded:
--
--   instruction_end_reason  ended | timer | error | blocked | no_element
--                           (the context's instruction audio before the video)
--   trial_end_reason        audio_ended | timer | video_error | audio_error
--                           (the video + self-report audio; 'audio_ended' is
--                           the normal case: the self-report played to its end
--                           after the video had started rendering)
--
-- Both are null for ratings written by older app versions and for a trial
-- that was rated right after a reload (the media ran before the reload).
-- =============================================================================

alter table study_v2.video_ratings
  add column if not exists instruction_end_reason text,
  add column if not exists trial_end_reason       text;

notify pgrst, 'reload schema';
