import { geminiGenerate } from '../gemini.js';

export class HogwartsSynthesizerOrchestrator {

  constructor(agents) {
    this.name = 'synthesizer';
    this.agents = agents;
  }

  /**
   * The main synthesis method.
   * It gathers advice and confidence scores from all agents, then synthesizes a
   * weighted, comprehensive response.
   */

  async orchestrate(contents) {
    console.log("Synthesizer | Beginning weighted synthesis process...");

    // --- 1. Parallel Consultation ---
    // Get a response from every agent. We now expect an object with { text, agent, confidence }.
    const promises = this.agents.map(agent => agent.respond(contents));
    const agentResponses = await Promise.all(promises);

    const getResponseWithConfidence = (houseName) => {
        const response = agentResponses.find(r => r.agent === houseName);
        return {
            house: houseName.charAt(0).toUpperCase() + houseName.slice(1), // Capitalize house name
            text: response?.text || "No advice provided.",
            confidence: response?.confidence || 0.5, // Default confidence if not provided
            theme: houseName === 'gryffindor' ? 'Courage' : houseName === 'hufflepuff' ? 'Support' : houseName === 'ravenclaw' ? 'Clarity' : 'Strategy'
        };
    };

    let houseAdvice = [
        getResponseWithConfidence('gryffindor'),
        getResponseWithConfidence('hufflepuff'),
        getResponseWithConfidence('ravenclaw'),
        getResponseWithConfidence('slytherin')
    ];

    // Sort the advice by confidence score in descending order.
    houseAdvice.sort((a, b) => b.confidence - a.confidence);

    const lastUserMessage = contents[contents.length-1].parts[0].text;

    // --- 2. The Weighted Synthesis Prompt ---
    // This prompt instructs the LLM to prioritize advice based on confidence scores.
    const synthesisPrompt = `You are The Headmaster, a wise and empathetic leader. Your role is to provide a deeply insightful, synthesized response to a student by first understanding their complete situation and then weaving in the weighted advice from the four house mentors.

    Step 1: Perform a Holistic Contextual Analysis of the Conversation**
    Before you consider the mentors' advice, form your own understanding of the student's situation by analyzing the full conversation history. Weigh these signals:
    - The Immediate Problem: What is the user explicitly asking for in their most recent message? ${lastUserMessage}
    - The Underlying Emotion: What is the dominant feeling (stress, ambition, fear, confusion) driving their questions?
    - The Conversational Journey: How has their need evolved? Have they moved from a logical to an emotional state? From passive to active?

    Step 2: Synthesize the Weighted Counsel in Light of Your Analysis
    Now, consider the advice you have received from your mentors, ranked by how relevant they believe their perspective is:
    - Primary Counsel from ${houseAdvice[0].house} (Confidence: ${Math.round(houseAdvice[0].confidence * 100)}%): "${houseAdvice[0].text}"
    - Secondary Counsel from ${houseAdvice[1].house} (Confidence: ${Math.round(houseAdvice[1].confidence * 100)}%): "${houseAdvice[1].text}"
    - Tertiary Counsel from ${houseAdvice[2].house} (Confidence: ${Math.round(houseAdvice[2].confidence * 100)}%): "${houseAdvice[2].text}"
    - Final Counsel from ${houseAdvice[3].house} (Confidence: ${Math.round(houseAdvice[3].confidence * 100)}%): "${houseAdvice[3].text}"

    Your Task:
      1.  Your voice is wise but not overly formal or theatrical. Speak with clarity and warmth.
      2.  Begin with an opening that reflects your holistic analysis, showing the user you understand their complete situation.
      3.  Adopt the tone and primary focus of the mentor who provided the primary counsel.
      4.  Weave in compatible ideas from the other mentors to add nuance.
      5.  If lower-confidence advice conflicts, downplay it or frame it as a minor alternative.
      6.  Ensure the message reads cohesively and is not disjointed.
      7.  Your response must be maximum length of 2 concise paragraphs.
    `;

    // --- 3. Final Response Generation ---
    const result = await geminiGenerate({
      // We only need the user's messages for the Gemini API contents
      contents: contents.filter(c => c.role === 'user'),
      systemPrompt: synthesisPrompt,
      // No JSON schema needed here, as we want a natural language response.
    });

    const assistantMessage = result?.text || "I'm sorry, I'm having trouble pulling my thoughts together. Could you restate the problem?";
    const reason = `Synthesized a weighted response, prioritizing ${houseAdvice[0].house}'s perspective.`;
    const frameSet = { frames: { persona: { value: 'headmaster', rationale: [reason] } } };
    const debug = {
      dominantHouse: houseAdvice[0].house,
      houseAdvice: houseAdvice.map(h => ({ house: h.house, theme: h.theme, confidence: h.confidence, preview: h.text.slice(0, 140) })),
    };

    console.log(`🤖 Synthesizer | Synthesis complete. Dominant perspective: ${houseAdvice[0].house}`);

    return { assistantMessage, frameSet, agent: 'synthesizer', reasons: reason, debug };
  }
}

