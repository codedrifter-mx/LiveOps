const { GraphQLClient, gql } = require('graphql-request');

const API_TOKEN = process.env.RAILWAY_API_TOKEN || '11258359-f288-499f-b6ad-35205d084267';
const KC_SVC_ID = process.env.KC_SVC_ID || 'b0cba8ec-390a-4aaa-933f-ae6aca513c48';
const KC_ENV_ID = process.env.KC_ENV_ID || 'aba7509a-25d0-419f-a6e5-d2deb87771a8';

const client = new GraphQLClient('https://backboard.railway.com/graphql/v2', {
  headers: { 'Project-Access-Token': API_TOKEN },
});

async function run() {
  // Get deployment ID
  const q = gql`query getDeployments($serviceId: String!) { service(id: $serviceId) { deployments(first: 1) { edges { node { id status } } } } }`;
  const r = await client.request(q, { serviceId: KC_SVC_ID });
  const depId = r?.service?.deployments?.edges?.[0]?.node?.id;
  console.log('Deployment ID:', depId);
  if (!depId) { console.log('No deployment found'); return; }

  // Introspect deployment type fields
  const intro = gql`
    query introspection {
      __type(name: "Deployment") {
        fields {
          name
          type {
            name
            kind
          }
        }
      }
    }
  `;
  try {
    const ri = await client.request(intro);
    const fields = ri?.__type?.fields?.map(f => f.name) || [];
    console.log('Deployment fields:', fields.join(', '));
  } catch(e) {
    console.log('Introspection ERROR:', e.message.slice(0, 200));
  }

  // Introspect service type
  const introSvc = gql`
    query introspection {
      __type(name: "Service") {
        fields {
          name
          type {
            name
            kind
          }
        }
      }
    }
  `;
  try {
    const ri = await client.request(introSvc);
    const fields = ri?.__type?.fields?.map(f => f.name) || [];
    console.log('Service fields:', fields.join(', '));
  } catch(e) {
    console.log('Service introspection ERROR:', e.message.slice(0, 200));
  }

  // Introspect Instance type
  try {
    const ri = await client.request(gql`
      query introspection { __type(name: "Instance") { fields { name type { name kind } } } }
    `);
    const fields = ri?.__type?.fields?.map(f => `${f.name}:${f.type?.name || f.type?.kind}`) || [];
    console.log('Instance fields:', fields.join(', '));
  } catch(e) {
    console.log('Instance introspection ERROR:', e.message.slice(0, 200));
  }

  // Introspect DeploymentDeploymentInstance type
  try {
    const r = await client.request(gql`
      query introspection { __type(name: "DeploymentDeploymentInstance") { fields { name type { name kind } } } }
    `);
    const fields = r?.__type?.fields?.map(f => `${f.name}:${f.type?.name || f.type?.kind}`) || [];
    console.log('DeploymentDeploymentInstance fields:', fields.join(', '));
  } catch(e) { console.log('Instance type introspection ERROR:', e.message.slice(0, 200)); }

  // Also check environment type for limits
  try {
    const r = await client.request(gql`
      query introEnv { __type(name: "Environment") { fields { name } } }
    `);
    const fields = r?.__type?.fields?.map(f => f.name) || [];
    console.log('Environment fields:', fields.join(', '));
  } catch(e) { console.log('Environment introspection ERROR:', e.message.slice(0, 200)); }

  // Try environment query for config
  try {
    const q = gql`query getEnv($id: String!) { environment(id: $id) { id name config serviceInstances { id } } }`;
    const r = await client.request(q, { id: KC_ENV_ID });
    console.log('Environment:', JSON.stringify(r, null, 2));
  } catch(e) { console.log('Environment query ERROR:', e.message.slice(0, 200)); }

  // Query service instance with resource-related fields
  // Need to use edges/node pattern for connections
  for (const fields of [
    'serviceInstances { edges { node { id serviceId numReplicas region } } }',
    'serviceInstances { edges { node { id serviceId numReplicas railpackInfo } } }',
  ]) {
    try {
      const q = gql`query getEnv($id: String!) { environment(id: $id) { ${fields} } }`;
      const r = await client.request(q, { id: KC_ENV_ID });
      console.log(`SI (${fields.slice(0, 60)}...):`, JSON.stringify(r, null, 2).slice(0, 800));
    } catch(e) { console.log(`SI (${fields.slice(0, 60)}...): ERROR`); }
  }

  // Check EnvironmentServiceInstancesConnection type
  try {
    const r = await client.request(gql`query intro { __type(name: "EnvironmentServiceInstancesConnection") { fields { name type { name } } } }`);
    console.log('EnvSvcInstConn fields:', JSON.stringify(r?.__type?.fields?.map(f => f.name)));
  } catch(e) { console.log('EnvSvcInstConn introspection ERROR:', e.message.slice(0, 200)); }

  // Check railpackInfo field type
  try {
    const r = await client.request(gql`query intro { __type(name: "ServiceInstance") { fields { name type { name } } } }`);
    const memFields = r?.__type?.fields?.filter(f => f.name.includes('memory') || f.name.includes('cpu') || f.name.includes('limit') || f.name.includes('resource') || f.name.includes('plan') || f.name.includes('replica') || f.name === 'railpackInfo');
    console.log('ServiceInstance resource fields:', JSON.stringify(memFields));
  } catch(e) { console.log('ServiceInstance fields filter ERROR:', e.message.slice(0, 200)); }

  // Try service config for service limits (maybe through a different query)
  const qSvc = gql`query getService($id: String!) { service(id: $id) { id name } }`;
  const rs = await client.request(qSvc, { id: KC_SVC_ID });
  console.log('Service:', JSON.stringify(rs, null, 2));

  // Try plugin or serviceDomain for config
  for (const field of ['serviceDomains', 'config', 'serviceConfig', 'deployments', 'environments']) {
    try {
      const r = await client.request(gql`query getService($id: String!) { service(id: $id) { ${field} } }`, { id: KC_SVC_ID });
      console.log(`service.${field}:`, JSON.stringify(r, null, 2).slice(0, 500));
    } catch(e) { console.log(`service.${field}: ERROR`); }
  }
}
run().catch(e => { console.error('FATAL:', e.message); if (e.response) console.log(JSON.stringify(e.response)); });
