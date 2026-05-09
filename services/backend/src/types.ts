export interface IncidentEvent {
  id: string; type: 'incident' | 'recovery'; service: string; status: 'down' | 'healthy';
  errorRate?: string; impactedUsers?: number; timestamp: string; lastHealthy?: string;
}
export interface ServiceStatus {
  service: string; status: 'down' | 'healthy'; lastChecked: string;
  consecutiveFailures: number; consecutiveSuccesses: number;
}
export interface RestartResult { success: boolean; message: string; deploymentId?: string; }
export interface AgentAction {
  name: string; description: string;
  status: 'pending' | 'approved' | 'rejected' | 'executing' | 'completed' | 'failed';
  timestamp: string; completedAt?: string;
}
export interface IncidentDetail { event: IncidentEvent; actions: AgentAction[]; }
