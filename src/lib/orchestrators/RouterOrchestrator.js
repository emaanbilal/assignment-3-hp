import { geminiGenerate } from '../gemini.js';

// Defines the required JSON structure for the LLM's triage response.
// The 'Synthesizer' option is now included for escalation.
const SELECTION_SCHEMA = {
  type: 'OBJECT',
  properties: {
    houseName: {
      type: 'STRING',
      enum: ['Gryffindor', 'Hufflepuff', 'Ravenclaw', 'Slytherin', 'Synthesizer']
    },
    reason: { type: 'STRING' }
  },
  required: ['houseName', 'reason']
};

export class HogwartsRouterOrchestrator {

  constructor(agents, synthesizer) {
    this.name = 'hogwarts_router_orchestrator';
    this.agents = agents;
    this.synthesizer = synthesizer; // Store the synthesizer instance.
    // State to track conversational flow for intelligent escalation.
    this.currentAgent = null;
    this.turnCount = 0;
    this.agentSwitchCount = 0;
  }

  /**
   * The main orchestration method.
   * It now includes logic to decide when to call the synthesizer.
   */
  async orchestrate(contents) {
    this.turnCount++;
    const lastUserMessage = contents[contents.length - 1].parts[0].text;

    // --- 1. Prioritize Explicit User Command ---
    const explicitCommand = lastUserMessage.match(/^@(\w+)/);
    if (explicitCommand) {
      const requestedEntity = explicitCommand[1].toLowerCase();
      const entityMap = {
        'gryffindor': 'gryffindor',
        'hufflepuff': 'hufflepuff',
        'ravenclaw': 'ravenclaw',
        'slytherin': 'slytherin',
        'council': 'synthesizer',
        'headmaster': 'synthesizer'
      };
      
      const entityToCall = entityMap[requestedEntity];
      if (entityToCall) {
        const reason = `User explicitly requested @${requestedEntity}.`;
        console.log(`🤖 User Override | Routing directly to: ${entityToCall}`);
        if (entityToCall === 'synthesizer') {
            return this.synthesizer.orchestrate(contents);
        }
        this.currentAgent = entityToCall;
        return this.executeAgent(entityToCall, reason, contents);
      }
    }
    
    // --- Intelligent Trigger for Synthesizer: "The Waffling User" ---
    // If the agent has been switched multiple times recently, it's a sign the user is stuck.
    if (this.agentSwitchCount >= 2 && this.turnCount <= 6) {
        console.log("🤖 Router | Waffling detected. Escalating to Synthesizer.");
        // Reset counters after synthesis to give the new approach a fresh start.
        this.agentSwitchCount = 0; 
        this.turnCount = 0;
        return this.synthesizer.orchestrate(contents);
    }

    // --- 2. Prepare and Execute Intelligent Triage ---
    const conversationHistory = contents.map(turn => {
        if (turn.role === 'user') {
            return `User: ${turn.parts[0].text}`;
        } else {
            const agentName = turn.parts[0].functionCall?.name || this.currentAgent || 'Model';
            return `${agentName}: ${turn.parts[0].text}`;
        }
    }).join('\n');

    const orchestratorPrompt = `You are The Sorting Hat, an expert routing system. Your purpose is to perform a holistic analysis of the conversation to determine the best next step. Your output must be a precise JSON object.

      Perform a Holistic Contextual Analysis by weighing these four signals:
      1.  The Immediate Problem: What is the user explicitly asking for in their most recent message? This is the primary topic.
      2.  The Emotional Tone: What is the underlying sentiment of their message? Is it stressed, ambitious, curious, frustrated? This reveals their emotional state.
      3.  The Conversational Trajectory: How has their tone and need shifted from the start of the conversation until now? (e.g., Logical -> Emotional). This reveals their journey.
      4.  Reaction to the Current Agent: Is the user receptive to the current agent's style, or are they pushing back? This reveals what isn't working.

      **Synthesize these signals to determine the user's true current need.** The most humane response often addresses the emotional tone or trajectory, even if the user is explicitly asking for something else.

      Mentor Specialties & Escalation:
      * Gryffindor (Courage): For direct action and motivation.
      * Hufflepuff (Support): For emotional comfort.
      * Ravenclaw (Clarity): For analysis and planning.
      * Slytherin (Strategy): For long-term goals and ambition.
      * Synthesizer (The Council): Escalate ONLY for an exceptionally complex initial message.

      Conversation History:
      ${conversationHistory}

      Given your holistic analysis, which entity should respond next? Respond with a JSON object.
      ---
      Example Analysis:
      History: User started by asking Ravenclaw for a study plan. Ravenclaw provided one. User's latest message is "Okay, but what if I fail? I'm just so scared."
      Holistic Analysis:
          Immediate Problem: Fear of failure (Gryffindor/Hufflepuff).
          Emotional Tone: Anxious, stressed (Hufflepuff).
          Trajectory: Logical -> Emotional.
          Reaction: Rejecting pure logic, shifting to feelings.
     Your Output:
          {
            "houseName": "Hufflepuff",
            "reason": "Holistic Analysis: The user's explicit problem has shifted from planning to fear. The trajectory (Logical -> Emotional) confirms their primary need is now for support and comfort, not more strategy."
          } 
    `;
    
    const result = await geminiGenerate({
      contents: contents.filter(c => c.role === 'user'),
      systemPrompt: orchestratorPrompt,
      config: { responseMimeType: 'application/json', responseSchema: SELECTION_SCHEMA }
    });

    let entityToCall = 'hufflepuff'; // Safe default
    let reason = 'Defaulted to Hufflepuff due to an API error or invalid response.';

    try {
      const parsed = JSON.parse(result.text);
      entityToCall = parsed.houseName.toLowerCase();
      reason = parsed.reason;
    } catch (error) {
      console.error("Failed to parse orchestrator response, defaulting to Hufflepuff:", error);
    }
    
    // --- 3. Execute the Decision ---
    if (entityToCall === 'synthesizer') {
        console.log(`🤖 Sorting Hat | Decision: Synthesizer | Type: Initial Complexity | Reason: ${reason}`);
        return this.synthesizer.orchestrate(contents);
    }

    const decisionType = this.currentAgent === null ? 'Initial Routing' 
                       : this.currentAgent === entityToCall ? 'Continuation' 
                       : 'Intentional Switch';

    console.log(`🤖 Sorting Hat | Decision: ${entityToCall} | Type: ${decisionType} | Reason: ${reason}`);
    
    // Track when a switch occurs to detect waffling.
    if (decisionType === 'Intentional Switch') {
        this.agentSwitchCount++;
    }

    this.currentAgent = entityToCall;
    
    return this.executeAgent(entityToCall, reason, contents);
  }

  /**
   * Helper function to find and execute the chosen agent.
   */
  async executeAgent(agentName, reason, contents) {
    const agentToRespond = this.agents.find(a => a.name === agentName);
    if (!agentToRespond) {
      throw new Error(`Chosen agent '${agentName}' not found.`);
    }

    const agentResponse = await agentToRespond.respond(contents);
    const assistantMessage = agentResponse?.text || `I'm sorry, the ${agentName} agent had trouble responding.`;
    
    const frameSet = { frames: { persona: { value: agentName, rationale: [reason] } } };
    return { assistantMessage, frameSet, agent: agentName, reasons: reason };
  }
}