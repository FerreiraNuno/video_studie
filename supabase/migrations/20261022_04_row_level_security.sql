-- =============================================================================
-- Row Level Security for both study schemas (idempotent – safe to re-run).
--
-- Why: the app writes with the anon key, which is part of the public
-- JavaScript bundle. Without RLS anyone holding that key can download or
-- delete every participant's data. The app has no user accounts, so a policy
-- cannot tell participants apart – but it can separate WRITING from READING:
--
--   study_v2 data tables   anon may INSERT only. No SELECT policy → reads
--   (form_data, *_ratings, return nothing; no UPDATE/DELETE policy → rows are
--    ending_questions)     immutable through the API. The client inserts
--                          these rows once and treats a unique violation on a
--                          retry as success (src/lib/supabaseWriter.ts), so no
--                          upsert – which would need SELECT – is required.
--   study_v2.progress      anon may read and upsert (resume at login).
--   study_v2.trial_plans   Only participant number, phase and video order.
--   public.*               Archive of the first collection: RLS on, no
--                          policies → not reachable through the API at all.
--
-- Consequences:
--   * The dashboard / SQL editor and the service_role key bypass RLS, so
--     analysis and the backup workflow keep working (the workflow must use
--     the service_role key, see .github/workflows/supabase-daily.yml).
--   * The anon key can no longer read ratings – the app never did.
-- =============================================================================

-- --------------------------------------------------------------------------
-- study_v2
-- --------------------------------------------------------------------------
alter table study_v2.form_data        enable row level security;
alter table study_v2.progress         enable row level security;
alter table study_v2.trial_plans      enable row level security;
alter table study_v2.video_ratings    enable row level security;
alter table study_v2.photo_ratings    enable row level security;
alter table study_v2.final_ratings    enable row level security;
alter table study_v2.ending_questions enable row level security;

-- Defence in depth: the client never deletes or truncates, and never updates the data tables.
revoke delete, truncate, references, trigger on all tables in schema study_v2 from anon, authenticated;
revoke update on study_v2.form_data, study_v2.video_ratings, study_v2.photo_ratings,
              study_v2.final_ratings, study_v2.ending_questions from anon, authenticated;

-- Write-only data tables ----------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['form_data', 'video_ratings', 'photo_ratings', 'final_ratings', 'ending_questions'] loop
    execute format('drop policy if exists participant_insert on study_v2.%I', t);
    execute format('drop policy if exists participant_update_recent on study_v2.%I', t);
    execute format('create policy participant_insert on study_v2.%I for insert to anon, authenticated with check (true)', t);
  end loop;
end $$;

-- Resume tables: read + upsert ----------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['progress', 'trial_plans'] loop
    execute format('drop policy if exists participant_select on study_v2.%I', t);
    execute format('drop policy if exists participant_insert on study_v2.%I', t);
    execute format('drop policy if exists participant_update on study_v2.%I', t);
    execute format('create policy participant_select on study_v2.%I for select to anon, authenticated using (true)', t);
    execute format('create policy participant_insert on study_v2.%I for insert to anon, authenticated with check (true)', t);
    execute format('create policy participant_update on study_v2.%I for update to anon, authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- The balance view is a dashboard tool. Run it with the caller's rights (so it
-- cannot be used to read ratings through the API) and keep it off the API.
alter view study_v2.v_balance_check set (security_invoker = on);
revoke all on study_v2.v_balance_check from anon, authenticated;

-- --------------------------------------------------------------------------
-- public (archive of the first collection, June 2025 – Oct 2026)
-- --------------------------------------------------------------------------
alter table public.form_data        enable row level security;
alter table public.progress         enable row level security;
alter table public.video_ratings    enable row level security;
alter table public.photo_ratings    enable row level security;
alter table public.final_ratings    enable row level security;
alter table public.ending_questions enable row level security;
revoke all on public.form_data, public.progress, public.video_ratings, public.photo_ratings,
              public.final_ratings, public.ending_questions from anon, authenticated;

-- Linter: trigger helper without a fixed search_path (unused, but harmless to pin).
alter function public.update_updated_at_column() set search_path = '';

notify pgrst, 'reload schema';
