-- =============================================================================
-- OPTIONAL – run only after 20261022_01_study_v2_schema.sql and only if you
-- decide to carry the two correctly balanced participants of the first data
-- collection (328 and 363, both group KG) over into the new collection.
--
-- Rows are COPIED into study_v2; nothing in `public` is modified or deleted.
-- Original ids and timestamps are kept. Running it twice would duplicate the
-- rows – the guard at the top aborts in that case.
--
-- Caveat: the old app did not store the context of a rating, and the
-- `context_order` saved in public.form_data cannot be trusted (the order was
-- re-randomized after it was saved). Therefore `context` stays NULL for the
-- copied ratings; the three blocks of 12 (video_index 1-12, 13-24, 25-36) are
-- each balanced, but which block was "bus"/"doctor"/"pension" is unknown.
-- `video_type` and `person_id` are derived from the filename.
-- =============================================================================

do $$
begin
  if exists (select 1 from study_v2.video_ratings where participant_number in ('328', '363')) then
    raise exception 'participants 328/363 already exist in study_v2 – aborting to avoid duplicates';
  end if;
end $$;

insert into study_v2.form_data (id, participant_number, study_group, gender, age, education, ethnicity,
  current_activity, current_activity_detail, chronic_pain, pain_location, private_pain_experience,
  private_pain_relation, professional_pain_experience, professional_pain_activity, context_order, created_at)
select id, participant_number, study_group, gender, age, education, ethnicity,
  current_activity, current_activity_detail, chronic_pain, pain_location, private_pain_experience,
  private_pain_relation, professional_pain_experience, professional_pain_activity, context_order, created_at
from public.form_data where participant_number in ('328', '363');

insert into study_v2.progress (participant_number, study_group, phase, updated_at)
select participant_number, study_group, phase, updated_at
from public.progress where participant_number in ('328', '363');

insert into study_v2.video_ratings (id, participant_number, study_group, video_index, video_filename, person_id,
  context, video_type, audio_type, pain_rating, credibility_rating, difficulty_rating, action_rating, created_at)
select id, participant_number, study_group, video_index, video_filename,
  -- 'female_young_pain_01' -> 'f_y_p_1'
  left(video_filename, 1) || '_' ||
    left(split_part(video_filename, '_', 2), 1) || '_' ||
    left(split_part(video_filename, '_', 3), 1) || '_' ||
    ltrim(split_part(video_filename, '_', 4), '0')                      as person_id,
  null                                                                   as context,
  case when video_filename like '%unspecific%' then 'unspecific' else 'pain-specific' end as video_type,
  audio_type, pain_rating, credibility_rating, difficulty_rating, action_rating, created_at
from public.video_ratings where participant_number in ('328', '363');

insert into study_v2.photo_ratings (id, participant_number, photo_index, photo_filename, trustworthiness, sympathy,
  aura, valence, attractiveness, stress_level, empathy, created_at)
select id, participant_number, photo_index, photo_filename, trustworthiness, sympathy,
  aura, valence, attractiveness, stress_level, empathy, created_at
from public.photo_ratings where participant_number in ('328', '363');

insert into study_v2.final_ratings (id, participant_number, exaggeration, faking, understating, suppression,
  bus_empathy, doctor_empathy, pension_empathy, study_purpose, created_at)
select id, participant_number, exaggeration, faking, understating, suppression,
  bus_empathy, doctor_empathy, pension_empathy, study_purpose, created_at
from public.final_ratings where participant_number in ('328', '363');

insert into study_v2.ending_questions (id, participant_number, is_informed, wants_deletion, agrees_silence, created_at)
select id, participant_number, is_informed, wants_deletion, agrees_silence, created_at
from public.ending_questions where participant_number in ('328', '363');

-- Move the identity sequences past the copied ids so new rows don't collide.
select setval(pg_get_serial_sequence('study_v2.form_data', 'id'),        (select max(id) from study_v2.form_data));
select setval(pg_get_serial_sequence('study_v2.video_ratings', 'id'),    (select max(id) from study_v2.video_ratings));
select setval(pg_get_serial_sequence('study_v2.photo_ratings', 'id'),    (select max(id) from study_v2.photo_ratings));
select setval(pg_get_serial_sequence('study_v2.final_ratings', 'id'),    (select max(id) from study_v2.final_ratings));
select setval(pg_get_serial_sequence('study_v2.ending_questions', 'id'), (select max(id) from study_v2.ending_questions));

-- Verify: expect 6 rows per participant with n = 2 per block.
select participant_number, (video_index - 1) / 12 + 1 as block, video_type, audio_type, count(*) as n
from study_v2.video_ratings
where participant_number in ('328', '363')
group by 1, 2, 3, 4
order by 1, 2, 3, 4;
