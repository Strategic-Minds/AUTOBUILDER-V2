---
name: auto-image-system
description: Use when generating, scheduling, reviewing, organizing, or automating ultra-realistic epoxy, polished concrete, decorative concrete, overlay, microtopping, concrete countertop, and contractor marketing images. Includes canonical prompt packs, realism rules, manifests, scheduler packets, QA review rules, and helper scripts for daily prompt batches and image asset workflow scaffolds.
---

# Auto Image System

Use this skill for National Epoxy Pros, Auto Builder OS, Strategic Minds Advisory, and future concrete/coatings image automation.

Unified AI intake: `ai@autobuilderos.com`

## Core Workflow

1. Choose campaign or content calendar item.
2. Select finish category.
3. Load the matching prompt pack from `assets/source-system/02_Prompt_Library`.
4. Apply ultra-realism rules from `assets/source-system/01_System_Docs/ultra_realism_rules.md`.
5. Generate prompt variants or images.
6. QA every draft using `assets/source-system/07_QA_Review/qa_checklist.md`.
7. Log results in the image manifest.
8. Move approved outputs into campaign-ready folders.

## Finish Categories

- full flake epoxy
- metallic epoxy
- quartz epoxy
- solid color epoxy
- stained concrete
- natural polished concrete
- decorative overlays
- microtoppings
- concrete countertops

## Non-Negotiable Rules

- Do not represent generated images as completed customer projects unless verified.
- Do not claim manufacturer certification, guaranteed lifespan, slip-proof, maintenance-free, or customer testimonial unless verified.
- Reject impossible reflections, wrong flake scale, fake marble on flake floors, warped rooms, incorrect countertop thickness, unsafe jobsite details, or fantasy render style.
- Use disclosure labels when needed: AI-generated project concept, design visualization, finish inspiration image, concept rendering, not an installed project photo.

## Helper Scripts

Create a run folder:

```bash
python3 scripts/create_image_run.py --brand "National Epoxy Pros" --campaign "garage-flake-week"
```

Create a prompt batch from the canonical prompt registry:

```bash
python3 scripts/build_prompt_batch.py --count 8 --output ./prompt_batch.csv
```

Validate manifest files:

```bash
python3 scripts/validate_manifest.py assets/source-system/04_Manifests/prompt_registry.csv
```

## Agent Behavior

Agents should produce:

- prompt batch
- image generation instructions
- QA review record
- approval state
- disclosure label
- manifest update
- campaign output package

For scheduled automation or multi-agent execution, use the separate `auto-image-system-agent-build-pack`.
