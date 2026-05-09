export type ActionStatusKind = 'waiting' | 'success' | 'error';

export interface ActionStatus {
  kind: ActionStatusKind;
  title: string;
  message: string;
}

interface ActionResponse {
  success?: boolean;
  message?: string;
}

export function getActionStatusFromResponse(action: string, response: ActionResponse): ActionStatus {
  if (action === 'recover-keycloak') {
    return {
      kind: 'waiting',
      title: 'Recovering Keycloak',
      message: 'Recovery request accepted. Waiting for Keycloak to report healthy...',
    };
  }

  if (response.success === false) {
    return {
      kind: 'error',
      title: 'Action failed',
      message: response.message || 'The action could not be completed.',
    };
  }

  return {
    kind: 'success',
    title: 'Action sent',
    message: response.message || 'The action was sent to the backend.',
  };
}

export function getRecoverySuccessStatus(): ActionStatus {
  return {
    kind: 'success',
    title: 'Keycloak recovered',
    message: 'Backend health checks confirmed Keycloak is healthy.',
  };
}
