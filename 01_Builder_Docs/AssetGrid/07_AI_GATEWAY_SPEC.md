# AssetGrid AI Gateway Specification v1

Status: DRAFT / PREVIEW-ONLY
Owner: AssetGrid Backend Data Agent

## Purpose
Provide a provider-neutral, budgeted, auditable AI layer for independent AssetGrid AI features without copying Envato proprietary prompts, models, or private workflows.

## Inputs
AG-AI-001, identity/entitlement state, plan/quota state, content safety policy, provider availability.

## Router contract
Request -> capability classification -> entitlement/quota reservation -> policy/safety precheck -> provider/model selection -> execution -> output safety/provenance -> usage accounting -> receipt.

## Capability families
- text metadata assistance
- tagging/classification
- search query expansion/semantic retrieval
- image generation/editing when approved
- audio/video helper tools when approved
- seller content assistance
- moderation assistance, never sole legal decision maker

## Provider abstraction
Each provider adapter exposes: capability, model/revision, cost estimate, latency class, max input/output, safety features, retryable errors, deterministic/test mode, usage result.

## Routing rules
- cheapest qualified provider within quality threshold for routine work
- stronger model for complex reasoning/coding/vision where acceptance tests require it
- fallback only when policy and budget allow
- no silent vendor lock-in
- no prompt containing secrets or unnecessary private data

## Quotas/budgets
Reserve usage atomically before generation; settle actual usage after completion; release reservation on safe failure. Prevent concurrent quota overspend.

## Safety/provenance
Store prompt-template ID/hash, provider/model, safety policy version, input/output content hashes where appropriate, user/project ID, generated-at, usage, and result status. Avoid storing raw sensitive prompts when not required.

## Acceptance
GIVEN quota exhausted WHEN generation requested THEN fail closed without provider spend.
GIVEN primary provider transiently fails WHEN fallback is allowed THEN retry according to routing policy and record both attempts.
GIVEN output safety fails WHEN generation completes THEN quarantine/deny output and record safety finding.
GIVEN provider cost estimate exceeds task budget THEN route to an allowed alternative or block.

## Gates
No paid provider binding/spend, production secret change, or public release without approval.

## Validation receipts
AG-VAL-101 API/contract; AG-VAL-105 prompt/tool injection and leakage; AG-VAL-106 latency/reliability; AG-VAL-107 provider/tool capability.

## Rollback
Disable capability/provider route through configuration; revert branch implementation; preserve receipts.