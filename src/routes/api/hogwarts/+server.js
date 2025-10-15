import { json } from '@sveltejs/kit';
import { HogwartsRouterOrchestrator } from '$lib/orchestrators/RouterOrchestrator.js';
import { HogwartsSynthesizerOrchestrator } from '$lib/orchestrators/SynthesizerOrchestrator.js';
import { GryffindorAgent } from '$lib/agents/GryffindorAgent.js';
import { HufflepuffAgent } from '$lib/agents/HufflepuffAgent.js';
import { RavenclawAgent } from '$lib/agents/RavenclawAgent.js';
import { SlytherinAgent } from '$lib/agents/SlytherinAgent.js';

/**
 * Handle Hogwarts chat POST requests with router and synthesizer options.
 *
 * Parameters: ({ request }) SvelteKit request wrapper.
 * Returns: JSON response with pipeline output or error.
 */
export async function POST({ request }) {
  const body = await request.json();
  const { history, useRouter = false, useSynthesizer = false, selectedHouse = null } = body || {};

  if (!Array.isArray(history)) {
    return json({ error: 'history array is required' }, { status: 400 });
  }

  try {
    // Create all house agents
    const gryffindorAgent = new GryffindorAgent();
    const hufflepuffAgent = new HufflepuffAgent();
    const ravenclawAgent = new RavenclawAgent();
    const slytherinAgent = new SlytherinAgent();
    
    const agents = [gryffindorAgent, hufflepuffAgent, ravenclawAgent, slytherinAgent];
    
    // Create synthesizer orchestrator with all agents
    const synthesizer = new HogwartsSynthesizerOrchestrator(agents);
    
    const contents = history.map((m) => ({ role: m.role === 'user' ? 'user' : 'model', parts: [{ text: m.content }] }));
    
    let result;
    
    if (useSynthesizer) {
      // Use synthesizer directly
      result = await synthesizer.orchestrate(contents);
    } else if (selectedHouse) {
      // Use specific house agent
      const houseAgent = agents.find(agent => agent.name === selectedHouse.toLowerCase());
      if (!houseAgent) {
        return json({ error: `House agent '${selectedHouse}' not found` }, { status: 400 });
      }
      const agentResponse = await houseAgent.respond(contents);
      result = {
        assistantMessage: agentResponse.text,
        frameSet: { frames: { persona: { value: selectedHouse.toLowerCase(), rationale: [`User selected ${selectedHouse} house`] } } },
        agent: selectedHouse.toLowerCase(),
        reasons: `User selected ${selectedHouse} house`
      };
    } else if (useRouter) {
      // Use router orchestrator
      const router = new HogwartsRouterOrchestrator(agents, synthesizer);
      result = await router.orchestrate(contents);
    } else {
      // Default to Hufflepuff (most supportive)
      const agentResponse = await hufflepuffAgent.respond(contents);
      result = {
        assistantMessage: agentResponse.text,
        frameSet: { frames: { persona: { value: 'hufflepuff', rationale: ['Defaulted to Hufflepuff house'] } } },
        agent: 'hufflepuff',
        reasons: 'Defaulted to Hufflepuff house'
      };
    }
    
    return json({ 
      assistantMessage: result.assistantMessage, 
      replierInput: { 
        frameSet: result.frameSet, 
        contextCount: history.length, 
        agent: result.agent, 
        reasons: result.reasons,
        debug: result.debug
      } 
    });
  } catch (err) {
    const msg = String(err?.message || err || '').toLowerCase();
    if (msg.includes('gemini_api_key') || msg.includes('gemini') || msg.includes('api key')) {
      return json({ error: 'Gemini API key not found' }, { status: 400 });
    }
    return json({ error: 'Pipeline error', details: String(err?.message || err) }, { status: 500 });
  }
}
