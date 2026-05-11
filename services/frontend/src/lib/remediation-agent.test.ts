import assert from 'node:assert/strict';
import test from 'node:test';
import { REMEDIATION_AGENT_RUN_OPTIONS } from './remediation-agent';

test('forces the incident agent to call show-remediation', () => {
  assert.deepEqual(REMEDIATION_AGENT_RUN_OPTIONS, {
    forwardedProps: {
      toolChoice: { type: 'tool', toolName: 'show-remediation' },
    },
  });
});
