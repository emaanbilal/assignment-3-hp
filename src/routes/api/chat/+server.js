import { json } from '@sveltejs/kit';
import { UnstuckRouterOrchestrator } from '$lib/orchestrators/UnstuckRouterOrchestrator.js';
import { UnstuckSynthesizerOrchestrator } from '$lib/orchestrators/UnstuckSynthesizerOrchestrator.js';
import { InvestigatorAgent } from '$lib/agents/InvestigatorAgent.js';
import { PermissionGiverAgent } from '$lib/agents/PermissionGiverAgent.js';
import { OrganizerAgent } from '$lib/agents/OrganizerAgent.js';
import { TinyActionCoachAgent } from '$lib/agents/TinyActionAgent.js';

/**
 * Handle chat POST requests for a single-turn pipeline execution.
 *
 * Parameters: ({ request }) SvelteKit request wrapper.
 * Returns: JSON response with pipeline output or error.
 */
export async function POST({ request }) {
  const body = await request.json();
  const { history } = body || {};

  if (!Array.isArray(history)) {
    return json({ error: 'history array is required' }, { status: 400 });
  }

  try {
    // Create all agents
    const investigatorAgent = new InvestigatorAgent();
    const permissionGiverAgent = new PermissionGiverAgent();
    const organizerAgent = new OrganizerAgent();
    const tinyActionCoachAgent = new TinyActionCoachAgent();
    
    // Create synthesizer orchestrator with all agents
    const synthesizer = new UnstuckSynthesizerOrchestrator([
      permissionGiverAgent,
      organizerAgent,
      tinyActionCoachAgent
    ]);
    
    // Create main router orchestrator with agents and synthesizer
    const orchestrator = new UnstuckRouterOrchestrator([
      investigatorAgent,
      permissionGiverAgent,
      organizerAgent,
      tinyActionCoachAgent
    ], synthesizer);
    
    const contents = history.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
    
    const { assistantMessage, frameSet, agent, reasons } = await orchestrator.orchestrate(contents);
    
    return json({ assistantMessage, replierInput: { frameSet, contextCount: history.length, agent, reasons } });
  } catch (err) {
    const msg = String(err?.message || err || '').toLowerCase();
    if (msg.includes('gemini_api_key') || msg.includes('gemini') || msg.includes('api key')) {
      return json({ error: 'Gemini API key not found' }, { status: 400 });
    }
    return json({ error: 'Pipeline error', details: String(err?.message || err) }, { status: 500 });
  }
}
