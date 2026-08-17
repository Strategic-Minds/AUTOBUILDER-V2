# AssetGrid Frontend Specification v1

Status: PREVIEW/DRAFT
Owner: AssetGrid Visual Parity Agent
Project: `assetgrid-clone-factory`
Brand contract: `00_BRAND_PROVISIONAL.md` / AssetGrid Signal Grid + Grid Commerce OS

## Purpose
Define independently implemented buyer, subscriber, author, and administrator surfaces for an Envato-class marketplace without copying Envato protected visual assets, branding, source, or catalog content.

## Inputs
- AG-FE-001..AG-FE-011
- AG-RIGHTS-001
- AssetGrid current five-route prototype
- backend API contracts

## Required route families
### Public / buyer
- `/`
- `/search`
- `/categories/:slug`
- `/items/:id/:slug?`
- `/authors/:id/:slug?`
- `/collections/:id`
- `/pricing`

### Authenticated buyer/subscriber
- `/account/profile`
- `/account/security`
- `/account/billing`
- `/account/orders`
- `/account/downloads`
- `/account/licenses`
- `/favorites`
- `/workspaces`
- `/workspaces/:id`
- `/cart`
- `/checkout`
- `/ai`
- `/ai/history`

### Author
- `/author/dashboard`
- `/author/profile`
- `/author/portfolio`
- `/author/upload`
- `/author/items/:id`
- `/author/submissions`
- `/author/earnings`
- `/author/statements`
- `/author/payouts`
- `/author/analytics`

### Admin/moderation
- `/admin`
- `/admin/users`
- `/admin/authors`
- `/admin/assets`
- `/admin/submissions`
- `/admin/moderation`
- `/admin/ip-cases`
- `/admin/refunds`
- `/admin/abuse`
- `/admin/queues`
- `/admin/agents`
- `/admin/audit`
- `/admin/health`

## Required global components
- independent AssetGrid header/logo system
- universal search
- category navigation
- filter/facet system
- asset card
- preview/media player
- seller badge/profile card
- rating/review summary
- license selector
- cart drawer/full cart
- entitlement/download controls
- workspace selector
- notifications center
- account menu
- author/admin side navigation
- toast/error boundary
- loading skeletons
- empty states
- retry/degraded states

## State requirements
Every critical surface must define: loading, populated, empty, permission-denied, validation-error, network-error, retrying, blocked, disabled, success, and stale-data behavior when applicable.

## Responsive contract
Required view classes: desktop >=1280, tablet 768-1279, mobile 320-767. No horizontal overflow on critical routes. Filters must become a touch-usable drawer on compact viewports. Media previews must preserve controls and aspect behavior.

## Accessibility
Target WCAG 2.2 AA. Require keyboard operation, visible focus, semantic landmarks/headings, accessible labels/descriptions, screen-reader status announcements, contrast, reduced motion, and >=44px touch targets where applicable.

## Acceptance examples
GIVEN an anonymous visitor WHEN opening a paid item THEN public metadata is visible but account-only actions route through auth without exposing private entitlement data.

GIVEN a buyer searches and applies facets WHEN the URL is refreshed or shared THEN supported query/filter/sort state is preserved deterministically.

GIVEN a user owns an entitlement WHEN opening Downloads THEN the UI renders the entitlement/license state returned by backend authorization and never invents client-side access.

GIVEN an author account WHEN entering author routes THEN buyer-only or unrelated author data cannot be accessed by changing IDs in the URL.

GIVEN an admin route WHEN a non-admin navigates directly THEN the route fails closed before privileged data renders.

## Outputs
Preview implementation packets, route map, component map, interaction contracts, screenshot baselines, Playwright selectors.

## Gates
No production publish. No protected Envato design copying. Backend authorization remains source of truth.

## Validation receipts
AG-VAL-103 browser E2E; AG-VAL-104 visual/accessibility; AG-VAL-105 security.

## Rollback
Revert branch commits; no production route mutations are authorized.