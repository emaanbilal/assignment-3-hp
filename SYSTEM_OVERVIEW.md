  # Unstuck AI System Overview

## System Architecture

The Unstuck AI system is a multi-agent conversational AI designed to help users overcome mental blocks, overwhelm, and procrastination. The system uses a sophisticated orchestration pattern with specialized agents and two orchestrators that work together to provide personalized, context-aware assistance.

## Core Philosophy

The system is built around the **SPEAKING Model** framework, which defines:
- **Setting**: The conversational environment
- **Participants**: The roles of AI and user
- **Ends**: The desired outcomes
- **Act Sequence**: The step-by-step process
- **Key**: The tone and approach
- **Instrumentalities**: The tools and methods used
- **Norms**: The rules and constraints
- **Genre**: The type of interaction

## Agent System

### 1. InvestigatorAgent
**Role**: Conversational front-door and context gatherer
**Aim**: Understand the user's specific situation through gentle questioning

**System Prompt Summary**:
- Acts as a curious, empathetic, and perceptive guide
- **ONLY goal**: Ask a single, gentle, open-ended question to gather more specific information
- **Key Constraints**:
  - NEVER offer solutions, advice, or validation
  - NEVER categorize or suggest actions
  - Only tool is the question
  - Must end responses with a question mark
  - Keep responses short (1-2 sentences)

**When Used**: When the user's problem is too vague or lacks sufficient context for other agents to help effectively.

### 2. OrganizerAgent
**Role**: Cognitive offloading specialist
**Aim**: Help users untangle chaotic thoughts into clear, organized categories

**System Prompt Summary**:
- Acts as a calm, focused thinking partner
- **Superpower**: Helping people untangle mental clutter into clear categories
- **Key Constraints**:
  - Do not give opinions or advice on what to do
  - Stick strictly to organizing information the user provides
  - Validate that the organization is correct
  - Use lists, bold headings, and clear language
  - Use metaphors of organization (e.g., "sorting mail," "clearing the fog")

**When Used**: When the user's primary block is cognitive confusion with a jumble of tasks that need sorting, and emotional load is low.

### 3. PermissionGiverAgent
**Role**: Emotional validation and self-compassion specialist
**Aim**: Address emotional weight of procrastination and overwhelm, reduce guilt and perfectionism

**System Prompt Summary**:
- Acts as a deeply compassionate and non-judgmental friend
- **Goal**: Validate feelings and give permission to be human—to rest, be imperfect, and start small
- **Key Constraints**:
  - No "shoulds" or "should nots"
  - No advice on how to do the task itself
  - Focus only on feelings about the task
  - Never dismiss or minimize feelings
  - Suggestions should be about mindset, not action
  - Use gentle, affirming language and metaphors of lightening a load

**When Used**: When the user's primary block is a strong, stated emotion (guilt, fear, shame, anxiety) that is the main subject.

### 4. TinyActionCoachAgent
**Role**: Momentum and embodiment specialist
**Aim**: Convert mental states into small, tangible, physical actions to break rumination cycles

**System Prompt Summary**:
- Acts as a friendly, grounded coach who believes in tiny, physical actions
- **Goal**: Suggest one concrete small action the user can take right now to create momentum
- **Key Constraints**:
  - Action must be physical, not cognitive
  - Action must be incredibly small (almost laughably so)
  - No emotional validation (that's PermissionGiver's job)
  - Focus on 'what', not 'how' (no multi-step plans)
  - Be direct and clear
  - Use active, physical verbs and reference tangible objects

**When Used**: When the user's primary block is simple inertia—the task is clear, emotion is low, but they aren't starting.

## Orchestrator System

### 1. UnstuckRouterOrchestrator
**Role**: Primary decision-making conductor
**Aim**: Analyze user messages and route to the most appropriate agent or the synthesizer

**Decision Logic**:
1. **Assess Contextual Sufficiency**:
   - **Vague problems** (e.g., "I'm stuck," "this is a mess") → Route to Investigator
   - **Specific problems** (e.g., "I need to plan a baby shower") → Choose treatment

2. **Treatment Routing**:
   - **Strong emotions** (guilt, fear, shame, anxiety) → PermissionGiver
   - **Cognitive confusion** (jumble of tasks, low emotion) → Organizer
   - **Simple inertia** (clear task, low emotion, not starting) → TinyActionCoach
   - **Complex scenarios** (all three blocks present) → Synthesizer
   - **Escalation points** (user asks "what's next?") → Synthesizer

**Key Features**:
- Uses JSON schema for structured decision-making
- Provides detailed reasoning for each routing decision
- Handles both single-agent responses and synthesizer delegation
- Includes comprehensive conversation analysis

### 2. UnstuckSynthesizerOrchestrator
**Role**: Comprehensive response synthesizer
**Aim**: Weave insights from multiple specialist agents into one cohesive, helpful response

**Process**:
1. **Parallel Agent Consultation**: Calls PermissionGiver, Organizer, and TinyActionCoach simultaneously
2. **Response Synthesis**: Combines all three responses into a unified message
3. **Integration**: Creates a natural flow that addresses heart (validation), mind (clarity), and body (action)

**Synthesis Pattern**:
- **Acknowledge & Validate** (from PermissionGiver): Address emotional needs
- **Clarify** (from Organizer): Provide mental organization
- **Act** (from TinyActionCoach): Suggest concrete next steps

**Key Features**:
- Maintains conversation history context
- Creates personalized, specific responses
- Ensures smooth transitions between different types of support
- Provides comprehensive "thought-to-action" pathways

## System Flow

1. **User Input** → UnstuckRouterOrchestrator analyzes the message
2. **Context Assessment** → Determines if more information is needed
3. **Routing Decision** → Chooses appropriate agent or synthesizer
4. **Response Generation**:
   - **Single Agent**: Direct response from specialist
   - **Synthesizer**: Parallel consultation + integrated response
5. **Response Delivery** → User receives contextually appropriate assistance

## Key Design Principles

1. **Specialization**: Each agent has a focused, specific role
2. **Context Awareness**: System considers conversation history and user state
3. **Progressive Disclosure**: Starts with investigation, moves to treatment
4. **Emotional Intelligence**: Addresses both cognitive and emotional blocks
5. **Action Orientation**: Always moves toward concrete, achievable steps
6. **Non-Judgmental Support**: Creates safe space for vulnerability
7. **Scalable Complexity**: Can handle simple or complex multi-faceted problems

## Technical Implementation

- **Language Model**: Uses Gemini for all AI responses
- **Architecture**: Modular agent system with orchestration layer
- **Communication**: JSON-structured decision making
- **Error Handling**: Graceful fallbacks and default routing
- **Debugging**: Comprehensive logging and telemetry
- **Integration**: RESTful API with Svelte frontend

This system represents a sophisticated approach to AI-assisted problem-solving that combines emotional intelligence, cognitive science, and practical action guidance to help users overcome mental blocks and move forward with their goals.
