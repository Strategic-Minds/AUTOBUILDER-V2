'use client'

import { useState } from 'react'
import { Copy, Check, ArrowLeft, Search } from 'lucide-react'
import { PageShell, Card, Badge, GoldButton, GhostButton } from '@/components/page-shell'

interface Prompt {
  id: string
  name: string
  category: string
  description: string
  template: string
  variables: string[]
}

const PROMPTS: Prompt[] = [
  // ── DISCOVERY ─────────────────────────────────────────────
  {
    id: 'prompt-intake',
    name: 'Client Intake Interview',
    category: 'discovery',
    description: 'Generate 10 powerful intake interview questions to uncover the core offer, buyer, and value proposition.',
    variables: ['project_name', 'business_name', 'industry'],
    template: `You are a business strategist conducting intake interviews for a web project.

Project: {{project_name}}
Business: {{business_name}}
Industry: {{industry}}

Generate 10 powerful intake interview questions to understand:
1. Their ideal customer avatar in detail
2. The core transformation they deliver
3. Why customers choose them over competitors
4. Their revenue model and average deal size
5. Competitive positioning and differentiators
6. Success metrics they care about most
7. Common objections they face
8. Their #1 CTA that drives the most revenue
9. Proof they have (testimonials, certifications, results)
10. The biggest barrier to a customer saying yes

Format as numbered questions with follow-up probes for each.`,
  },
  {
    id: 'prompt-source-truth',
    name: 'Source Truth Extractor',
    category: 'discovery',
    description: 'Extract and structure the core source truth from raw client notes or transcripts.',
    variables: ['raw_notes', 'business_name'],
    template: `You are a conversion strategist extracting core business truth from client notes.

Business: {{business_name}}
Raw Notes: {{raw_notes}}

Extract and structure the SOURCE TRUTH:
- Business Name:
- Core Offer (one sentence):
- Target Buyer (be specific — demographics, psychographics, situation):
- Problem Solved (the painful outcome they prevent):
- Primary CTA (the #1 action the visitor should take):
- Proof/Credibility (specific numbers, certifications, outcomes):
- Key Objections (top 3-5 reasons they don't buy):
- Differentiator (why them vs. anyone else):
- Required Lead Fields (minimum info needed to capture a lead):

Be specific. Avoid generic language. The output should be usable immediately by a copywriter.`,
  },
  {
    id: 'prompt-buyer-persona',
    name: 'Buyer Persona Builder',
    category: 'discovery',
    description: 'Build a detailed ideal customer persona for a specific industry and offer.',
    variables: ['business_name', 'industry', 'offer'],
    template: `You are a market research expert building an ideal customer persona.

Business: {{business_name}}
Industry: {{industry}}
Offer: {{offer}}

Build a detailed IDEAL BUYER PERSONA including:

Demographics:
- Age range, gender split, location
- Income level, education, occupation
- Family situation

Psychographics:
- Core values and beliefs
- Biggest fears and frustrations
- Desires and aspirations
- What they read, watch, and follow

Behavior:
- How they search for solutions
- What they compare before buying
- Who influences their decisions
- Typical sales cycle length

Pain Points (prioritized by intensity):
1. [Urgent pain]
2. [Important pain]
3. [Nice to solve]

Objections they raise before buying:
1.
2.
3.

Their ideal outcome (in their own words):

Name this persona and give them a memorable one-sentence description.`,
  },
  {
    id: 'prompt-competitor-analysis',
    name: 'Competitor Analysis',
    category: 'discovery',
    description: 'Analyze the competitive landscape and identify positioning opportunities.',
    variables: ['business_name', 'industry', 'competitors'],
    template: `You are a strategic advisor analyzing market positioning.

Business: {{business_name}}
Industry: {{industry}}
Known Competitors: {{competitors}}

Perform a COMPETITIVE POSITIONING ANALYSIS:

For each competitor:
1. What they do well (strengths)
2. What they do poorly (weaknesses)
3. How they position themselves (premium/discount/local/national)
4. Their primary CTA
5. Trust signals they use

After analyzing all competitors, identify:

GAP OPPORTUNITIES (things none of them do well):
1.
2.
3.

POSITIONING RECOMMENDATION for {{business_name}}:
- Unique angle they should own
- Language they should avoid (used by everyone else)
- 3 power differentiators to lead with
- Recommended tagline options (3 versions)`,
  },

  // ── BRAND ──────────────────────────────────────────────────
  {
    id: 'prompt-brand',
    name: 'Brand Direction Generator',
    category: 'brand',
    description: 'Generate 3 distinct brand direction options with full visual and tone specs.',
    variables: ['business_name', 'industry', 'audience'],
    template: `You are a brand strategist creating direction options.

Business: {{business_name}}
Industry: {{industry}}
Target Audience: {{audience}}

Generate 3 DISTINCT BRAND DIRECTION options:

OPTION 1 — PREMIUM AUTHORITY
- Primary Color: [hex]
- Secondary Color: [hex]
- Accent Color: [hex]
- Typography: [heading font] / [body font]
- Brand Tone: [3 adjectives]
- Hero Visual Style: [description]
- Button Style: [description]
- Best Use Case: [1 sentence]
- Sample Tagline:

OPTION 2 — MODERN CONVERSION
[same structure]

OPTION 3 — BOLD DISRUPTOR
[same structure]

For each option, explain WHY this direction fits the audience and what emotional response it's designed to trigger.`,
  },
  {
    id: 'prompt-brand-voice',
    name: 'Brand Voice & Tone Guide',
    category: 'brand',
    description: 'Create a brand voice guide with do/don\'t examples for writing website copy.',
    variables: ['business_name', 'brand_direction', 'audience'],
    template: `You are a brand copywriter creating a voice guide.

Business: {{business_name}}
Brand Direction: {{brand_direction}}
Target Audience: {{audience}}

Create a BRAND VOICE & TONE GUIDE:

VOICE ATTRIBUTES (choose 4):
1. [attribute] — what this means in practice
2.
3.
4.

TONE SPECTRUM:
- When speaking to a new visitor: [tone]
- When speaking to a ready-to-buy prospect: [tone]
- When handling objections: [tone]
- In FAQs and support: [tone]

WORD BANK:
Words we use: [10 power words]
Words we avoid: [10 words that feel wrong]

COPY EXAMPLES:
- Headline (old, flat): "We Offer Quality Services"
- Headline (on-brand): [rewrite]

- CTA (old): "Submit"
- CTA (on-brand): [3 options]

- Testimonial intro (old): "Here's what customers say"
- Testimonial intro (on-brand): [rewrite]`,
  },

  // ── BUILDER / SPEC ─────────────────────────────────────────
  {
    id: 'prompt-spec',
    name: 'Website Specification',
    category: 'builder',
    description: 'Generate a complete technical + UX website specification for a builder handoff.',
    variables: ['project_name', 'business_name', 'offer', 'cta', 'pages'],
    template: `You are a web architect creating a builder specification.

Project: {{project_name}}
Business: {{business_name}}
Offer: {{offer}}
Primary CTA: {{cta}}
Required Pages: {{pages}}

Generate a COMPLETE WEBSITE SPECIFICATION:

1. PAGE ARCHITECTURE
For each page:
- Route
- Purpose (one sentence)
- Required sections (in order)
- CTA placement
- Hero type (image/video/illustration)

2. NAVIGATION STRUCTURE
- Primary nav items
- Mobile nav behavior
- Footer columns

3. LEAD CAPTURE STRATEGY
- Form fields (minimum vs. progressive)
- Where forms appear
- What happens after submit (redirect, confirmation, email)

4. SOCIAL PROOF STRATEGY
- Where testimonials appear
- What proof elements are used (logos, numbers, certifications)

5. PERFORMANCE REQUIREMENTS
- Target LCP: < 2.5s
- Target CLS: < 0.1
- Target FID: < 100ms

6. ACCESSIBILITY REQUIREMENTS
- WCAG 2.1 AA compliance
- Color contrast minimums
- Screen reader support

7. SEO REQUIREMENTS
- Page title format
- Meta description format
- H1/H2 structure for each page`,
  },
  {
    id: 'prompt-docs',
    name: 'Builder Documentation',
    category: 'builder',
    description: 'Generate complete technical documentation for developer/builder handoff.',
    variables: ['project_name', 'pages', 'workflow', 'integrations'],
    template: `You are a technical writer creating builder documentation.

Project: {{project_name}}
Pages: {{pages}}
Tech Stack: Next.js 15, React, Tailwind CSS, Vercel, Supabase
Workflow: {{workflow}}
Integrations: {{integrations}}

Generate COMPREHENSIVE BUILDER HANDOFF DOCUMENTATION:

1. PROJECT OVERVIEW
- Business context
- Technical goals
- Launch constraints

2. TECHNOLOGY DECISIONS
- Why each tech was chosen
- Configuration notes

3. PAGE STRUCTURE
For each page: route, layout, components, data sources

4. API ENDPOINTS NEEDED
- Endpoint, method, auth required, response shape

5. DATABASE SCHEMA
- Tables, columns, types, relationships

6. AUTHENTICATION FLOW
- Auth provider setup
- Protected routes
- Session handling

7. ENVIRONMENT VARIABLES REQUIRED
- Variable name, purpose, where to get it

8. TESTING CHECKLIST
- Unit tests needed
- Integration tests
- E2E scenarios

9. DEPLOYMENT STEPS
- Vercel project setup
- Environment configuration
- Domain setup
- Go-live checklist

10. ROLLBACK PLAN
- How to revert if something breaks`,
  },
  {
    id: 'prompt-homepage-copy',
    name: 'Homepage Copy Generator',
    category: 'builder',
    description: 'Write conversion-optimized homepage copy based on the source truth.',
    variables: ['business_name', 'offer', 'buyer', 'problem', 'cta', 'proof', 'differentiator'],
    template: `You are a conversion copywriter writing homepage copy.

Business: {{business_name}}
Offer: {{offer}}
Target Buyer: {{buyer}}
Problem Solved: {{problem}}
Primary CTA: {{cta}}
Proof: {{proof}}
Differentiator: {{differentiator}}

Write FULL HOMEPAGE COPY:

HERO SECTION:
- Main headline (< 10 words, outcome-focused):
- Sub-headline (1-2 sentences, expands on promise):
- CTA button text:
- Supporting credibility line:

PROBLEM SECTION:
- Section headline:
- 3 problem bullets (start with "Are you..."):

SOLUTION SECTION:
- Section headline:
- Intro paragraph (2-3 sentences):
- 3 benefit bullets:

SOCIAL PROOF SECTION:
- Section headline:
- 3 placeholder testimonial frameworks (structure them, leave names blank):

OFFER SECTION:
- Section headline:
- What's included (4-6 bullets):
- CTA + risk reversal statement:

FAQ (3 most common objections answered):
Q: [most common objection]
A: [confident, specific answer]

FOOTER CTA:
- Headline:
- Button text:`,
  },
  {
    id: 'prompt-landing-copy',
    name: 'Landing Page Copy',
    category: 'builder',
    description: 'Write high-converting single-page landing copy using proven frameworks.',
    variables: ['business_name', 'offer', 'buyer', 'lead_magnet', 'proof'],
    template: `You are a direct response copywriter.

Business: {{business_name}}
Offer: {{offer}}
Target Buyer: {{buyer}}
Lead Magnet / CTA: {{lead_magnet}}
Proof Available: {{proof}}

Write a HIGH-CONVERTING LANDING PAGE using AIDA framework:

ATTENTION (Headline options — write 5):
1. [Outcome headline]
2. [Problem headline]
3. [Curiosity headline]
4. [Number/specificity headline]
5. [Bold claim headline]

INTEREST:
- Sub-headline:
- Opening paragraph (hook them with the problem):
- 3 bullets of what they'll get/learn/achieve:

DESIRE:
- Social proof block:
- Benefit stack (5-7 outcomes):
- "Imagine if..." paragraph:
- Before/after contrast:

ACTION:
- CTA headline:
- CTA button text (3 options):
- Risk reversal statement:
- Urgency element:

Write in a [conversational/direct/professional] tone appropriate for {{buyer}}.`,
  },

  // ── QA / VALIDATION ────────────────────────────────────────
  {
    id: 'prompt-validation',
    name: 'Validation Test Script',
    category: 'qa',
    description: 'Generate a complete QA test script for a website pre-launch.',
    variables: ['project_name', 'website_type', 'pages', 'integrations'],
    template: `You are a QA engineer creating a pre-launch test script.

Project: {{project_name}}
Site Type: {{website_type}}
Pages to Test: {{pages}}
Integrations: {{integrations}}

Generate 25 SPECIFIC VALIDATION TESTS covering:

FUNCTIONALITY (10 tests):
1. Form submission: [specific test]
...

PERFORMANCE (5 tests):
11. Load time on mobile 3G: target < 3s
...

RESPONSIVENESS (4 tests):
16. Layout at 375px (iPhone SE)
...

SEO (3 tests):
20. Meta title < 60 chars
...

ACCESSIBILITY (3 tests):
23. Tab navigation works for all interactive elements
...

For each test, provide:
- Test name
- Steps to perform
- Expected result
- Pass/fail criteria
- Priority (P1/P2/P3)`,
  },
  {
    id: 'prompt-revenue-path',
    name: 'Revenue Path Audit',
    category: 'qa',
    description: 'Audit the visitor-to-lead revenue path and identify conversion leaks.',
    variables: ['business_name', 'offer', 'cta', 'lead_fields', 'pages'],
    template: `You are a CRO (conversion rate optimization) specialist.

Business: {{business_name}}
Offer: {{offer}}
Current CTA: {{cta}}
Lead Fields: {{lead_fields}}
Pages: {{pages}}

Perform a REVENUE PATH AUDIT:

1. VISITOR JOURNEY ANALYSIS
Trace the ideal path: Visitor lands → [step by step] → Becomes a lead

2. CONVERSION FRICTION POINTS
For each step, identify what could cause drop-off:
- Step 1: [friction]
- Step 2: [friction]
...

3. CTA AUDIT
- Current CTA: {{cta}}
- Clarity score (1-10):
- Emotional appeal score (1-10):
- 3 improved CTA alternatives:

4. FORM FIELD AUDIT
- Current fields: {{lead_fields}}
- Are any fields creating unnecessary friction? [yes/no + which]
- Recommended minimum field set:

5. TRUST SIGNAL GAPS
What proof/trust elements are missing?

6. OBJECTION HANDLING GAPS
What objections aren't being addressed on the page?

7. URGENCY/SCARCITY ASSESSMENT
Is there sufficient urgency? Recommendations:

8. REVENUE PATH SCORE (out of 100):
- Clarity: [score]
- Friction: [score]
- Trust: [score]
- CTA strength: [score]
- Total:

9. TOP 5 QUICK WINS (ranked by impact):`,
  },

  // ── MARKETING ──────────────────────────────────────────────
  {
    id: 'prompt-social',
    name: 'Social Launch Campaign',
    category: 'marketing',
    description: 'Generate a 7-day website launch campaign for all social platforms.',
    variables: ['business_name', 'offer', 'launch_date', 'audience', 'cta'],
    template: `You are a social media strategist planning a website launch.

Business: {{business_name}}
Offer: {{offer}}
Launch Date: {{launch_date}}
Target Audience: {{audience}}
Primary CTA: {{cta}}

Generate a 7-DAY LAUNCH CAMPAIGN:

PRE-LAUNCH (Days 1-3):
Day 1 — Teaser post
- LinkedIn: [post copy]
- Instagram caption: [copy]
- Visual description:

Day 2 — Behind-the-scenes
- LinkedIn: [post copy]
- Visual description:

Day 3 — Problem post (call out the pain)
- LinkedIn: [post copy]
- Instagram: [shorter version]

LAUNCH DAY (Day 4):
- LinkedIn announcement: [full post]
- Instagram: [caption + CTA]
- Facebook: [version]
- Email subject line:
- Email preview text:

POST-LAUNCH (Days 5-7):
Day 5 — Social proof / testimonial
Day 6 — FAQ or objection handler
Day 7 — Urgency / follow-up CTA

HASHTAG STRATEGY: [10 relevant hashtags]
BEST POSTING TIMES: [by platform]`,
  },
  {
    id: 'prompt-email-sequence',
    name: 'Post-Lead Email Sequence',
    category: 'marketing',
    description: 'Write a 5-email nurture sequence for new leads captured on the website.',
    variables: ['business_name', 'offer', 'buyer', 'cta'],
    template: `You are an email marketing specialist writing a nurture sequence.

Business: {{business_name}}
Offer: {{offer}}
Target Buyer: {{buyer}}
Desired Action: {{cta}}

Write a 5-EMAIL LEAD NURTURE SEQUENCE:

EMAIL 1 — Sent immediately after opt-in:
Subject: [Instant value + set expectation]
Preview text:
Body:
CTA:

EMAIL 2 — Sent Day 2:
Subject: [Address their #1 problem]
Preview text:
Body:
CTA:

EMAIL 3 — Sent Day 4:
Subject: [Social proof + case study]
Preview text:
Body:
CTA:

EMAIL 4 — Sent Day 6:
Subject: [Objection handler]
Preview text:
Body:
CTA:

EMAIL 5 — Sent Day 8:
Subject: [Urgency + final ask]
Preview text:
Body:
CTA:

Write in a [warm/professional/direct] tone.
Each email should be 150-250 words (scannable, not overwhelming).`,
  },
  {
    id: 'prompt-ad-copy',
    name: 'Paid Ad Copy Generator',
    category: 'marketing',
    description: 'Generate Google and Meta ad copy variations to drive traffic to the website.',
    variables: ['business_name', 'offer', 'buyer', 'cta', 'differentiator'],
    template: `You are a paid advertising specialist writing ad copy.

Business: {{business_name}}
Offer: {{offer}}
Target Buyer: {{buyer}}
CTA: {{cta}}
Key Differentiator: {{differentiator}}

Generate AD COPY for:

GOOGLE SEARCH ADS (3 RSA variations):
Each with:
- Headline 1 (30 chars max):
- Headline 2 (30 chars max):
- Headline 3 (30 chars max):
- Description 1 (90 chars max):
- Description 2 (90 chars max):

META/FACEBOOK ADS (3 variations):
VARIATION 1 — Problem-led:
- Primary text (up to 125 chars):
- Headline:
- Description:
- CTA button: [Learn More / Get Quote / Book Now / etc.]

VARIATION 2 — Social proof-led:
[same structure]

VARIATION 3 — Offer-led:
[same structure]

For each ad, name the audience segment it's best suited for.`,
  },

  // ── STRATEGY ───────────────────────────────────────────────
  {
    id: 'prompt-offer-positioning',
    name: 'Offer Positioning Statement',
    category: 'strategy',
    description: 'Craft a powerful positioning statement that sets the offer apart in the market.',
    variables: ['business_name', 'offer', 'buyer', 'differentiator', 'proof'],
    template: `You are a positioning strategist.

Business: {{business_name}}
Offer: {{offer}}
Target Buyer: {{buyer}}
Differentiator: {{differentiator}}
Proof: {{proof}}

Create a COMPLETE POSITIONING FRAMEWORK:

1. POSITIONING STATEMENT (Geoffrey Moore format):
"For [target customer] who [have this problem/need], {{business_name}} is a [category] that [key benefit]. Unlike [main competitor/alternative], we [primary differentiator]."

2. ELEVATOR PITCH (30 seconds):

3. TAGLINE OPTIONS (5 versions):
Version 1 — Outcome-focused:
Version 2 — Problem-focused:
Version 3 — Identity-focused:
Version 4 — Credibility-focused:
Version 5 — Bold claim:

4. VALUE LADDER:
Entry offer → Core offer → Premium offer
[describe each level]

5. PROOF STACK:
Rank these in order of persuasive impact for {{buyer}}:
- Numbers/results
- Testimonials
- Certifications
- Years in business
- Media mentions
[ranked + explanation]`,
  },
  {
    id: 'prompt-pricing',
    name: 'Pricing Strategy Consultant',
    category: 'strategy',
    description: 'Develop a pricing strategy and packaging structure for the website offer.',
    variables: ['business_name', 'offer', 'audience', 'competitors'],
    template: `You are a pricing strategist.

Business: {{business_name}}
Offer: {{offer}}
Audience: {{audience}}
Competitors: {{competitors}}

Develop a PRICING STRATEGY:

1. MARKET ANALYSIS
- Competitor price range: [low / mid / high]
- Perceived value gap (where is there room to charge more?):

2. PRICING MODEL OPTIONS:
A. Project-based: [how to structure it]
B. Retainer/subscription: [how to structure it]
C. Performance-based: [how to structure it]
D. Tiered packages: [how to structure it]

3. RECOMMENDED PACKAGING:
STARTER ($___/mo or $___):
- Includes:
- Best for:

PROFESSIONAL ($___/mo or $___):
- Includes:
- Best for:
- [mark this as MOST POPULAR]

ENTERPRISE ($___/mo or $___):
- Includes:
- Best for:

4. PRICE ANCHORING STRATEGY:
How to present pricing to maximize perceived value

5. OBJECTION RESPONSES FOR PRICE:
- "That's too expensive" → [response]
- "I can get it cheaper elsewhere" → [response]
- "I need to think about it" → [response]`,
  },

  // ── COMMUNICATION ──────────────────────────────────────────
  {
    id: 'prompt-client-email',
    name: 'Client Communication Templates',
    category: 'communication',
    description: 'Generate all standard client communication emails for a website project.',
    variables: ['client_name', 'project_name', 'status', 'preview_url'],
    template: `You are a project manager writing client emails.

Client: {{client_name}}
Project: {{project_name}}
Current Status: {{status}}
Preview URL: {{preview_url}}

Generate 6 CLIENT EMAIL TEMPLATES:

1. PROJECT KICKOFF EMAIL:
Subject:
Body:
Action required:

2. WEEKLY PROGRESS UPDATE:
Subject:
Body (include: what was done, what's next, any decisions needed):

3. PREVIEW REVIEW REQUEST:
Subject:
Body:
Preview link placement:
Action required:

4. REVISION REQUEST ACKNOWLEDGMENT:
Subject:
Body:

5. APPROVAL REQUEST (ready for launch):
Subject:
Body:
What they need to do:

6. LAUNCH ANNOUNCEMENT:
Subject:
Body:
What to check / celebrate:

Keep all emails professional but warm. Under 200 words each. Always end with a clear next action.`,
  },
  {
    id: 'prompt-proposal',
    name: 'Project Proposal Generator',
    category: 'communication',
    description: 'Generate a professional project proposal to send to a prospect.',
    variables: ['business_name', 'client_name', 'project_scope', 'timeline', 'investment'],
    template: `You are a business development consultant writing a project proposal.

Your Business: {{business_name}}
Prospect: {{client_name}}
Project Scope: {{project_scope}}
Timeline: {{timeline}}
Investment: {{investment}}

Write a PROFESSIONAL PROJECT PROPOSAL:

1. EXECUTIVE SUMMARY (3-4 sentences):
What the project is, why it matters, expected outcome.

2. THE PROBLEM WE'RE SOLVING:
[Describe their current situation and the cost of inaction]

3. OUR RECOMMENDED SOLUTION:
[Describe the approach without overwhelming with tech details]

4. WHAT'S INCLUDED:
Phase 1 — [Name]: [Description]
Phase 2 — [Name]: [Description]
Phase 3 — [Name]: [Description]

5. WHAT'S NOT INCLUDED:
[Be clear about scope boundaries]

6. TIMELINE:
Week 1-2: [Deliverable]
Week 3-4: [Deliverable]
Week 5+: [Deliverable]

7. INVESTMENT:
[Present pricing with options if applicable]
Payment terms:

8. WHY US:
[3 specific reasons we're the right choice]

9. NEXT STEPS:
[Clear 1-2-3 action to move forward]

10. EXPIRATION:
This proposal is valid for [X] days.`,
  },

  // ── GOVERNANCE ─────────────────────────────────────────────
  {
    id: 'prompt-definition-of-done',
    name: 'Definition of Done Checklist',
    category: 'governance',
    description: 'Generate a complete definition-of-done checklist for project launch approval.',
    variables: ['project_name', 'website_type', 'integrations'],
    template: `You are a project governance specialist.

Project: {{project_name}}
Site Type: {{website_type}}
Integrations: {{integrations}}

Generate a DEFINITION OF DONE CHECKLIST:

TECHNICAL REQUIREMENTS:
□ All pages load without errors (200 status)
□ No console errors in production
□ All forms submit successfully
□ All integrations tested ({{integrations}})
□ SSL certificate active
□ Redirects configured correctly
□ 404 page exists and is branded
□ Sitemap.xml generated and submitted
□ robots.txt configured

PERFORMANCE:
□ Lighthouse score > 85 on mobile
□ First Contentful Paint < 2s
□ Largest Contentful Paint < 2.5s
□ No render-blocking resources

CONTENT:
□ All copy proofread and approved
□ All images optimized (< 200KB where possible)
□ Alt text on all images
□ Meta titles and descriptions on all pages
□ Open Graph tags for social sharing

CONVERSION:
□ All CTAs visible above fold on mobile
□ Lead form tested and leads are being captured
□ Thank you/confirmation page working
□ Follow-up email sent after form submit

GOVERNANCE:
□ Source truth approved by client
□ Builder handoff receipt created
□ Client review receipt approved
□ Production release approved by project owner
□ No hardcoded secrets in codebase

Sign-off required from: [list roles]`,
  },
  {
    id: 'prompt-security-audit',
    name: 'Pre-Launch Security Audit',
    category: 'governance',
    description: 'Generate a security audit checklist before deploying to production.',
    variables: ['project_name', 'stack', 'has_auth', 'has_payments'],
    template: `You are a security engineer auditing a web project pre-launch.

Project: {{project_name}}
Tech Stack: {{stack}}
Has Authentication: {{has_auth}}
Has Payments: {{has_payments}}

Generate a PRE-LAUNCH SECURITY AUDIT:

SECRETS & CREDENTIALS:
□ All API keys in environment variables (not hardcoded)
□ No secrets committed to git
□ Production vs. development env vars separated
□ Secrets rotated from development testing

API SECURITY:
□ All API routes validate input
□ Rate limiting implemented
□ CORS configured correctly
□ Authentication required on protected endpoints

DATA HANDLING:
□ Form inputs sanitized and validated
□ No sensitive data logged
□ PII handling compliant with applicable laws
□ Database queries use parameterized inputs (no SQL injection risk)

AUTHENTICATION (if applicable):
□ Passwords hashed (bcrypt or equivalent)
□ Session tokens expire appropriately
□ Password reset flow secure
□ Account enumeration prevented

PAYMENT SECURITY (if applicable):
□ No card data stored directly
□ PCI DSS compliance confirmed with payment provider
□ Webhook signatures verified
□ Test mode disabled in production

INFRASTRUCTURE:
□ HTTPS enforced (HTTP redirects to HTTPS)
□ Security headers configured
□ Dependency vulnerabilities checked (npm audit)
□ Error messages don't expose stack traces

SEVERITY LEVELS: P0 = Launch blocker | P1 = Fix within 24h | P2 = Fix within 1 week`,
  },
]

const CATEGORIES = [
  { id: 'all', name: 'All Prompts' },
  { id: 'discovery', name: 'Discovery' },
  { id: 'brand', name: 'Brand' },
  { id: 'builder', name: 'Builder' },
  { id: 'qa', name: 'QA' },
  { id: 'marketing', name: 'Marketing' },
  { id: 'strategy', name: 'Strategy' },
  { id: 'communication', name: 'Communication' },
  { id: 'governance', name: 'Governance' },
]

const CAT_BADGE_COLOR: Record<string, 'gold' | 'green' | 'blue' | 'gray'> = {
  discovery: 'gold',
  brand: 'gold',
  builder: 'blue',
  qa: 'green',
  marketing: 'gold',
  strategy: 'gray',
  communication: 'gray',
  governance: 'green',
}

export default function PromptLibraryPage() {
  const [selectedPrompt, setSelectedPrompt] = useState<Prompt | null>(null)
  const [copied, setCopied] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = PROMPTS.filter(p => {
    const matchesCategory = activeCategory === 'all' || p.category === activeCategory
    const q = search.toLowerCase()
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)
    return matchesCategory && matchesSearch
  })

  const handleCopy = (prompt: Prompt) => {
    navigator.clipboard.writeText(prompt.template)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (selectedPrompt) {
    return (
      <PageShell title={selectedPrompt.name} subtitle={selectedPrompt.description}>
        <div className="mb-6">
          <GhostButton onClick={() => setSelectedPrompt(null)}>
            <ArrowLeft size={14} /> Back to Library
          </GhostButton>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <Card className="p-6">
              <div className="flex items-center justify-between gap-4 mb-5">
                <Badge color={CAT_BADGE_COLOR[selectedPrompt.category] ?? 'gray'}>{selectedPrompt.category}</Badge>
                <GoldButton onClick={() => handleCopy(selectedPrompt)}>
                  {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Prompt</>}
                </GoldButton>
              </div>
              <div
                className="rounded-xl p-5 font-mono text-xs leading-relaxed whitespace-pre-wrap break-words max-h-[600px] overflow-y-auto text-foreground"
                style={{ background: 'rgba(0,0,0,0.40)', border: '1px solid rgba(255,255,255,0.08)', color: '#D4E8C0' }}
              >
                {selectedPrompt.template}
              </div>
            </Card>
          </div>
          <div>
            <Card className="p-5">
              <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground mb-4">Variables to Replace</p>
              <div className="space-y-2.5">
                {selectedPrompt.variables.map(v => (
                  <div key={v} className="flex items-center gap-2.5">
                    <code
                      className="px-2 py-0.5 rounded text-xs font-mono shrink-0"
                      style={{ background: 'rgba(59,130,246,0.12)', color: 'rgba(255,255,255,0.70)', border: '1px solid rgba(59,130,246,0.35)' }}
                    >{`{{${v}}}`}</code>
                    <span className="text-xs text-muted-foreground">{v.replace(/_/g, ' ')}</span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </PageShell>
    )
  }

  return (
    <PageShell title="Prompt Library" subtitle={`${PROMPTS.length} production-grade AI prompts for all project phases`}>
      {/* Search + filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search prompts..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input w-full pl-9 pr-4 py-2.5 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-150"
              style={
                activeCategory === cat.id
                  ? { background: 'linear-gradient(135deg,rgba(255,255,255,0.55) 0%,rgba(255,255,255,0.70) 28%,rgba(255,255,255,0.90) 52%,rgba(255,255,255,0.55) 76%,rgba(255,255,255,0.70) 100%)', color: '#0A0A0A', boxShadow: '0 0 16px rgba(59,130,246,0.45)' }
                  : { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.92)' }
              }
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm text-muted-foreground mb-5">{filtered.length} prompt{filtered.length !== 1 ? 's' : ''}</p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(prompt => (
          <button
            key={prompt.id}
            onClick={() => setSelectedPrompt(prompt)}
            className="text-left group"
          >
            <Card className="p-5 h-full flex flex-col hover:shadow-[0_4px_20px_rgba(0,0,0,0.1)] hover:border-[rgba(255,255,255,0.90)]/35 transition-all duration-200">
              <div className="flex items-start justify-between gap-2 mb-2.5">
                <h3 className="font-bold text-foreground text-sm group-hover:text-[rgba(255,255,255,0.70)] transition-colors">{prompt.name}</h3>
                <Badge color={CAT_BADGE_COLOR[prompt.category] ?? 'gray'}>{prompt.category}</Badge>
              </div>
              <p className="text-xs text-muted-foreground flex-1 leading-relaxed">{prompt.description}</p>
              <div className="flex items-center justify-between mt-4 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <span className="text-xs text-muted-foreground">{prompt.variables.length} variable{prompt.variables.length !== 1 ? 's' : ''}</span>
                <span className="text-xs font-bold uppercase tracking-wider blue-shimmer">View →</span>
              </div>
            </Card>
          </button>
        ))}
      </div>
    </PageShell>
  )
}
