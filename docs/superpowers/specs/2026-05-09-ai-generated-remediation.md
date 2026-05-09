# AI-Generated Remediation via A2UI

**Date:** 2026-05-09
**Project:** LiveOps

## Problem

The NOC dashboard has hardcoded stat cards (Service, Status, Error Rate, Impact) and action buttons (Redeploy, Recover Memory, Status Check, Generate Action). These are static — the same UI every incident. The generative AI (CopilotKit + Gemini 2.0 Flash) should dynamically generate the entire remediation section: analysis text explaining what's happening, and action buttons tailored to the situation.

## Design

### Architecture

```
SSE incident detected (isDown = true)
    │
    ▼
Frontend: programmatically sends system message to agent
(via hidden useCopilotChat.appendMessage)
    │
    ▼
Agent receives incident context from useCopilotReadable
    │
    ▼
Agent (Gemini 2.0 Flash) generates analysis + decides
which buttons to show
    │
    ▼
Agent calls useCopilotAction('show-remediation')
with { analysis, buttons } payload
    │
    ▼
Frontend renders remediation card with:
  - Loading spinner while agent generates
  - Animated analysis text card
  - Action buttons (Redeploy, Recover Memory, etc.)
```

### A2UI Action: `show-remediation`

Registered in `App.tsx` via `useCopilotAction`:

```typescript
useCopilotAction({
  name: 'show-remediation',
  parameters: {
    analysis: { type: 'string', description: 'AI analysis of the incident' },
    buttons: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          label: { type: 'string' },
          action: { type: 'string', enum: ['redeploy-keycloak', 'recover-keycloak', 'get-keycloak-status'] },
          variant: { type: 'string', enum: ['lilac', 'mint', 'blue', 'outline'] },
        },
        required: ['label', 'action'],
      },
    },
  },
  render: ({ args, status }) => {
    if (status === 'executing') return <Spinner />;
    return <RemediationCard analysis={args.analysis} buttons={args.buttons} />;
  },
});
```

Renders a card in the empty left column (replacing the removed stat grid + action buttons):

```
┌──────────────────────────────────────────────┐
│  AI Analysis                                  │
│                                               │
│  "Keycloak is experiencing an OOM error on    │
│   node-4. Heap usage at 94%. Garbage          │
│   collection overhead limit exceeded. I       │
│   recommend immediate redeployment."          │
│                                               │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐ │
│  │Redeploy│ │Recover │ │Status  │ │Gen.   │ │
│  │        │ │Memory  │ │Check   │ │Action │ │
│  └────────┘ └────────┘ └────────┘ └───────┘ │
└──────────────────────────────────────────────┘
```

### Agent Trigger via CopilotTask

When `isDown` transitions from `false` to `true`, the frontend runs a `CopilotTask` programmatically — no chat UI needed. `CopilotTask` sends instructions to the agent, the agent processes and calls the A2UI action, and the UI renders.

```typescript
import { CopilotTask, useCopilotContext } from '@copilotkit/react-core';

// In App component:
const context = useCopilotContext();

useEffect(() => {
  if (!isDown || !currentIncident) return;
  const task = new CopilotTask({
    instructions: `[INCIDENT ALERT] Keycloak is DOWN.
Error rate: ${currentIncident.errorRate || 'N/A'}
Impacted users: ${currentIncident.impactedUsers || 'N/A'}
Last healthy: ${currentIncident.lastHealthy || 'N/A'}

Analyze the situation and call show-remediation with your analysis and recommended action buttons.`
  });
  task.run(context);
}, [isDown, currentIncident]);
```

The agent receives this via the CopilotRuntime, analyzes with Gemini 2.0 Flash, and responds by calling `show-remediation` which renders the UI on the frontend.

### Agent Prompt Update

The backend system prompt in `services/backend/src/agent/prompts.ts` gains analysis instructions:

```
When an incident is detected:
1. Analyze the situation using the incident data provided
2. Generate a concise analysis explaining what's happening, root cause, and impact
3. Call the show-remediation action with your analysis text and appropriate action buttons
4. Available actions: redeploy-keycloak, recover-keycloak, get-keycloak-status
5. Always explain reasoning before presenting buttons
```

### Animations

- **Pulse spinner** on the remediation card while `status === 'executing'` (agent generating)
- **Slide-in** animation when the action data arrives and renders
- **Button hover** effects (existing)
- **Pulse** on the status dot while incident is active (existing)

### New CSS

```css
.remediation-agent-card { /* same as .gen-card but with min-height for loading state */ }
.spinner { /* simple CSS spinner with keyframes */ }
@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
.remediation-text { /* larger readable text for analysis, 14px, line-height 1.5 */ }
```

### Components

**New:**
- `RemediationCard.tsx` — Renders agent-generated analysis text + action buttons. Used by `useCopilotAction` render function. Accepts `{ analysis, buttons, onAction }`.

**Removed:**
- `StatCard.tsx` — No longer needed (stats are now in the agent's analysis text)
- `ActionButton.tsx` — Replaced by buttons rendered inside `RemediationCard`

**Kept (unchanged):**
- `ApprovalCard.tsx` — Still triggered when user clicks a remediation button
- `FeedItem.tsx` — Timeline still shows incident events
- `EmptyState.tsx` — No incident state unchanged

### File Changes

| File | Change |
|------|--------|
| `services/backend/src/agent/prompts.ts` | Add analysis + show-remediation instructions |
| `services/frontend/src/App.tsx` | Remove stat grid + action buttons, add `useCopilotAction` + `useCopilotChat` + `useCopilotReadable`, trigger agent on incident |
| `services/frontend/src/App.css` | Add `.spinner`, `.remediation-text`, `.remediation-agent-card` styles |
| `services/frontend/src/components/RemediationCard.tsx` | New — renders AI analysis + buttons |

### States

- **Loading (agent generating):** Pulse spinner with "Agent analyzing..." text in the card
- **Loaded (action called):** Slide-in animation, shows analysis text + action buttons
- **Error (action failed):** Show fallback: "Unable to generate analysis. Please check the incident timeline."
- **Empty (no incident):** Card not rendered (isDown check)

### Error Handling

- If agent times out: the `status` will remain `'executing'` — add a timeout check (e.g. 30s max)
- If agent returns invalid buttons: render a default set (Redeploy, Status Check)
- If `appendMessage` fails: silently catch, incident data still available via timeline
