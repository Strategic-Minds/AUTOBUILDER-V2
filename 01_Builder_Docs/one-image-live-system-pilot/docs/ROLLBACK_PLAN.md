# Rollback Plan

1. Preserve the base commit SHA before branch creation.
2. Keep all pilot changes isolated to `auto-builder/one-image-pipeline-pilot-001`.
3. Revert the smallest responsible commit for a failed import or repair.
4. Remove only preview deployments created by the pilot, and only with explicit approval when deletion is required.
5. Do not modify or delete source repositories, canonical images, or the Golden Workbook.
6. Record rollback target, action, result, evidence, and operator decision.

Rollback succeeds when the branch or preview returns to the last verified state without changing main or production.
