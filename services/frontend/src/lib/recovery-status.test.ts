import assert from 'node:assert/strict';
import test from 'node:test';
import { getActionStatusFromResponse, getRecoverySuccessStatus } from './recovery-status';

test('keeps recovery waiting instead of showing no deployment JSON', () => {
  const status = getActionStatusFromResponse('recover-keycloak', {
    success: false,
    message: 'No deployment found',
  });

  assert.deepEqual(status, {
    kind: 'waiting',
    title: 'Recovering Keycloak',
    message: 'Recovery request accepted. Waiting for Keycloak to report healthy...',
  });
});

test('uses SSE recovery event as the done signal', () => {
  assert.deepEqual(getRecoverySuccessStatus(), {
    kind: 'success',
    title: 'Keycloak recovered',
    message: 'Backend health checks confirmed Keycloak is healthy.',
  });
});

test('shows a friendly failure for non-recovery errors', () => {
  const status = getActionStatusFromResponse('redeploy-keycloak', {
    success: false,
    message: 'No deployment found',
  });

  assert.deepEqual(status, {
    kind: 'error',
    title: 'Action failed',
    message: 'No deployment found',
  });
});
