# hurAI - Development Prompts

Prompts for generating detailed specifications, user stories, and development tasks.

---

## 1. User Stories Generation

### Prompt: End User Stories
```
Generate user stories for hurAI helpdesk system from the END USER perspective.

Context:
- hurAI is an AI-augmented helpdesk with Email, WhatsApp, and Twilio voice channels
- End users can attempt self-service resolution for simple issues via LLM guidance
- Complex issues are escalated to support agents
- Mobile-first responsive web interface

Generate user stories in the format:
"As an [end user], I want to [action], so that [benefit]"

Cover these scenarios:
1. Submitting a support request via different channels
2. Following LLM-guided self-service steps
3. Tracking ticket status
4. Escalating to a human agent
5. Receiving callbacks from agents
6. Participating in screen-sharing sessions
```

### Prompt: Support Agent Stories
```
Generate user stories for hurAI helpdesk system from the SUPPORT AGENT perspective.

Context:
- Agents receive pre-analyzed tickets with AI-generated context and suggestions
- System shows similar past tickets and their resolutions
- Agents can initiate Twilio callbacks with LLM listening in real-time
- Agents can start screen-sharing sessions with users
- Unresolved tickets can be escalated

Generate user stories in the format:
"As a [support agent], I want to [action], so that [benefit]"

Cover these scenarios:
1. Viewing and prioritizing incoming tickets
2. Using AI suggestions to resolve tickets
3. Searching past tickets and knowledge base
4. Initiating voice callbacks with real-time LLM assistance
5. Starting remote screen-sharing sessions
6. Escalating tickets
7. Logging resolutions to knowledge base
```

### Prompt: Admin Stories
```
Generate user stories for hurAI helpdesk system from the ADMINISTRATOR perspective.

Context:
- Admins configure channel integrations (Email, WhatsApp, Twilio)
- Admins manage the Knowledge Base
- Admins configure multi-LLM support (OpenAI, Anthropic, Gemini, etc.)
- Admins manage user roles and permissions (RBAC)
- Admins review system analytics

Generate user stories covering:
1. Channel configuration and management
2. LLM model configuration and selection
3. Knowledge Base management
4. User/role management
5. Security and audit settings
6. Analytics and reporting
```

---

## 2. Technical Specifications

### Prompt: API Design
```
Design a RESTful API specification for hurAI helpdesk system.

Requirements:
- Multi-channel ticket ingestion (Email, WhatsApp)
- LLM integration with PII anonymization
- Knowledge Base CRUD operations
- User authentication and RBAC
- Ticket lifecycle management (create, assign, escalate, resolve)
- Agent-to-user communication (callbacks, screen sharing)

Include:
1. Resource endpoints with HTTP methods
2. Request/response schemas
3. Authentication mechanisms
4. Rate limiting considerations
5. Error handling patterns

Technologies: Modern web stack, RESTful design, JWT authentication
```

### Prompt: Database Schema
```
Design a database schema for hurAI helpdesk system.

Entities needed:
1. Users (end users, agents, admins, team leads)
2. Tickets (with multi-channel source tracking)
3. Messages/Conversations (threaded per ticket)
4. Knowledge Base Articles
5. LLM Configurations
6. Channel Integrations
7. Audit Logs
8. Session History (for cross-session learning)

Requirements:
- Support ticket escalation workflow
- Track similar/related tickets
- Store anonymized versions of messages for LLM
- RBAC permissions model
- Soft deletes for GDPR compliance

Provide:
1. Entity-relationship diagram description
2. Table definitions with columns and types
3. Index recommendations
4. Data retention policies
```

### Prompt: LLM Integration Architecture
```
Design the LLM integration architecture for hurAI helpdesk system.

Requirements:
1. Multi-LLM support (OpenAI, Anthropic, Gemini, local models)
2. Configurable model selection per use case
3. PII anonymization BEFORE sending to LLM
4. Real-time voice transcription integration (Twilio)
5. Self-service guided resolution for end users
6. Agent assistance with suggestions and similar tickets

Design components:
1. LLM abstraction layer for multi-provider support
2. PII detection and anonymization pipeline
3. Context management for conversations
4. Prompt templates for different use cases
5. Response caching and optimization
6. Fallback handling if LLM fails
7. Token usage tracking and cost management
```

---

## 3. Feature Specifications

### Prompt: Self-Service Resolution Feature
```
Write a detailed feature specification for hurAI's Self-Service Resolution system.

Overview:
- LLM-powered chatbot guides end users to resolve simple issues
- Complex issues are automatically escalated to human agents
- Guided step-by-step troubleshooting

Specify:
1. User flow (entry to resolution or escalation)
2. Issue classification logic (simple vs complex)
3. LLM prompt strategy for guided troubleshooting
4. Escalation triggers and handoff process
5. Success metrics and KPIs
6. Edge cases and error handling
7. Mobile-first UI requirements
```

### Prompt: Live LLM Call Assistance Feature
```
Write a detailed feature specification for hurAI's Voice Call with Live LLM Assistance.

Overview:
- Agent initiates callback to user via Twilio
- LLM listens to conversation in real-time
- LLM provides suggestions to agent during the call
- Conversation is logged and can improve future suggestions

Specify:
1. Call initiation workflow
2. Real-time transcription requirements
3. LLM processing pipeline during calls
4. Agent UI for viewing suggestions
5. PII handling during voice conversations
6. Post-call processing and knowledge extraction
7. Technical requirements (latency, accuracy)
```

### Prompt: Cross-Session Learning Feature
```
Write a detailed feature specification for hurAI's Cross-Session Learning system.

Overview:
- Resolved tickets are indexed for future similarity matching
- When new tickets arrive, system finds similar past resolutions
- Agents see related tickets and what worked before
- Knowledge Base is auto-populated from successful resolutions

Specify:
1. Ticket indexing strategy (embeddings, keywords, categories)
2. Similarity matching algorithm
3. Relevance scoring and ranking
4. Agent UI for viewing similar tickets
5. Auto-KB article generation workflow
6. Feedback loop for improving matches
7. Privacy considerations (no PII in indexed data)
```

---

## 4. Security Specifications

### Prompt: PII Anonymization System
```
Design the PII Anonymization system for hurAI.

Critical Requirement: LLMs must NEVER have access to personal user information.

Design:
1. PII detection methods (regex, NER, ML-based)
2. Types of PII to detect (name, email, phone, address, IDs, etc.)
3. Anonymization techniques (masking, tokenization, pseudonymization)
4. Token mapping for context restoration
5. Integration points in the data pipeline
6. Handling edge cases (partial PII, non-standard formats)
7. Audit logging for PII access
8. Testing and validation approach
```

### Prompt: RBAC Implementation
```
Design the Role-Based Access Control system for hurAI.

Roles:
- End User: Submit/view own tickets
- Support Agent: Handle tickets, use AI features, access KB
- Team Lead: Monitor agents, manage escalations, view analytics
- Administrator: Full system access, configuration, user management

Define:
1. Permission matrix per role
2. Resource-level access controls
3. Feature-level access controls
4. API endpoint protection
5. UI element visibility rules
6. Role hierarchy and inheritance
7. Custom permission overrides
```

---

## 5. Testing Specifications

### Prompt: Test Plan
```
Create a comprehensive test plan for hurAI helpdesk system.

Cover:
1. Unit testing strategy per component
2. Integration testing for channel integrations
3. E2E testing for user journeys
4. LLM response quality testing
5. PII anonymization validation
6. Performance testing (50 tickets/day, 5 agents)
7. Security testing (penetration, OWASP)
8. Accessibility testing (mobile-first)

Include:
- Test case categories
- Priority levels
- Automation recommendations
- CI/CD integration points
```
