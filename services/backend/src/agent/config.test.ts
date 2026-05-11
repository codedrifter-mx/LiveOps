import assert from 'node:assert/strict';
import test from 'node:test';
import { A2UI_RUNTIME_CONFIG, AGENT_MODEL, AGENT_OVERRIDABLE_PROPERTIES } from './config';

test('uses current Gemini model and allows tool choice override', () => {
  assert.equal(AGENT_MODEL, 'google/gemini-2.5-flash');
  assert.ok(AGENT_OVERRIDABLE_PROPERTIES.includes('toolChoice'));
  assert.deepEqual(A2UI_RUNTIME_CONFIG, { agents: ['default'] });
});
