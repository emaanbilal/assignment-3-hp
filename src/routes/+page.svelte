<script>
  import { onMount } from 'svelte';
  
  let input = '';
  let messages = [];
  let debugOpen = false;
  let replierInput = null; // { frameSet, contextCount, agent, reasons }
  let isLoading = false;
  let errorMsg = '';
  let selectedHouse = null;
  let showHouseSelection = true;
  let isSorting = false;
  let useSynthesizer = false;
  let useRouter = false;
  
  const houses = [
    { name: 'Gryffindor', color: '#B91C1C', accent: '#D97706', animal: '🦁', traits: 'For when you need the courage to take decisive action.' },
    { name: 'Hufflepuff', color: '#A16207', accent: '#92400E', animal: '🦡', traits: 'For when you need a loyal friend to offer patient support.' },
    { name: 'Ravenclaw', color: '#1E40AF', accent: '#3B82F6', animal: '🦅', traits: 'For when you need a sharp mind to analyze a complex problem.' },
    { name: 'Slytherin', color: '#065F46', accent: '#059669', animal: '🐍', traits: 'For when you need a strategic thinker to achieve your ambitions' }
  ];

  onMount(() => {});

  function selectHouse(house) {
    selectedHouse = house;
    showHouseSelection = false;
    useSynthesizer = false;
    useRouter = false;
  }

  function resetHouseSelection() {
    selectedHouse = null;
    showHouseSelection = true;
    useSynthesizer = false;
    useRouter = false;
  }

  function useSynthesizerMode() {
    useSynthesizer = true;
    selectedHouse = null;
    showHouseSelection = false;
    useRouter = false;
  }

  async function useSortingHat() {
    // Just open the chat interface with router mode
    showHouseSelection = false;
    useSynthesizer = false;
    selectedHouse = null;
    useRouter = true;
    // Don't send any initial message - let user start the conversation
  }

  async function send() {
    const content = input.trim();
    if (!content) return;
    messages = [...messages, { role: 'user', content, agent: 'User' }];
    input = '';
    isLoading = true;
    errorMsg = '';
    
    const requestBody = { history: messages };
    if (useSynthesizer) {
      requestBody.useSynthesizer = true;
    } else if (selectedHouse && !useRouter) {
      // Only use specific house if user explicitly selected it (not from router)
      requestBody.selectedHouse = selectedHouse.name;
    } else {
      // Use router mode for all other cases (including when router initially selected a house)
      requestBody.useRouter = true;
    }
    
    const res = await fetch('/api/hogwarts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    const data = await res.json();
    if (!res.ok || data?.error) {
      errorMsg = data?.error || 'Request failed';
      isLoading = false;
      return;
    }
    if (data.assistantMessage) {
      // Determine the agent name for this message
      let agentName = 'Sorting Hat';
      if (useSynthesizer) {
        agentName = 'Headmaster';
      } else if (data.replierInput?.agent) {
        const agent = data.replierInput.agent;
        if (agent === 'synthesizer') {
          agentName = 'Headmaster';
        } else {
          const house = houses.find(h => h.name.toLowerCase() === agent);
          agentName = house ? house.name : agent;
        }
      } else if (selectedHouse) {
        agentName = selectedHouse.name;
      }
      
      // Remove quotes from the response if they wrap the entire message
      let cleanMessage = data.assistantMessage;
      if (cleanMessage.startsWith('"') && cleanMessage.endsWith('"') && cleanMessage.length > 2) {
        cleanMessage = cleanMessage.slice(1, -1);
      }
      
      messages = [...messages, { role: 'assistant', content: cleanMessage, agent: agentName }];
      replierInput = data.replierInput || null;
      
      // If using router mode, update the selected house based on response but keep router mode
      if (useRouter && data.replierInput?.agent) {
        const agentName = data.replierInput.agent;
        if (agentName === 'synthesizer') {
          useSynthesizer = true;
          useRouter = false;
        } else {
          const house = houses.find(h => h.name.toLowerCase() === agentName);
          if (house) {
            selectedHouse = house;
            // Keep useRouter = true so we continue using router for future messages
          }
        }
      }
    }
    isLoading = false;
  }
</script>

<style>
  :global(:root) {
    --gryffindor-red: #B91C1C;
    --gryffindor-gold: #D97706;
    --hufflepuff-yellow: #A16207;
    --hufflepuff-black: #92400E;
    --ravenclaw-blue: #1E40AF;
    --ravenclaw-bronze: #3B82F6;
    --slytherin-green: #065F46;
    --slytherin-silver: #059669;
    --primary: #4C1D95;
    --primary-light: #7C3AED;
    --bg: #F8FAFC;
    --card-bg: #FFFFFF;
    --text-dark: #1F2937;
    --text-light: #6B7280;
    --border: #E5E7EB;
    --border-light: #F3F4F6;
  }

  :global(html, body) {
    height: 100%;
    margin: 0;
    background: var(--bg);
    color: var(--text-dark);
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-weight: 400;
    line-height: 1.6;
  }

  :global(*), :global(*::before), :global(*::after) { box-sizing: border-box; }


  .container { 
    max-width: 800px; 
    margin: 2rem auto; 
    padding: 0 1.5rem;
    position: relative;
  }

  .debug-toggle {
    position: absolute;
    top: 0;
    right: 1.5rem;
    z-index: 10;
  }

  .debug-btn {
    background: var(--border-light);
    color: var(--text-light);
    border: 1px solid var(--border);
    border-radius: 50%;
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s ease;
    padding: 0;
  }

  .debug-btn:hover {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .logo-container {
    text-align: center;
    margin-bottom: 2rem;
  }

  .logo {
    width: 150px;
    height: 150px;
    margin: 0 auto 1rem;
    background: url('/lumos-logo.png') center/contain no-repeat;
  }

  .subtitle { 
    color: var(--text-light); 
    font-size: 1.1rem; 
    margin-bottom: 2rem; 
    text-align: center;
    font-weight: 400;
  }

  .house-selection {
    margin-bottom: 2rem;
  }

  .sorting-hat-section {
    text-align: center;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
  }

  .sorting-hat-btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: all 0.2s ease;
  }

  .sorting-hat-btn:hover {
    background: var(--primary-light);
    transform: translateY(-1px);
  }

  .sorting-hat-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .house-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 1rem;
    margin-bottom: 2rem;
  }

  .house-card {
    background: var(--card-bg);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .house-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    border-color: var(--primary);
  }

  .house-animal {
    font-size: 2rem;
    margin-bottom: 0.5rem;
    display: block;
  }

  .house-name {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-dark);
  }

  .house-traits {
    font-size: 0.85rem;
    color: var(--text-light);
  }

  .selected-house {
    background: var(--card-bg);
    border: 1px solid var(--primary);
    border-radius: 12px;
    padding: 1rem;
    margin-bottom: 1rem;
    text-align: center;
  }

  .selected-house-info {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1rem;
  }

  .selected-house-animal {
    font-size: 1.5rem;
  }

  .selected-house-details h3 {
    margin: 0 0 0.25rem 0;
    color: var(--text-dark);
    font-size: 1rem;
  }

  .selected-house-details p {
    margin: 0;
    color: var(--text-light);
    font-size: 0.85rem;
  }

  .change-house-btn {
    background: var(--primary);
    color: white;
    border: none;
    padding: 0.5rem 1rem;
    border-radius: 6px;
    cursor: pointer;
    font-size: 0.85rem;
    margin-left: 1rem;
    transition: all 0.2s ease;
  }

  .change-house-btn:hover {
    background: var(--primary-light);
    transform: translateY(-1px);
  }

  .row { display: flex; gap: 0.5rem; align-items: center; }
  
  .chat {
    border-radius: 12px;
    padding: 1.5rem;
    min-height: 400px;
    max-height: 500px;
    overflow-y: auto;
    background: var(--card-bg);
    border: 1px solid var(--border);
    box-shadow: 0 2px 8px rgba(0,0,0,0.05);
    -webkit-overflow-scrolling: touch;
    margin-bottom: 1.5rem;
  }
  
  .flexcol { display: flex; flex-direction: column; gap: 1rem; }
  
  .bubble { 
    padding: 0.75rem 1rem; 
    border-radius: 12px; 
    margin: 0.5rem 0; 
    max-width: 85%; 
    white-space: pre-wrap; 
    line-height: 1.5; 
    font-size: 0.95rem;
  }
  
  .user { 
    background: var(--primary); 
    color: white; 
    align-self: flex-end; 
  }
  
  .assistant { 
    background: var(--border-light); 
    color: var(--text-dark); 
    align-self: flex-start; 
  }
  
  .meta { 
    color: var(--text-light); 
    font-size: 0.75rem; 
    margin-bottom: 0.5rem; 
    font-weight: 500;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }
  
  .house-indicator {
    font-size: 0.8rem;
    font-weight: 600;
  }

  .toolbar { 
    display: flex; 
    gap: 1rem; 
    align-items: center; 
    justify-content: space-between; 
    margin: 0.75rem 0; 
  }

  input[type="text"] {
    padding: 0.75rem 1rem; 
    border-radius: 8px; 
    border: 1px solid var(--border); 
    background: var(--card-bg);
    outline: none; 
    transition: all 0.2s ease;
    font-size: 1rem;
    font-family: inherit;
  }
  
  input[type="text"]:focus { 
    border-color: var(--primary); 
    box-shadow: 0 0 0 3px rgba(76, 29, 149, 0.1);
  }
  
  input[type="text"]::placeholder {
    color: var(--text-light);
  }

  :global(button) { 
    padding: 0.75rem 1.25rem; 
    border: 1px solid transparent; 
    border-radius: 8px; 
    background: var(--primary); 
    color: white; 
    cursor: pointer; 
    font-weight: 500; 
    font-size: 1rem;
    transition: all 0.2s ease;
    font-family: inherit;
  }
  
  :global(button:hover) { 
    background: var(--primary-light); 
    transform: translateY(-1px);
  }
  
  :global(button.secondary) { 
    background: var(--card-bg); 
    color: var(--text-dark); 
    border-color: var(--border);
  }
  
  :global(button.secondary:hover) { 
    background: var(--border-light); 
    transform: translateY(-1px);
  }
  
  .input-section {
    margin-top: 1rem;
  }
  
  .quick-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 1rem;
  }
  
  .quick-action {
    padding: 0.5rem 0.75rem;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: var(--card-bg);
    color: var(--text-dark);
    font-size: 0.85rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    white-space: nowrap;
  }
  
  .quick-action:hover {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }
  
  .send-button {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.25rem;
    border: 1px solid transparent;
    border-radius: 8px;
    background: var(--primary);
    color: white;
    cursor: pointer;
    font-weight: 500;
    font-size: 1rem;
    transition: all 0.2s ease;
  }
  
  .send-button:hover {
    background: var(--primary-light);
    transform: translateY(-1px);
  }
  
  .send-button:active {
    transform: translateY(0);
  }

  .debug { 
    background: var(--card-bg); 
    border: 1px dashed var(--border); 
    padding: 0.75rem; 
    margin-top: 0.75rem; 
    border-radius: 8px; 
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace; 
    font-size: 0.85rem; 
  }

  .error {
    background: #fff1f2;
    color: #7f1d1d;
    border: 1px solid #fecaca;
    padding: 0.6rem 0.75rem;
    border-radius: 8px;
    margin: 0.5rem 0 0.75rem 0;
  }

  .welcome-message {
    text-align: center;
    padding: 2rem 1rem;
    color: var(--text-light);
    line-height: 1.6;
  }
  
  .welcome-icon {
    font-size: 2rem;
    margin-bottom: 1rem;
    color: var(--primary);
  }
  
  .welcome-message h3 {
    color: var(--text-dark);
    font-size: 1.5rem;
    font-weight: 600;
    margin: 0 0 1rem 0;
  }
  
  .welcome-message p {
    margin: 0 0 1rem 0;
    font-size: 1rem;
  }
  
  .welcome-message p:last-child {
    margin-bottom: 0;
    font-style: italic;
    color: var(--text-light);
  }

  .typing { 
    display: inline-flex; 
    gap: 4px; 
    align-items: center; 
  }
  
  .dot { 
    width: 6px; 
    height: 6px; 
    background: var(--text-light); 
    border-radius: 50%; 
    animation: blink 1.4s infinite both; 
  }
  
  .dot:nth-child(2) { 
    animation-delay: .2s; 
  }
  
  .dot:nth-child(3) { 
    animation-delay: .4s; 
  }
  
  @keyframes blink { 
    0%, 80%, 100% { opacity: 0.2; } 
    40% { opacity: 1; } 
  }
  
  @media (max-width: 768px) {
    .house-grid { 
      grid-template-columns: repeat(2, 1fr); 
    }
  }

  @media (max-width: 640px) {
    .bubble { max-width: 92%; }
    .toolbar { gap: 0.5rem; }
    .container { margin: 1.25rem auto; }
    .house-grid { grid-template-columns: 1fr; }
    .logo { width: 120px; height: 120px; }
  }
</style>

<div class="container">
  <div class="logo-container">
    <div class="logo"></div>
    <div class="subtitle">Choose your mentor or find the best match for your needs</div>
  </div>

  <div class="debug-toggle">
    <button class="debug-btn" on:click={() => (debugOpen = !debugOpen)} title="Toggle Debug Info">
      {debugOpen ? '×' : '⚙'}
    </button>
  </div>

  {#if showHouseSelection}
    <div class="house-selection">
      <div class="sorting-hat-section">
        <h3 style="margin: 0 0 1rem 0; color: var(--text-dark);">🎩 Pick your Peer</h3>
        <p style="margin: 0 0 1rem 0; color: var(--text-light); font-size: 0.9rem;">
        Get a focused perspective from the right mentor, or a balanced view from all four.        </p>
        <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
          <button class="sorting-hat-btn" on:click={useSortingHat} disabled={isSorting}>
            {#if isSorting}
              <span style="display: inline-flex; align-items: center; gap: 0.5rem;">
                <span class="typing">
                  <span class="dot"></span>
                  <span class="dot"></span>
                  <span class="dot"></span>
                </span>
                Finding Mentor...
              </span>
            {:else}
              🎩 Find My Mentor
            {/if}
          </button>
          <button class="sorting-hat-btn" on:click={useSynthesizerMode} style="background: var(--primary-light);">
            🦉 Use All Houses (Synthesizer)
          </button>
        </div>
      </div>
      
      <div style="text-align: center; margin: 1.5rem 0; color: var(--text-light); font-size: 0.9rem;">
        or select a house mentor directly:
      </div>
      
      <div class="house-grid">
        {#each houses as house}
          <div class="house-card {house.name.toLowerCase()}" on:click={() => selectHouse(house)}>
            <span class="house-animal">{house.animal}</span>
            <div class="house-name">{house.name}</div>
            <div class="house-traits">{house.traits}</div>
          </div>
        {/each}
      </div>
    </div>
  {/if}
  {#if selectedHouse || useSynthesizer || useRouter}
    <div class="selected-house">
      <div class="selected-house-info">
        {#if useSynthesizer}
          <span class="selected-house-animal">🦉</span>
          <div class="selected-house-details">
            <h3>The Headmaster's Council</h3>
            <p>All houses working together with weighted advice</p>
          </div>
        {:else if useRouter}
          <span class="selected-house-animal">🎩</span>
          <div class="selected-house-details">
            <h3>The Sorting Hat</h3>
            <p>Currently matched with {selectedHouse?.name || 'analyzing...'}</p>
          </div>
        {:else}
          <span class="selected-house-animal">{selectedHouse.animal}</span>
          <div class="selected-house-details">
            <h3>{selectedHouse.name}</h3>
            <p>{selectedHouse.traits}</p>
          </div>
        {/if}
        <button class="change-house-btn" on:click={resetHouseSelection}>Change Mode</button>
      </div>
    </div>
  {/if}

  {#if errorMsg}
    <div class="error" role="alert">
      {errorMsg}
    </div>
  {/if}

  {#if selectedHouse || useSynthesizer || useRouter}
    <div class="chat flexcol">
      {#if messages.length === 0}
        <div class="welcome-message">
          <div class="welcome-icon">🏰</div>
          {#if useSynthesizer}
            <h3>Welcome to The Headmaster's Council!</h3>
            <p>All four house mentors are ready to provide you with comprehensive, weighted advice. The synthesizer will combine insights from Gryffindor (courage), Hufflepuff (support), Ravenclaw (clarity), and Slytherin (strategy) to give you the best possible guidance.</p>
            <p>What would you like to discuss?</p>
          {:else if selectedHouse}
            <h3>Welcome to {selectedHouse.name}!</h3>
            <p>Your {selectedHouse.name} agent is ready to help. Whether you need guidance on {selectedHouse.traits.toLowerCase()}, or any other matter, your house agent is here to assist.</p>
            <p>What would you like to discuss?</p>
          {:else if useRouter}
            <h3>Welcome to Hogwarts!</h3>
            <p>The Sorting Hat is ready to match you with the perfect house mentor for your needs. Tell me about your situation, and I'll connect you with the most suitable advisor.</p>
            <p>What would you like to discuss?</p>
          {:else}
            <h3>Welcome to Hogwarts!</h3>
            <p>The Sorting Hat is ready to match you with the perfect house mentor for your needs. Tell me about your situation, and I'll connect you with the most suitable advisor.</p>
            <p>What would you like to discuss?</p>
          {/if}
        </div>
      {/if}
      
      {#each messages as m, i}
        <div class="bubble {m.role}">
          <div class="meta">
            {#if m.role === 'user'}
              You
            {:else}
              {#if m.agent === 'Headmaster'}
                🦉 Headmaster
              {:else if m.agent === 'Sorting Hat'}
                🎩 Sorting Hat
              {:else}
                {#if m.agent === 'Gryffindor'}
                  🦁 Gryffindor
                {:else if m.agent === 'Hufflepuff'}
                  🦡 Hufflepuff
                {:else if m.agent === 'Ravenclaw'}
                  🦅 Ravenclaw
                {:else if m.agent === 'Slytherin'}
                  🐍 Slytherin
                {:else}
                  🎩 {m.agent}
                {/if}
              {/if}
            {/if}
          </div>
          <div>{m.content}</div>
        </div>
      {/each}
      {#if isLoading}
        <div class="bubble assistant">
          <div class="meta">
            {#if useSynthesizer}
              🦉 Headmaster
            {:else if useRouter && selectedHouse}
              {selectedHouse.animal} {selectedHouse.name}
            {:else if selectedHouse}
              {selectedHouse.animal} {selectedHouse.name}
            {:else}
              🎩 Sorting Hat
            {/if}
          </div>
          <div class="typing" aria-label="Assistant is typing">
            <span class="dot"></span>
            <span class="dot"></span>
            <span class="dot"></span>
          </div>
        </div>
      {/if}
    </div>

    <div class="input-section">
      <div class="quick-actions">
        {#if useSynthesizer}
          <button class="quick-action" on:click={() => input = "I have a complex problem that needs multiple perspectives"}>Complex Problem</button>
          <button class="quick-action" on:click={() => input = "I need comprehensive advice from all houses"}>All Houses Advice</button>
          <button class="quick-action" on:click={() => input = "I'm facing a major life decision"}>Life Decision</button>
          <button class="quick-action" on:click={() => input = "I need both emotional support and strategic planning"}>Mixed Support</button>
        {:else}
          <button class="quick-action" on:click={() => input = "I need help with a challenging project"}>Project Help</button>
          <button class="quick-action" on:click={() => input = "I'm feeling stuck and need guidance"}>Feeling Stuck</button>
          <button class="quick-action" on:click={() => input = "I need creative solutions"}>Creative Solutions</button>
          <button class="quick-action" on:click={() => input = "I have an ambitious goal"}>Ambitious Goal</button>
        {/if}
      </div>
      <div class="row">
        <input type="text"
          placeholder={"Tell us about your situation..."}
          bind:value={input}
          on:keydown={(e) => e.key === 'Enter' && send()}
          style="flex: 1;"
        />
        <button on:click={send} class="send-button">
          <span>Send</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22,2 15,22 11,13 2,9"></polygon>
          </svg>
        </button>
      </div>
    </div>
  {/if}

</div>

{#if debugOpen}
  <div class="debug">
    <div><strong>Messages:</strong> {messages.length}</div>
    <div><strong>Mode:</strong> {useSynthesizer ? 'Synthesizer (All Houses)' : useRouter ? `Router (Currently: ${selectedHouse?.name || 'Analyzing'})` : (selectedHouse?.name || 'None')}</div>
    {#if replierInput}
      <div style="margin-top: 0.5rem;">
        <div><strong>Context Count:</strong> {replierInput.contextCount}</div>
        <div><strong>Agent:</strong> {replierInput.agent || 'n/a'}</div>
        <div><strong>Reason:</strong> {replierInput.reasons || 'n/a'}</div>
        {#if useSynthesizer && replierInput.debug}
          <div style="margin-top: 0.35rem;">
            <div><strong>Dominant House:</strong> {replierInput.debug.dominantHouse}</div>
            <div><strong>Last User Message:</strong> {replierInput.debug.lastUserMessage}</div>
            <div style="margin-top: 0.25rem;"><strong>House Confidences:</strong></div>
            <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.35rem; margin-top: 0.25rem;">
              {#each replierInput.debug.houseAdvice as h}
                <div style="border: 1px solid var(--border); border-radius: 6px; padding: 0.35rem 0.5rem;">
                  <div style="font-weight: 600;">{h.house} <span style="color: var(--text-light); font-weight: 500;">({h.theme})</span></div>
                  <div>Confidence: {Math.round(h.confidence * 100)}%</div>
                  <div style="color: var(--text-light); font-size: 0.85rem;">“{h.preview}…”</div>
                </div>
              {/each}
            </div>
          </div>
        {/if}
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 0.5rem; margin-top: 0.35rem;">
          {#each Object.entries(replierInput.frameSet?.frames || {}) as [name, p]}
            <div><strong>{name}</strong>: {p?.value}</div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
{/if}
