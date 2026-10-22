-- =============================================================================
-- Tightens 20261022_04 for databases where that file was applied before the
-- client switched to insert-only writes: the data tables no longer need an
-- UPDATE policy (the app never updates them – a retry that hits the unique
-- index is treated as success). Idempotent; a fresh database that runs the
-- current 04 file ends up in the same state.
-- =============================================================================
do $$
declare t text;
begin
  foreach t in array array['form_data', 'video_ratings', 'photo_ratings', 'final_ratings', 'ending_questions'] loop
    execute format('drop policy if exists participant_update_recent on study_v2.%I', t);
  end loop;
end $$;

revoke update on study_v2.form_data, study_v2.video_ratings, study_v2.photo_ratings,
              study_v2.final_ratings, study_v2.ending_questions from anon, authenticated;

notify pgrst, 'reload schema';
