import type { AutonomyStage, AutonomyStatus } from './types';

const TERMINAL = new Set<AutonomyStatus>(['COMPLETE', 'FAILED', 'CANCELLED']);

const FLOOR: Record<AutonomyStage, number> = {
  INTAKE: 5,
  INGESTION: 15,
  PLANNING: 25,
  SWARM: 40,
  BUILD: 55,
  BROWSER_VALIDATION: 70,
  PROVISIONING: 80,
  VALIDATION: 90,
  FINALIZATION: 97,
  COMPLETE: 100,
};

export function isTerminalStatus(status: AutonomyStatus): boolean {
  return TERMINAL.has(status);
}

export function normalizeUpstreamStatus(value: unknown): string {
  return String(value ?? '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

export function upstreamIsComplete(value: unknown): boolean {
  return ['COMPLETE', 'COMPLETED', 'SUCCEEDED', 'SUCCESS'].includes(normalizeUpstreamStatus(value));
}

export function upstreamHasFailed(value: unknown): boolean {
  return ['FAILED', 'TERMINAL_FAILED', 'ERROR', 'CANCELLED'].includes(normalizeUpstreamStatus(value));
}

export function progressForStage(stage: AutonomyStage, upstreamProgress?: number): number {
  const floor = FLOOR[stage];
  if (typeof upstreamProgress !== 'number' || !Number.isFinite(upstreamProgress)) return floor;
  return Math.max(floor, Math.min(100, Math.round(upstreamProgress)));
}
