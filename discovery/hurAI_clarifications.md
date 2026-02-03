# hurAI - Clarifications & Decisions

**Date:** 2026-01-08  
**Status:** Requirements Clarified

---

## Summary of Decisions

All gaps from the discovery summary report have been addressed. Below are the finalized decisions.

---

## 1. PII Anonymization Scope ✅

| Field Type | Visible to LLM? | Visible to Agents? |
|------------|-----------------|-------------------|
| Name, Email, Phone, Address, Account ID, IP | ❌ Anonymized | ✅ Yes |
| Credit Card / Payment Info | ❌ Anonymized | ❌ Anonymized |

**Decision:** Reversible anonymization for most PII (agents see real data, LLM sees tokens). Payment/card details are **always anonymized for everyone** including agents.

---

## 2. LLM Configuration ✅

| Setting | Decision |
|---------|----------|
| Configuration Access | **Admins + Team Leads** can configure LLM models |
| Fallback Logic | **Yes** — Auto-switch to secondary model if primary fails |

---

## 3. WhatsApp Business API ✅

| Setting | Decision |
|---------|----------|
| Existing Account | **Yes** — Already have WhatsApp Business account |
| Message Volume (MVP) | **~1,500 conversations/month** (50 tickets/day × 30 days) |

---

## 4. Twilio Voice Features ✅

| Feature | Decision |
|---------|----------|
| Voice/Callbacks | **Deferred to Phase 2** — Not in MVP |
| Call Recording | **Skipped** — Voice not in scope for MVP |
| Transcription | **Skipped** — Voice not in scope for MVP |

> [!NOTE]
> **MVP Channels:** Email + WhatsApp only. Voice can be added in Phase 2.

---

## 5. Knowledge Base ✅

| Setting | Decision |
|---------|----------|
| KB Population | **Hybrid** — Auto-generate drafts from resolved tickets, humans review and publish |
| KB Editing | **Admins only** — Admins review drafts and edit/publish KB articles |

---

## 6. Self-Service Scope ✅

| Setting | Decision |
|---------|----------|
| Issue Classification | **Score-based** — Each ticket gets a complexity score |
| Self-Service Logic | **KB-aware confidence** — If answer exists in KB, attempt self-service regardless of complexity. Otherwise, use confidence threshold. |

**Smart Routing Logic:**
```
IF KB_match_found:
    → Attempt self-service (even for complex issues)
ELSE IF confidence_score >= threshold:
    → Attempt self-service
ELSE:
    → Route to agent
```

---

## 7. Escalation Rules ✅

| Setting | Decision |
|---------|----------|
| Escalation Triggers | **Multiple triggers:** Time-based, Complexity score, Multiple failed attempts |
| User-Requested Escalation | **Not included** — Escalation is system-driven |
| SLA Requirements | **Deferred** — To be configured later |

### Automatic Escalation Triggers:
1. ⏱️ **Time-based** — Ticket open > X hours without resolution
2. 📊 **Complexity score** — Issue exceeds agent capability threshold  
3. 🔄 **Multiple attempts** — Agent tried X times without success

---

## MVP Scope Summary

| Feature | In MVP? |
|---------|---------|
| Email Channel | ✅ Yes |
| WhatsApp Channel | ✅ Yes |
| Voice/Twilio | ❌ Phase 2 |
| Self-Service (LLM) | ✅ Yes |
| Knowledge Base | ✅ Yes |
| Agent AI Assistance | ✅ Yes |
| Multi-LLM Support | ✅ Yes |
| PII Anonymization | ✅ Yes |

---

## Next Steps

1. ✅ ~~Clarify gaps~~ — All questions answered
2. 🔲 Create technical architecture design
3. 🔲 Design database schema
4. 🔲 Create API specifications
5. 🔲 Build UI prototypes
6. 🔲 Begin development

