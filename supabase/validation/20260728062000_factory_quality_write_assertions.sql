begin;
set local role service_role;

insert into public.factory_quality_findings (
  project_id, category, severity, description, source, auto_fixable, fix_recipe
) values (
  'ci-contract', 'schema', 'medium', 'isolated contract test', 'github-actions', true, '{"kind":"test"}'::jsonb
);

insert into public.factory_quality_scores (
  score_id, project_id, score_type, score, grade
) values (
  'ci-contract-score', 'ci-contract', 'composite', 100, 'A'
);

insert into public.factory_repair_jobs (
  project_id, finding_id, repair_type, recipe, failure_fingerprint, defect_description
)
select
  'ci-contract', id, 'schema', '{"action":"noop"}'::jsonb, 'ci-fingerprint', 'isolated repair insert'
from public.factory_quality_findings
where project_id = 'ci-contract'
limit 1;

insert into public.factory_receipts (
  receipt_type, status, produced_by, action_summary, evidence, rollback_available
) values (
  'validation', 'pass', 'github-actions', 'factory schema contract', '{"isolated":true}'::jsonb, true
);

insert into public.auto_heal_runs (
  project_id, iteration, status, patch_branch
) values (
  'ci-contract', 1, 'blocked', 'validation/factory-schema-ci-20260728'
);

rollback;
