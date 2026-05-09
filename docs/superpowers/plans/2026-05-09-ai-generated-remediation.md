# AI-Generated Remediation via A2UI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace hardcoded stat cards and action buttons with AI-generated remediation section using CopilotKit A2UI triggered by `CopilotTask`.

**Architecture:** Agent (Gemini 2.0 Flash) is woken via `CopilotTask` when incident detected. Agent calls `show-remediation` action (frontend handler) which sets React state. `RemediationCard` renders from state in the JSX flow. No chat UI.

**Tech Stack:** CopilotKit 1.57.1 (`@copilotkit/react-core`), Gemini 2.0 Flash, A2UI

---

### Task 1: Update backend agent prompt

**Files:**
- Modify: `services/backend/src/agent/prompts.ts`

- [ ] **Step 1: Replace with new prompt**

`services/backend/src/agent/prompts.ts`:
```typescript
export const SYSTEM_PROMPT = `You are the LiveOps incident response agent.

When an incident is detected:
1. Analyze the situation using the incident data provided
2. Generate a concise analysis explaining what's happening, root cause, and impact
3. Call the show-remediation action with your analysis text and appropriate action buttons
4. Available actions: redeploy-keycloak, recover-keycloak, get-keycloak-status
5. Always explain reasoning before presenting buttons

Button variants available: lilac (primary action), mint (recovery action), blue (info/status action), outline (secondary action).

Example button configuration:
[
  { "label": "Redeploy", "action": "redeploy-keycloak", "variant": "lilac" },
  { "label": "Recover Memory", "action": "recover-keycloak", "variant": "mint" },
  { "label": "Status Check", "action": "get-keycloak-status", "variant": "blue" }
]`;
```

- [ ] **Step 2: Verify backend compiles**

Run: `cd C:\Users\Kazuk\projects\LiveOps\services\backend && npx tsc`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add services/backend/src/agent/prompts.ts
git commit -m "feat: update agent prompt with analysis and show-remediation instructions"
```

---

### Task 2: Create RemediationCard component

**Files:**
- Create: `services/frontend/src/components/RemediationCard.tsx`

- [ ] **Step 1: Create the component**

`services/frontend/src/components/RemediationCard.tsx`:
```typescript
interface RemediationButton {
  label: string;
  action: string;
  variant: string;
}

interface Props {
  analysis: string;
  buttons: RemediationButton[];
  onAction: (action: string) => void;
  loading?: boolean;
  error?: string | null;
}

export function RemediationCard({ analysis, buttons, onAction, loading, error }: Props) {
  if (error) {
    return <div className="gen-card">
      <div className="gen-label">AI Analysis</div>
      <div style={{fontSize:13,color:'var(--red)',marginTop:8}}>{error}</div>
    </div>;
  }

  if (loading) {
    return <div className="gen-card" style={{display:'flex',flexDirection:'column',alignItems:'center',gap:16,minHeight:120,justifyContent:'center'}}>
      <div className="spinner" />
      <div className="gen-label" style={{marginBottom:0}}>Agent analyzing...</div>
    </div>;
  }

  if (!analysis && buttons.length === 0) return null;

  return <div className="gen-card animate-in">
    <div className="gen-label">AI Analysis</div>
    <div className="remediation-text">{analysis}</div>
    <div className="action-grid" style={{marginTop:16}}>
      {buttons.map((btn, i) => (
        <button key={i} className={`action-btn ${btn.variant}`} onClick={() => onAction(btn.action)}>
          {btn.label}
        </button>
      ))}
    </div>
  </div>;
}
```

- [ ] **Step 2: Verify frontend compiles**

Run: `cd C:\Users\Kazuk\projects\LiveOps\services\frontend && npx tsc -b`
Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add services/frontend/src/components/RemediationCard.tsx
git commit -m "feat: add RemediationCard component"
```

---

### Task 3: Add spinner and remediation-text CSS

**Files:**
- Modify: `services/frontend/src/App.css`

- [ ] **Step 1: Append new CSS rules**

Add at the end of `services/frontend/src/App.css`:
```css
@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
.spinner { width: 24px; height: 24px; border: 3px solid var(--border); border-top-color: var(--lilac); border-radius: 50%; animation: spin .8s linear infinite; }
.remediation-text { font-size: 14px; line-height: 1.6; color: var(--primary); margin-top: 8px; }
```

- [ ] **Step 2: Verify frontend compiles and builds**

```bash
cd C:\Users\Kazuk\projects\LiveOps\services\frontend && npx tsc -b && npx vite build
```
Expected: no errors, build succeeds

- [ ] **Step 3: Commit**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add services/frontend/src/App.css
git commit -m "feat: add spinner and remediation-text CSS classes"
```

---

### Task 4: Rewrite App.tsx — remove hardcoded stats, add A2UI

**Files:**
- Modify: `services/frontend/src/App.tsx`

- [ ] **Step 1: Read current App.tsx**

Read `C:\Users\Kazuk\projects\LiveOps\services\frontend\src\App.tsx` first.

- [ ] **Step 2: Update imports**

Remove: `import { StatCard } from './components/StatCard';` and `import { ActionButton } from './components/ActionButton';`

Add:
```typescript
import { useCopilotAction, CopilotTask, useCopilotContext } from '@copilotkit/react-core';
import { RemediationCard } from './components/RemediationCard';
```

- [ ] **Step 3: Add state variables for A2UI**

After `const [acknowledged, setAcknowledged] = useState(false);`, add:
```typescript
const context = useCopilotContext();
const [remediationData, setRemediationData] = useState<{ analysis: string; buttons: any[] } | null>(null);
const [agentLoading, setAgentLoading] = useState(false);
const [agentError, setAgentError] = useState<string | null>(null);
```

- [ ] **Step 4: Register `show-remediation` action**

Add before `const handleApprove`:
```typescript
useCopilotAction({
  name: 'show-remediation',
  handler: ({ analysis, buttons }: { analysis: string; buttons: any[] }) => {
    setRemediationData({ analysis, buttons });
    setAgentLoading(false);
  },
  parameters: {
    analysis: { type: 'string', description: 'AI analysis' },
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
});
```

- [ ] **Step 5: Add CopilotTask trigger on incident**

Add a new useEffect after the existing useEffects:
```typescript
useEffect(() => {
  if (!isDown || !currentIncident) return;
  setAgentLoading(true);
  setAgentError(null);
  setRemediationData(null);
  const task = new CopilotTask({
    instructions: `[INCIDENT ALERT] Keycloak is DOWN.
Error rate: ${currentIncident.errorRate || 'N/A'}
Impacted users: ${currentIncident.impactedUsers || 'N/A'}
Last healthy: ${currentIncident.lastHealthy || 'N/A'}

Analyze the situation and call show-remediation with your analysis and recommended action buttons.`
  });
  task.run(context).catch((err: any) => {
    setAgentError(err.message || 'Agent analysis failed');
    setAgentLoading(false);
  });
}, [isDown]);
```

- [ ] **Step 6: Replace hardcoded stat grid and action buttons with RemediationCard**

In the render section, replace:
```typescript
<div className="stat-grid">
  <StatCard label="Service" value="Keycloak" color="red" />
  <StatCard label="Status" value="Down" color="red" />
  <StatCard label="Error Rate" value="98.2%" trend="+84% vs baseline" color="orange" />
  <StatCard label="Impact" value="1.2k Users" trend="Growing..." color="orange" />
</div>

<div className="remediation-card">
  <div className="section-label">Available Remediation</div>
  <div className="action-grid">
    <ActionButton label="Redeploy" variant="lilac" onClick={() => setPendingAction('redeploy-keycloak')} />
    <ActionButton label="Recover Memory" variant="mint" onClick={() => setPendingAction('recover-keycloak')} />
    <ActionButton label="Status Check" variant="blue" onClick={() => setPendingAction('get-keycloak-status')} />
    <ActionButton label="Generate Action" variant="outline" onClick={() => {}} />
  </div>
</div>
```

With:
```typescript
<RemediationCard
  analysis={remediationData?.analysis || ''}
  buttons={remediationData?.buttons || []}
  onAction={(action) => setPendingAction(action)}
  loading={agentLoading}
  error={agentError}
/>
```

- [ ] **Step 7: Verify frontend compiles**

Run: `cd C:\Users\Kazuk\projects\LiveOps\services\frontend && npx tsc -b`
Expected: no errors

- [ ] **Step 8: Commit**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git add services/frontend/src/App.tsx
git commit -m "feat: replace hardcoded stats with A2UI-generated remediation"
```

---

### Task 5: Final verification and push

- [ ] **Step 1: Verify everything builds**

```bash
cd C:\Users\Kazuk\projects\LiveOps\services\backend && npx tsc
cd C:\Users\Kazuk\projects\LiveOps\services\frontend && npx tsc -b && npx vite build
```
Expected: all pass

- [ ] **Step 2: Push**

```bash
cd C:\Users\Kazuk\projects\LiveOps
git push origin main
```
