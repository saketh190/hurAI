# hurAI - MVP Sprint Plan & User Stories

**Version:** 1.0  
**Date:** 2026-01-12  
**Status:** Sprint Planning  

---

## Project Overview

**hurAI** is an AI-augmented helpdesk system designed to streamline support operations through intelligent automation, multi-channel integration, and knowledge reuse.

### MVP Scope Summary

| Feature | Included |
|---------|----------|
| Email Channel | ✅ Yes |
| WhatsApp Channel | ✅ Yes |
| Voice/Twilio | ❌ Phase 2 |
| Self-Service (LLM) | ✅ Yes |
| Knowledge Base | ✅ Yes |
| Agent AI Assistance | ✅ Yes |
| Multi-LLM Support | ✅ Yes |
| PII Anonymization | ✅ Yes |

---

## Development Phases

```
Phase 1: Core Engine     → Build & test core model with all functionalities
Phase 2: Minimal UI      → Test core with minimal interface
Phase 3: API Layer       → Expose core via REST APIs
Phase 4: Full UI         → Build production-ready user interface
```

---

## Sprint Plan

### Sprint 1: Core Engine - LLM Integration & PII Protection
**Duration:** 2 weeks  
**Goal:** Build the multi-LLM integration layer with PII anonymization

| Story # | User Story | Priority |
|---------|-----------|----------|
| US-01 | Multi-LLM Provider Integration | High |
| US-02 | LLM Fallback Mechanism | High |
| US-03 | PII Detection & Anonymization | High |
| US-04 | PII Restoration for Agents | High |
| US-05 | Payment Data Protection | High |

---

### Sprint 2: Core Engine - Classification & Knowledge Base
**Duration:** 2 weeks  
**Goal:** Build ticket classification and knowledge base matching

| Story # | User Story | Priority |
|---------|-----------|----------|
| US-06 | Ticket Complexity Scoring | High |
| US-07 | Issue Category Classification | High |
| US-08 | Knowledge Base Article Storage | High |
| US-09 | Smart KB Search & Matching | High |
| US-10 | KB Article Auto-Draft Generation | Medium |

---

### Sprint 3: Core Engine - Self-Service Routing
**Duration:** 2 weeks  
**Goal:** Build intelligent self-service routing logic

| Story # | User Story | Priority |
|---------|-----------|----------|
| US-11 | Self-Service Routing Decision | High |
| US-12 | KB-Aware Confidence Routing | High |
| US-13 | Guided Step Generation | High |
| US-14 | Escalation Trigger Logic | High |
| US-15 | Agent Assignment Logic | Medium |

---

### Sprint 4: Minimal UI & Core Testing
**Duration:** 2 weeks  
**Goal:** Create minimal test interface and validate core engine

| Story # | User Story | Priority |
|---------|-----------|----------|
| US-16 | Minimal Test Console | High |
| US-17 | End-to-End Core Flow Testing | High |
| US-18 | LLM Response Quality Validation | High |
| US-19 | PII Protection Verification | High |
| US-20 | Routing Decision Validation | High |

---

### Sprint 5: API Layer Development
**Duration:** 2 weeks  
**Goal:** Expose core engine functionality via REST APIs

| Story # | User Story | Priority |
|---------|-----------|----------|
| US-21 | Ticket Submission API | High |
| US-22 | Self-Service Interaction API | High |
| US-23 | KB Article Retrieval API | High |
| US-24 | Agent Dashboard API | High |

---

### Sprint 6: Channel Integration APIs
**Duration:** 2 weeks  
**Goal:** Build channel ingestion for Email and WhatsApp

| Story # | User Story | Priority |
|---------|-----------|----------|
| US-25 | Email Channel Ingestion | High |
| US-26 | WhatsApp Channel Ingestion | High |
| US-27 | Channel Response Handling | High |
| US-28 | Unified Conversation Thread | High |
| US-29 | Channel Notification Delivery | very low |

---

### Sprint 7: End User UI
**Duration:** 2 weeks  
**Goal:** Build production end user interface (mobile-first)

| Story # | User Story | Priority |
|---------|-----------|----------|
| US-30 | Support Request Submission Form | High |
| US-31 | Self-Service Chat Interface | High |
| US-32 | Ticket Status Tracking View | High |
| US-33 | Ticket Detail & History View | Low |
| US-34 | Mobile-Responsive Design | Medium |

---

### Sprint 8: Agent & Admin UI
**Duration:** 2 weeks  
**Goal:** Build agent and admin dashboards

| Story # | User Story | Priority |
|---------|-----------|----------|
| US-35 | Agent Ticket Queue Dashboard | High |
| US-36 | Agent AI Assistance Panel | High |
| US-37 | Similar Tickets Suggestion View | Medium |
| US-38 | Admin LLM Configuration Panel | Low |
| US-39 | Admin KB Management Interface | High |

---

## User Stories (MVP)

---

### Sprint 1: LLM Integration & PII Protection

#### US-01: Multi-LLM Provider Integration
```
As a system administrator,
I want the system to support multiple LLM providers (OpenAI, Gemini),
So that I can choose the best model for different use cases.
```

#### US-02: LLM Fallback Mechanism
```
As a system administrator,
I want the system to automatically switch to a secondary LLM if the primary fails,
So that support operations continue without interruption.
```

#### US-03: PII Detection & Anonymization
```
As a support system,
I want to detect and anonymize personal information before sending data to LLMs,
So that user privacy is protected during AI processing.
```

#### US-04: PII Restoration for Agents
```
As a support agent,
I want to see the actual user information (name, email, phone) when viewing tickets,
So that I can communicate effectively with customers.
```

#### US-05: Payment Data Protection
```
As a system administrator,
I want payment and card details to be always masked for everyone including agents,
So that sensitive financial data remains protected.
```

---

### Sprint 2: Classification & Knowledge Base

#### US-06: Ticket Complexity Scoring
```
As a support system,
I want each incoming ticket to receive a complexity score,
So that routing decisions can be made based on issue difficulty.
```

#### US-07: Issue Category Classification
```
As a support system,
I want incoming tickets to be automatically categorized,
So that they can be routed to the appropriate team or solution.
```

#### US-08: Knowledge Base Article Storage
```
As an administrator,
I want to store and organize knowledge base articles,
So that solutions to common issues are readily available.
```

#### US-09: Smart KB Search & Matching
```
As a support system,
I want to match incoming tickets against relevant KB articles,
So that existing solutions can be suggested automatically.
```

#### US-10: KB Article Auto-Draft Generation
```
As an administrator,
I want the system to auto-generate KB article drafts from resolved tickets,
So that knowledge is captured without manual documentation effort.
```

---

### Sprint 3: Self-Service Routing

#### US-11: Self-Service Routing Decision
```
As a support system,
I want to decide whether a ticket can be resolved via self-service or needs an agent,
So that simple issues are resolved quickly and complex ones get expert help.
```

#### US-12: KB-Aware Confidence Routing
```
As a support system,
I want to attempt self-service when a KB article match is found,
So that users get solutions even for complex issues if documentation exists.
```

#### US-13: Guided Step Generation
```
As a support system,
I want to generate step-by-step resolution instructions for self-service issues,
So that users can follow clear guidance to resolve their problems.
```

#### US-14: Escalation Trigger Logic
```
As a support system,
I want to automatically escalate tickets based on time, complexity, or failed attempts,
So that users don't get stuck without proper assistance.
```

#### US-15: Agent Assignment Logic
```
As a support system,
I want to assign escalated tickets to available agents,
So that workload is distributed and tickets are handled promptly.
```

---

### Sprint 4: Minimal UI & Core Testing

#### US-16: Minimal Test Console
```
As a developer,
I want a simple console interface to test core engine functionality,
So that I can validate the system works before building the full UI.
```

#### US-17: End-to-End Core Flow Testing
```
As a developer,
I want to test the complete flow from ticket submission to resolution,
So that I can ensure all components work together correctly.
```

#### US-18: LLM Response Quality Validation
```
As a developer,
I want to verify that LLM responses are helpful and appropriate,
So that users receive quality assistance.
```

#### US-19: PII Protection Verification
```
As a developer,
I want to confirm that no PII is sent to LLMs during processing,
So that privacy requirements are met.
```

#### US-20: Routing Decision Validation
```
As a developer,
I want to test that routing decisions match expected outcomes,
So that tickets are correctly directed to self-service or agents.
```

---

### Sprint 5: API Layer Development

#### US-21: Ticket Submission API
```
As a front-end application,
I want an API to submit new support tickets,
So that tickets can be created from any client interface.
```

#### US-22: Self-Service Interaction API
```
As a front-end application,
I want an API to send and receive self-service chat messages,
So that users can interact with the AI assistant.
```

#### US-23: KB Article Retrieval API
```
As a front-end application,
I want an API to search and retrieve KB articles,
So that relevant documentation can be displayed to users.
```

#### US-24: Agent Dashboard API
```
As a front-end application,
I want APIs to fetch ticket queues and AI suggestions for agents,
So that agent dashboards can display real-time information.
```


---

### Sprint 6: Channel Integration APIs

#### US-25: Email Channel Ingestion
```
As a support system,
I want to receive and process support requests from email,
So that users can submit tickets via their preferred email workflow.
```

#### US-26: WhatsApp Channel Ingestion
```
As a support system,
I want to receive and process support requests from WhatsApp,
So that users can get help using their daily messaging app.
```

#### US-27: Channel Response Handling
```
As a support system,
I want to send responses back to users through their original channel,
So that users receive updates in a familiar format.
```

#### US-28: Unified Conversation Thread
```
As a support system,
I want all channel interactions linked to a single ticket thread,
So that context is preserved regardless of communication channel.
```

#### US-29: Channel Notification Delivery
```
As an end user,
I want to receive notifications about my ticket through my preferred channel,
So that I stay informed about ticket updates.
```

---

### Sprint 7: End User UI

#### US-30: Support Request Submission Form
```
As an end user,
I want to submit a support request through an online form,
So that I can describe my issue and get help.
```

#### US-31: Self-Service Chat Interface
```
As an end user,
I want to interact with an AI assistant in a chat interface,
So that I can try to resolve my issue before waiting for an agent.
```

#### US-32: Ticket Status Tracking View
```
As an end user,
I want to see a list of my support tickets and their status,
So that I can track the progress of my requests.
```

#### US-33: Ticket Detail & History View
```
As an end user,
I want to view the full conversation history of a specific ticket,
So that I can see what has been done and what's pending.
```

#### US-34: Mobile-Responsive Design
```
As an end user,
I want the support portal to work well on my mobile phone,
So that I can get help from any device.
```

---

### Sprint 8: Agent & Admin UI

#### US-35: Agent Ticket Queue Dashboard
```
As a support agent,
I want to see my assigned tickets in a queue dashboard,
So that I can prioritize and work on tickets efficiently.
```

#### US-36: Agent AI Assistance Panel
```
As a support agent,
I want to see AI-generated suggestions while working on a ticket,
So that I can resolve issues faster with intelligent recommendations.
```

#### US-37: Similar Tickets Suggestion View
```
As a support agent,
I want to see similar past tickets when viewing a current ticket,
So that I can learn from previous resolutions.
```

#### US-38: Admin LLM Configuration Panel
```
As an administrator,
I want to configure LLM providers and fallback settings,
So that I can optimize AI performance and reliability.
```

#### US-39: Admin KB Management Interface
```
As an administrator,
I want to review, edit, and publish KB article drafts,
So that the knowledge base stays accurate and helpful.
```

---

## Sprint Summary

| Sprint | Focus | Stories | Duration |
|--------|-------|---------|----------|
| Sprint 1 | Core: LLM + PII | 5 | 2 weeks |
| Sprint 2 | Core: Classification + KB | 5 | 2 weeks |
| Sprint 3 | Core: Self-Service Routing | 5 | 2 weeks |
| Sprint 4 | Minimal UI + Testing | 5 | 2 weeks |
| Sprint 5 | API Layer | 5 | 2 weeks |
| Sprint 6 | Channel Integration | 5 | 2 weeks |
| Sprint 7 | End User UI | 5 | 2 weeks |
| Sprint 8 | Agent/Admin UI | 5 | 2 weeks |
| **Total** | | **40 stories** | **16 weeks** |

---

## Definition of Done

- [ ] Code complete and reviewed
- [ ] Unit tests passing
- [ ] Integration tests passing (where applicable)
- [ ] Documentation updated
- [ ] Acceptance criteria verified
- [ ] No critical bugs outstanding

---

## User Roles Summary

| Role | Description |
|------|-------------|
| End User | Customer seeking support |
| Support Agent | Handles escalated/complex tickets |
| Team Lead | Monitors performance, manages escalations |
| Administrator | Configures system, manages KB, integrations |
| Developer | Builds and tests the system |
| System | The hurAI platform performing automated actions |

---

## Next Steps

1. ✅ Sprint plan created
2. 🔲 Review and approve stories with stakeholders
3. 🔲 Estimate story points for each story
4. 🔲 Set up development environment
5. 🔲 Begin Sprint 1 development
