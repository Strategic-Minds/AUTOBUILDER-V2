type JsonRecord = Record<string, unknown>

type PackProject = {
  id: string
  name: string
  client_name: string
  industry: string
  region: string
  metadata: JsonRecord
}

function projectServices(project: PackProject) {
  const raw = typeof project.metadata.services === 'string' ? project.metadata.services : ''
  const services = raw.split(/[\n,]/).map((item) => item.trim()).filter(Boolean)
  return services.length ? services : ['Consultation', 'Installation', 'Project support']
}

function projectBrief(project: PackProject) {
  return typeof project.metadata.brief === 'string' ? project.metadata.brief.trim() : ''
}

export function buildBrandOptions(project: PackProject) {
  const services = projectServices(project)
  const brief = projectBrief(project)

  return [
    {
      option_number: 1,
      config: {
        label: 'Premium Precision',
        positioning: `${project.client_name} as the high-trust premium ${project.industry} specialist in ${project.region}.`,
        primary_mark: 'Architectural monogram paired with a disciplined horizontal wordmark.',
        alternate_mark: 'Circular project-seal badge and simplified app/favicon monogram.',
        logo_direction: 'Crisp geometry, generous negative space, engineered line weight, no decorative clutter.',
        palette: ['#FFFFFF', '#111111', '#D4AF37', '#C7CCD4', '#F8F9FB'],
        palette_roles: {
          background: '#FFFFFF',
          primary_text: '#111111',
          premium_accent: '#D4AF37',
          metallic_support: '#C7CCD4',
          surface: '#F8F9FB',
        },
        typography: {
          display: 'Modern geometric sans, bold, tightly tracked for headlines.',
          body: 'Neutral humanist sans, highly readable at mobile sizes.',
          usage: 'Large editorial headlines, compact uppercase labels, calm body copy.',
        },
        imagery_direction: 'Ultra-real project photography with clean architectural framing, natural highlights, accurate materials, and restrained depth of field.',
        messaging: {
          headline: `Precision ${project.industry}. Built to perform beautifully.`,
          subheadline: `${project.client_name} brings disciplined planning, premium execution, and visible quality control to every project in ${project.region}.`,
          proof: `Clear scope, documented process, and a finished result aligned to the approved direction.`,
        },
        voice: 'Confident, direct, technically credible, premium without sounding distant.',
        slogan_options: ['Precision You Can See.', 'Built Right. Finished Beautifully.', 'Performance, Refined.'],
        brand_principles: ['Clarity before decoration', 'Proof before promises', 'Premium restraint', 'Consistent mobile readability'],
        desktop_usage: 'White editorial canvas, black typography, restrained gold actions, full-width project photography, metallic-silver dividers.',
        mobile_usage: 'Large single-message hero, thumb-friendly gold CTA, simplified monogram, stacked proof cards, persistent contact action.',
        services,
        brief,
        project: project.name,
      },
    },
    {
      option_number: 2,
      config: {
        label: 'Modern Authority',
        positioning: `${project.client_name} as the calm, enterprise-grade category authority for ${project.industry} in ${project.region}.`,
        primary_mark: 'Minimal symbol derived from layered planes and a balanced editorial wordmark.',
        alternate_mark: 'Square app mark and narrow vertical signature for social and vehicle graphics.',
        logo_direction: 'Quiet confidence, precise spacing, unmistakable silhouette, scalable from favicon to signage.',
        palette: ['#F8F9FB', '#171717', '#C7CCD4', '#9B7B19', '#FFFFFF'],
        palette_roles: {
          background: '#F8F9FB',
          primary_text: '#171717',
          brushed_silver: '#C7CCD4',
          dark_gold: '#9B7B19',
          card: '#FFFFFF',
        },
        typography: {
          display: 'Editorial grotesk with moderate contrast and generous line spacing.',
          body: 'Interface sans optimized for forms, dashboards, and long service pages.',
          usage: 'Measured headlines, compact data labels, spacious service descriptions.',
        },
        imagery_direction: 'Editorial case-study photography, wide establishing shots, detail crops, crews at work, and clean before-and-after storytelling.',
        messaging: {
          headline: `The clearer way to plan and deliver ${project.industry}.`,
          subheadline: `A polished, transparent project experience from first conversation to final review.`,
          proof: `Structured decisions, accountable milestones, and work that is easy to understand before it begins.`,
        },
        voice: 'Clear, calm, informed, outcome-focused, consultative rather than sales-heavy.',
        slogan_options: ['Clarity at Every Stage.', 'Authority Through Execution.', 'A Better Standard, Clearly Delivered.'],
        brand_principles: ['Editorial clarity', 'Human expertise', 'Transparent process', 'Measured confidence'],
        desktop_usage: 'Frost-white sections, editorial two-column layouts, silver rules, dark-gold micro accents, case-study modules.',
        mobile_usage: 'Compact editorial cards, scrollable proof timeline, high-contrast form controls, reduced-motion transitions.',
        services,
        brief,
        project: project.name,
      },
    },
    {
      option_number: 3,
      config: {
        label: 'Bold Local Leader',
        positioning: `${project.client_name} as the memorable, conversion-focused local leader for ${project.industry} across ${project.region}.`,
        primary_mark: 'Distinctive shield or location badge with a strong condensed wordmark.',
        alternate_mark: 'Single-letter badge, social avatar, and service-category icon family.',
        logo_direction: 'Bold silhouette, immediate recognition, practical reproduction on trucks, uniforms, signs, and mobile screens.',
        palette: ['#FFFFFF', '#090909', '#D4AF37', '#E9E9E9', '#2C2C2C'],
        palette_roles: {
          background: '#FFFFFF',
          primary_text: '#090909',
          action: '#D4AF37',
          muted_surface: '#E9E9E9',
          dark_surface: '#2C2C2C',
        },
        typography: {
          display: 'Strong condensed display face for offers and regional authority.',
          body: 'Friendly neutral sans for reviews, service explanations, and forms.',
          usage: 'Punchy offer headlines, prominent service names, simple proof statistics.',
        },
        imagery_direction: 'High-impact local project photography, recognizable property types, people-centered proof, crisp transformations, and practical service closeups.',
        messaging: {
          headline: `${project.region}'s bold choice for ${project.industry}.`,
          subheadline: `Fast answers, clear options, and a finished project designed around the way you use the space.`,
          proof: `Local responsiveness backed by a repeatable professional process.`,
        },
        voice: 'Energetic, practical, conversion-focused, friendly, and decisive.',
        slogan_options: ['Local Strength. Professional Finish.', 'Built for Your Space.', 'Make the First Impression Last.'],
        brand_principles: ['Immediate recognition', 'Local proof', 'Strong calls to action', 'Simple language'],
        desktop_usage: 'Bold service selector, black proof bands, gold CTA blocks, local gallery, review wall, instant-quote entry point.',
        mobile_usage: 'Sticky call and quote actions, short offer hero, service chips, swipeable project proof, one-column quote funnel.',
        services,
        brief,
        project: project.name,
      },
    },
  ]
}

export function buildWebsiteOptions(project: PackProject, approvedBrand: JsonRecord) {
  const services = projectServices(project)
  const shared = {
    approved_brand: approvedBrand,
    conversion_objective: 'Turn qualified visitors into completed consultation or quote requests.',
    navigation: ['Home', 'Services', 'Projects', 'Process', 'About', 'FAQ', 'Contact'],
    forms: [
      { name: 'consultation', fields: ['name', 'email', 'phone', 'service', 'project details'], validation: 'required fields, email, accessible errors' },
      { name: 'quick quote', fields: ['service', 'location', 'size or scope', 'contact'], validation: 'progressive and mobile friendly' },
    ],
    integrations: ['Analytics-ready events', 'Server-side CRM adapter boundary', 'Spam protection boundary', 'Receipt-safe lead event'],
    component_states: ['default', 'hover', 'focus-visible', 'active', 'disabled', 'loading', 'success', 'error', 'empty'],
    accessibility: ['semantic landmarks', 'keyboard navigation', 'visible focus', 'labelled forms', 'contrast review', 'reduced motion'],
    pwa_behavior: ['standalone manifest', 'service worker shell', 'installable mobile experience', 'offline-safe landing fallback'],
    services,
  }

  return [
    {
      option_number: 1,
      label: 'Precision Funnel',
      preview_url: null,
      config: {
        ...shared,
        layout: 'Luxury-minimal proof-first landing experience with generous white space and a decisive consultation funnel.',
        sections: ['Premium hero', 'Trust proof', 'Service grid', 'Process timeline', 'Project gallery', 'Estimator CTA', 'Reviews', 'FAQ', 'Consultation form', 'Footer'],
        funnel: ['Hero consultation CTA', 'Service selection', 'Proof and process', 'Short qualification form', 'Confirmation and follow-up boundary'],
        content_direction: 'Concise authority copy, visible craftsmanship, transparent process, and premium restraint.',
        trust_proof: ['project photography', 'process standards', 'service guarantees', 'review excerpts', 'coverage area'],
        primary_cta: 'Start Your Project',
        secondary_cta: 'View Project Standard',
        interaction: 'Fast restrained motion, sticky mobile action, clear section anchors, no decorative interaction that slows conversion.',
        responsive: {
          desktop: 'Editorial 12-column layout with wide hero and three-column proof cards.',
          tablet: 'Two-column content, compressed navigation, preserved visual hierarchy.',
          mobile: 'Single-column funnel, 390px tested, thumb-friendly actions, no horizontal overflow.',
        },
        desktop_visual_spec: 'Full-length white canvas with charcoal typography, silver lines, gold actions, black proof panel, and immersive project photography.',
        mobile_visual_spec: 'Full-length mobile page with compact hero, stacked service cards, sticky quote action, swipe-safe gallery, and accessible form.',
      },
    },
    {
      option_number: 2,
      label: 'Editorial Authority',
      preview_url: null,
      config: {
        ...shared,
        layout: 'Case-study-led editorial website that establishes expertise before presenting the consultation offer.',
        sections: ['Editorial hero', 'Featured transformation', 'Capabilities', 'Case studies', 'Method', 'Team and authority', 'Resources', 'Reviews', 'Consultation CTA', 'Footer'],
        funnel: ['Authority statement', 'Featured result', 'Relevant capability', 'Case-study evidence', 'Consultation request'],
        content_direction: 'Longer-form stories, thoughtful project context, educational proof, and measured calls to action.',
        trust_proof: ['case studies', 'before-and-after evidence', 'methodology', 'team expertise', 'resource content'],
        primary_cta: 'Discuss Your Project',
        secondary_cta: 'Explore Case Studies',
        interaction: 'Cinematic but accessible section transitions, case-study filters, anchored reading progress, reduced-motion fallback.',
        responsive: {
          desktop: 'Asymmetric editorial grid, large type, alternating image and narrative modules.',
          tablet: 'Balanced two-column case studies with preserved reading order.',
          mobile: 'Story-first stack, expandable project facts, fixed bottom consultation shortcut.',
        },
        desktop_visual_spec: 'Frost-white editorial layout with charcoal text, brushed-silver rules, quiet gold metadata, and wide documentary imagery.',
        mobile_visual_spec: 'Readable mobile story cards, short captions, touch-safe case-study navigation, and reduced-motion behavior.',
      },
    },
    {
      option_number: 3,
      label: 'Conversion Command',
      preview_url: null,
      config: {
        ...shared,
        layout: 'High-conversion service chooser and instant-quote funnel with bold proof and persistent mobile actions.',
        sections: ['Offer hero', 'Service selector', 'Quick quote steps', 'Visual transformations', 'Why choose us', 'Reviews', 'Guarantees', 'Coverage map', 'FAQ', 'Final CTA', 'Footer'],
        funnel: ['Choose service', 'Confirm location', 'Enter scope', 'Review proof', 'Submit contact', 'Receive confirmation'],
        content_direction: 'Direct benefit-led copy, short answers, strong social proof, and clear next actions.',
        trust_proof: ['review wall', 'visual transformations', 'response-time promise', 'service guarantees', 'local coverage'],
        primary_cta: 'Get My Quote',
        secondary_cta: 'See Recent Results',
        interaction: 'Guided quote steps, persistent mobile call and quote controls, visible progress, clear validation and recovery.',
        responsive: {
          desktop: 'Split hero with quote entry, three-column service chooser, proof metrics, and review wall.',
          tablet: 'Two-column selector and full-width guided quote steps.',
          mobile: 'Top-half proof, bottom-half controls, sticky call and quote actions, one-question-per-step flow.',
        },
        desktop_visual_spec: 'High-contrast white and black conversion system with gold controls, project tiles, metric bands, and structured quote flow.',
        mobile_visual_spec: 'App-like mobile funnel with large controls, top-mounted visual proof, bottom-mounted interaction, and installable PWA behavior.',
      },
    },
  ]
}
