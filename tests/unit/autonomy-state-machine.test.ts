import { describe, expect, it } from 'vitest';
import { isTerminalStatus, normalizeUpstreamStatus, progressForStage, upstreamHasFailed, upstreamIsComplete } from '@/lib/autonomy/state-machine';

describe('controlled autonomy state machine', () => {
  it('recognizes terminal local states', () => {
    expect(isTerminalStatus('COMPLETE')).toBe(true);
    expect(isTerminalStatus('FAILED')).toBe(true);
    expect(isTerminalStatus('RUNNING')).toBe(false);
  });
  it('normalizes terminal upstream states', () => {
    expect(normalizeUpstreamStatus('terminal-failed')).toBe('TERMINAL_FAILED');
    expect(upstreamIsComplete('succeeded')).toBe(true);
    expect(upstreamHasFailed('error')).toBe(true);
  });
  it('never reports below the active stage floor', () => {
    expect(progressForStage('BUILD', 10)).toBe(55);
    expect(progressForStage('VALIDATION', 94)).toBe(94);
    expect(progressForStage('COMPLETE')).toBe(100);
  });
});
