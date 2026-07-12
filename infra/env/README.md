# infra/env/

Real env var docs live at the repo root: `.env.example.md` (kept there deliberately -
`packages/security/hardening.ts`'s secret scanner and env-coverage checker read it by
that exact root-relative path; moving it broke that real, tested logic for no benefit,
so it was reverted). This folder is a pointer, not a duplicate.
