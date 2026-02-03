# hurAI - Discovery Questionnaire Results

**Date:** 2025-12-17  
**Application:** hurAI - AI-Augmented Helpdesk System

---

## Q1: Primary Purpose & Problem Statement

**Question:** What is the primary purpose of hurAI? What problems is it intended to solve?

**Answer:**
- **Core Idea:** Create a Helpdesk system augmented with integration of channels through which support requests arrive, LLMs and KBs to assist users or support agents to resolve issues quickly and efficiently.
- **Pain Points:**
  - Helpdesk management is time-consuming and requires significant understanding and skills from support agents
  - Support requests come through multiple channels, making streamlining difficult
  - Knowledge silos between agents — previously solved issues by one agent are not accessible to others
  - High possibility of "reinventing the wheel" for recurring issues
- **Value Proposition:**
  - Removes redundancy in support operations
  - Lowers the skill/knowledge bar for support agents and end users
  - Aggregates support sessions so future similar problems can be easily resolved

---

## Q2: Users & Roles

**Question:** Who are the main users of hurAI, and what are their roles?

**Answer:**

| Role | Responsibilities | LLM Interaction |
|------|------------------|-----------------|
| **End Users/Customers** | Submit requests, attempt self-resolution | Receive guided steps from LLM for simple issues |
| **Support Agents** | Handle escalated/complex tickets | Use AI suggestions, access KB, resolve issues |
| **Administrators** | Configure system, manage KB, integrations | Set up channels, train/tune LLM responses |
| **Team Leads** | Monitor performance, manage escalations | Review analytics, quality assurance |

**Key Addition:** LLM can guide end users in resolving simple issues through guided steps (self-service).

---

## Q3: Key Features & Differentiators

**Question:** What are the key features and functionalities that hurAI must include?

**Answer:**

### Must-Have Features (MVP)
- Multi-channel ticket ingestion (Email, WhatsApp)
- LLM-powered response suggestions for agents
- Self-service chatbot with guided resolution for end users (simple issues only)
- Knowledge Base with smart search
- Session aggregation & historical ticket matching

### Unique Differentiators
- **AI-first approach** vs. bolt-on AI in competitors
- **Cross-session learning** — resolved issues improve future resolutions
- **Dual-mode LLM assistance** (user-facing + agent-facing)

---

## Q4: Use Cases & Workflows

**Question:** What are the expected use cases, user workflows, and interactions?

**Answer:**

### End User Journey
1. User submits request via preferred channel (email/WhatsApp/portal)
2. LLM analyzes the issue — if simple, attempts self-service resolution
3. User follows guided steps → Issue resolved ✓ OR escalates to agent

### Support Agent Journey
1. Agent receives pre-analyzed ticket with context & suggested solutions
2. Agent reviews similar past tickets matched by the system
3. Agent resolves issue (with LLM assistance) → Resolution logged to KB
4. If unresolved → Escalate to higher tier
5. **Additional Options:**
   - Callback with LLM live listening (real-time suggestions during call)
   - Remote session with user via screen sharing

### Admin Journey
1. Configure channel integrations (email, WhatsApp)
2. Populate/manage Knowledge Base
3. Review analytics and optimize LLM performance

---

## Q5: Performance & Scalability

**Question:** Are there any specific performance or scalability requirements?

**Answer:**

| Metric | Initial Target (MVP) | Future Scale |
|--------|----------------------|--------------|
| **Agents** | 1-5 | 50+ |
| **Tickets/Day** | ~50 | 500+ |
| **Architecture** | Single-tenant, simple stack | Multi-tenant, distributed |

---

## Q6: Platform Support

**Question:** What platforms should hurAI support?

**Answer:**

| Interface | Platform | Design Approach |
|-----------|----------|-----------------|
| **End User** | Web Application | **Mobile-first**, responsive |
| **Agent** | Web Application | Desktop-optimized |
| **Admin** | Web Application | Desktop-optimized |

**Note:** Single web codebase with responsive design optimized per user type.

---

## Q7: Integrations

**Question:** Are there any existing systems that hurAI needs to integrate with?

**Answer:**

| Category | Integration | Priority |
|----------|-------------|----------|
| **Channels** | Email (SMTP/IMAP) | Must-have (MVP) |
| | WhatsApp Business API | Must-have (MVP) |
| **Voice** | Twilio (callbacks + LLM listening) | Must-have (MVP) |
| **LLM** | Multi-model support (configurable) | Must-have (MVP) |
| | OpenAI, Anthropic, Gemini, local models | |
| **Screen Share** | Remote session support | Phase 2 |

---

## Q8: Security & Compliance

**Question:** What are the security and compliance requirements?

**Answer:**

### Core Security Requirements
- HTTPS everywhere
- Encrypted data at rest
- Role-based access control (RBAC)
- Audit logs for agent actions
- Secure API tokens for integrations

### Privacy-Critical Requirements
- **Identity Protection:** Personal information must be protected
- **PII Anonymization:** LLMs CANNOT have access to personal information of any user
- Data must be masked/tokenized before sending to LLMs
- GDPR-aware data handling

---

## Metadata

- **Questionnaire Completed:** 2025-12-17
- **Total Questions:** 8
- **Format:** Interactive Q&A with suggested answers
