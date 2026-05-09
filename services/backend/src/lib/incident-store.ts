import { IncidentEvent, IncidentDetail, AgentAction } from '../types';
const incidents: Map<string, IncidentDetail> = new Map();
export function addIncident(event: IncidentEvent): void { incidents.set(event.id, { event, actions: [] }); }
export function getIncident(id: string): IncidentDetail | undefined { return incidents.get(id); }
export function getAllIncidents(): IncidentDetail[] { return Array.from(incidents.values()).sort((a, b) => new Date(b.event.timestamp).getTime() - new Date(a.event.timestamp).getTime()); }
export function clear(): void { incidents.clear(); }
