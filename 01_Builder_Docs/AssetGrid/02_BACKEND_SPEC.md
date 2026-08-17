# AssetGrid Backend Specification v1

Status: PREVIEW/DRAFT
Owner: AssetGrid Backend Data Agent
Project: `assetgrid-clone-factory`

## Purpose
Define the independent backend required for a two-sided digital asset marketplace, subscriptions, seller operations, secure asset delivery, moderation, analytics, AI jobs, and autonomous validation.

## Inputs
AG-BE-001..013, AG-AI-001, AG-REQ-BE-001, AG-REQ-COM-001, AG-REQ-AUTHOR-001, AG-REQ-ADMIN-001.

## Domain model
### Identity
User, Profile, RoleGrant, SessionAudit, Organization/Team optional.

### Seller
AuthorProfile, AuthorVerification, ComplianceStatus, TaxProfileReference, PayoutProfileReference.

### Catalog
Asset, AssetVersion, AssetFile, AssetPreview, Category, Subcategory, Tag, AssetTag, Compatibility, FileFormat, AssetStatusHistory.

### Discovery
SearchDocument, SearchFacetSnapshot, RecommendationEvent, PopularityAggregate.

### Buyer organization
Favorite, Collection, CollectionItem, Workspace, WorkspaceItem.

### Commerce
Cart, CartLine, Order, OrderLine, InvoiceReference, Refund, Dispute, PaymentIntentReference, PaymentWebhookEvent.

### Subscription
Plan, Subscription, Entitlement, UsageCounter, QuotaReservation.

### Licensing/delivery
License, LicenseProject, LicenseCertificate, DownloadGrant, SignedDownloadEvent, EntitlementRevocation.

### Community/support
Review, RatingAggregate, Comment, Reply, SupportCase, AbuseReport.

### Author operations
UploadSession, Submission, ReviewDecision, ModerationFinding, AuthorEarningEntry, SellerFeeEntry, SellerStatement, PayoutBatchReference, PayoutTransactionReference.

### Legal/moderation
CopyrightCase, TrademarkCase, TakedownAction, ContentEnforcement, AccountEnforcement.

### Analytics/audit
Event, AuditEvent, Job, JobAttempt, IdempotencyKey, Lease, DeadLetter, ValidationReceipt, RepairRecord, HardeningFinding, Incident, BackupReceipt, RestoreReceipt.

### AI
AIProvider, AIModelRoute, AIGenerationJob, AIUsage, AIProvenanceReceipt, AISafetyFinding.

## API families
`/api/auth/*`, `/api/users/*`, `/api/catalog/*`, `/api/categories/*`, `/api/search/*`, `/api/items/*`, `/api/authors/*`, `/api/favorites/*`, `/api/collections/*`, `/api/workspaces/*`, `/api/cart/*`, `/api/orders/*`, `/api/billing/*`, `/api/subscriptions/*`, `/api/entitlements/*`, `/api/licenses/*`, `/api/downloads/*`, `/api/reviews/*`, `/api/comments/*`, `/api/support/*`, `/api/uploads/*`, `/api/assets/*`, `/api/versions/*`, `/api/moderation/*`, `/api/ip/*`, `/api/earnings/*`, `/api/payouts/*`, `/api/analytics/*`, `/api/recommendations/*`, `/api/ai/*`, `/api/admin/*`, `/api/webhooks/*`, `/api/health/*`.

## Authorization invariants
- Default deny for private records.
- Asset public metadata is explicitly publish-scoped, not globally open by accident.
- Buyer entitlements belong to the authenticated owner/team only.
- Author records are isolated by author identity unless admin policy permits.
- Admin capability requires explicit role and server-side authorization.
- Signed downloads are generated only after server-side entitlement validation.
- Service-role credentials never reach browsers.
- Every protected mutation writes an audit event.

## Commerce boundary
Real payment/payout providers remain test-double abstractions until protected approval. Payment webhook contracts require signature validation, replay prevention, idempotency, and immutable raw-event references without storing prohibited secrets.

## Asset pipeline
upload-init -> temporary/quarantine storage -> extension/MIME/signature checks -> size/count rules -> archive inspection -> malware scan -> metadata extraction -> previews/transcodes -> moderation -> approved immutable version -> publish -> signed entitlement delivery.

## Queue/runtime contract
All durable jobs require immutable job ID, project ID, type, state, idempotency key, lease owner/token, lease expiry, attempt count, max attempts, available-at, heartbeat, error, result, and receipt correlation. Single-flight per mutation surface.

## Acceptance examples
GIVEN buyer A WHEN requesting buyer B's entitlement by ID THEN return denial without leaking entitlement metadata.

GIVEN the same payment webhook is delivered twice WHEN the idempotency key matches THEN one economic mutation occurs and duplicate delivery is auditable.

GIVEN an upload claims image/png but file signature is executable or archive content violates policy THEN quarantine and fail before publish.

GIVEN a worker lease expires WHEN the heartbeat scans THEN another worker may recover only after fencing/lease validation prevents concurrent ownership.

GIVEN a refunded entitlement is revoked WHEN a signed URL is requested THEN authorization denies new grants according to the configured revocation policy.

## Outputs
Schema/migration drafts, API contracts, queue contracts, storage contracts, event contracts, RLS specification, test fixtures.

## Gates
No production migration/RLS change, payment, payout, secret mutation, or destructive data operation without protected approval.

## Validation receipts
AG-VAL-101, AG-VAL-102, AG-VAL-105, AG-VAL-106, AG-VAL-107.

## Rollback
Every migration draft requires forward and rollback SQL before execution. Branch commits remain discardable until approval.