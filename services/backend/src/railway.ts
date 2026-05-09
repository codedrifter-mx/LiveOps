import { GraphQLClient, gql } from 'graphql-request';
import { RestartResult } from './types';

const RAILWAY_API_URL = 'https://backboard.railway.com/graphql/v2';
const API_TOKEN = process.env.RAILWAY_API_TOKEN || '';
const PROJ_ID = process.env.RAILWAY_PROJECT_ID || '';
const KC_SVC_ID = process.env.RAILWAY_KEYCLOAK_SERVICE_ID || '';
const KC_ENV_ID = process.env.RAILWAY_KEYCLOAK_ENVIRONMENT_ID || '';

const client = new GraphQLClient(RAILWAY_API_URL, {
  headers: { 'Project-Access-Token': API_TOKEN },
});

const REDEPLOY = gql`mutation deploymentRedeploy($id: String!) { deploymentRedeploy(id: $id) }`;
const GET_DEPLOYS = gql`query getDeployments($serviceId: String!, $environmentId: String!) { service(id: $serviceId) { deployments(environmentId: $environmentId, first: 5) { edges { node { id status } } } } }`;
const GET_STATUS = gql`query deployment($id: String!) { deployment(id: $id) { id status url } }`;
const UPSERT_VAR = gql`mutation variableUpsert($input: VariableUpsertInput!) { variableUpsert(input: $input) }`;

export interface ServiceInfo {
  id: string;
  serviceId: string;
  serviceName: string;
  numReplicas: number | null;
  region: string | null;
  source: string | null;
  builder: string | null;
  status: string | null;
  deployUrl: string | null;
  commitMessage: string | null;
  commitAuthor: string | null;
  instanceStatus: string | null;
  domains: string[];
  isSleeping: boolean;
}

const GET_SERVICES = gql`
  query getEnvironmentServices($environmentId: String!) {
    environment(id: $environmentId) {
      serviceInstances {
        edges {
          node {
            id
            serviceId
            serviceName
            numReplicas
            region
            source
            builder
            startCommand
            sleepApplication
            cronSchedule
            latestDeployment {
              id
              status
              url
              meta
            }
            domains {
              domain
            }
          }
        }
      }
    }
  }
`;

export async function getLatestDeploymentId(): Promise<string | null> {
  if (!API_TOKEN) return null;
  try {
    const r: any = await client.request(GET_DEPLOYS, { serviceId: KC_SVC_ID, environmentId: KC_ENV_ID });
    console.log('[railway] deployments query:', JSON.stringify(r));
    return r?.service?.deployments?.edges?.[0]?.node?.id || null;
  } catch (e: any) {
    console.error('[railway] deployments query failed:', e?.message || e);
    return null;
  }
}

async function upsertVar(name: string, value: string): Promise<boolean> {
  try { await client.request(UPSERT_VAR, { input: { projectId: PROJ_ID, environmentId: KC_ENV_ID, serviceId: KC_SVC_ID, name, value } }); return true; }
  catch { return false; }
}

export async function restoreJavaOpts(): Promise<RestartResult> {
  const ok = await upsertVar('JAVA_OPTS', '-Xms256m -Xmx384m');
  return ok ? { success: true, message: 'JAVA_OPTS restored' } : { success: false, message: 'Failed' };
}

export async function redeployService(): Promise<RestartResult> {
  const id = await getLatestDeploymentId();
  if (!id) return { success: false, message: 'No deployment found' };
  const r: any = await client.request(REDEPLOY, { id });
  return { success: true, message: `Redeploy: ${r?.deploymentRedeploy || id}` };
}

export async function recoverAndRedeploy(): Promise<RestartResult> {
  await upsertVar('JAVA_OPTS', '-Xms256m -Xmx384m');
  const id = await getLatestDeploymentId();
  if (!id) return { success: false, message: 'No deployment found' };
  const r: any = await client.request(REDEPLOY, { id });
  return { success: true, message: `Recovered + redeployed: ${r?.deploymentRedeploy || id}` };
}

export async function getKeycloakStatus(): Promise<{ status: string; url?: string }> {
  const id = await getLatestDeploymentId();
  if (!id) return { status: 'no_deployment' };
  const r: any = await client.request(GET_STATUS, { id });
  return { status: r?.deployment?.status || 'unknown', url: r?.deployment?.url };
}

export async function getEnvironmentServices(): Promise<ServiceInfo[]> {
  if (!API_TOKEN || !KC_ENV_ID) { console.warn('[railway] getEnvironmentServices: missing API_TOKEN or KC_ENV_ID'); return []; }
  try {
    const r: any = await client.request(GET_SERVICES, { environmentId: KC_ENV_ID });
    const edges = r?.environment?.serviceInstances?.edges || [];
    return edges.map((e: any) => {
      const node = e.node;
      const dep = node.latestDeployment || {};
      const meta = dep.meta || {};
      return {
        id: node.id,
        serviceId: node.serviceId,
        serviceName: node.serviceName || 'unknown',
        numReplicas: node.numReplicas ?? null,
        region: node.region || null,
        source: node.source || null,
        builder: node.builder || null,
        status: dep.status || null,
        deployUrl: dep.url || null,
        commitMessage: meta.commitMessage || null,
        commitAuthor: meta.commitAuthor || null,
        instanceStatus: null,
        domains: (node.domains || []).map((d: any) => d.domain),
        isSleeping: !!node.sleepApplication,
      };
    });
  } catch (e: any) {
    console.error('[railway] getEnvironmentServices failed:', e?.message || e);
    return [];
  }
}
