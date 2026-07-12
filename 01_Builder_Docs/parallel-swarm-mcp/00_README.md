# AUTO BUILDER Parallel Swarm MCP Specification Package

Version: 1.0.0
Date: 2026-07-12
Status: INSTALLED ON IMPLEMENTATION BRANCH

## Target system

This package belongs to `Strategic-Minds/AUTOBUILDER-V2`.

`Strategic-Minds/XAB` is a separate sibling system and is not modified by this branch.

## Autonomous factory outcome

The V2 target flow is:

`dashboard idea intake -> durable queue -> sandbox -> recursive parallel swarm -> build -> GitHub repository creation -> Vercel project creation -> validation -> completed project record`

The operator should be able to submit an idea through the dashboard and later see the completed GitHub and Vercel outputs without maintaining an active chat conversation.

## Canonical MCP gateway

`https://auto-builder-strategic-minds-advisory.vercel.app/api/mcp`

## Install path

`01_Builder_Docs/parallel-swarm-mcp/`

## Seven implementation packets

1. Persistent queue and run ledger
2. MCP swarm tool surface
3. Recursive multi-agent runtime
4. GitHub inventory and repository creation
5. Vercel inventory and project creation
6. Five-minute autonomous dispatcher and recovery workflow
7. Validation, receipts, and finished-project publication

## Source truth snapshot

- GitHub installations: 3
- Accessible repositories at snapshot time: 102
- Vercel team: Strategic Minds Advisory
- Vercel team ID: `team_aFdds8lsbHMwe2ip4aQdbQ3d`
- Existing Vercel projects at snapshot time: 7
- Base44 app: `AUTO BUILDER ORCHESTRATOR`
- Base44 app ID: `6a4ae522852a5e08bfa42450`

Inventories are snapshots. Runtime discovery is authoritative and must refresh automatically.