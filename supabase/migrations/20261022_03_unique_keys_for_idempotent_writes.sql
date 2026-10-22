-- =============================================================================
-- Natural keys for every study table in `study_v2`.
--
-- Run after 20261022_01_study_v2_schema.sql (idempotent – safe to re-run).
--
-- Why: the app no longer uses plain inserts. Every write is an upsert on the
-- row's natural key and is retried (and kept in a local outbox) until the
-- server confirmed it. For that to be safe – a retry of a request that
-- actually succeeded must not create a second row – the natural keys need
-- unique indexes. Without them PostgREST rejects the upsert (42P10).
--
--   video_ratings    one rating per participant and trial position (1..36)
--   photo_ratings    one rating per participant and photo position (1..36)
--   form_data        one questionnaire per participant
--   final_ratings    one set of final questions per participant
--   ending_questions one set of debrief answers per participant
--   progress / trial_plans already have participant_number as primary key
-- =============================================================================

create unique index if not exists video_ratings_participant_video_uidx
  on study_v2.video_ratings (participant_number, video_index);

create unique index if not exists photo_ratings_participant_photo_uidx
  on study_v2.photo_ratings (participant_number, photo_index);

create unique index if not exists form_data_participant_uidx
  on study_v2.form_data (participant_number);

create unique index if not exists final_ratings_participant_uidx
  on study_v2.final_ratings (participant_number);

create unique index if not exists ending_questions_participant_uidx
  on study_v2.ending_questions (participant_number);

notify pgrst, 'reload schema';
