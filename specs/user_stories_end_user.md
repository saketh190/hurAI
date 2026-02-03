# hurAI - End User Stories

**Version:** 1.0  
**Date:** 2025-12-17  
**Persona:** End User (Customer seeking support)

---

## 1. Submitting Support Requests via Different Channels

### 1.1 Web Portal Submission
**As an** end user,  
**I want to** submit a support request through the web portal,  
**so that** I can get help with my issue using my preferred browser.

**Acceptance Criteria:**
- [ ] User can access the support portal without authentication for initial submission
- [ ] Form includes subject, description, and category fields
- [ ] User can attach files (images, documents, screenshots)
- [ ] Confirmation is displayed with a ticket ID after submission
- [ ] Mobile-first responsive design works on all devices

---

### 1.2 Email Submission
**As an** end user,  
**I want to** submit a support request by sending an email,  
**so that** I can use my familiar email workflow without visiting a portal.

**Acceptance Criteria:**
- [ ] User can email a designated support address (e.g., support@company.com)
- [ ] Email subject becomes ticket subject
- [ ] Email body becomes ticket description
- [ ] Attachments are automatically linked to the ticket
- [ ] Auto-reply confirms ticket creation with ticket ID

---

### 1.3 WhatsApp Submission
**As an** end user,  
**I want to** submit a support request via WhatsApp,  
**so that** I can get help using the messaging app I already use daily.

**Acceptance Criteria:**
- [ ] User can message the company's WhatsApp Business number
- [ ] Initial message creates a new ticket
- [ ] Images and documents sent via WhatsApp are attached to the ticket
- [ ] Confirmation message is sent with ticket reference
- [ ] Conversation history is preserved for context

---

## 2. LLM-Guided Self-Service Resolution

### 2.1 Initiating Self-Service
**As an** end user,  
**I want to** interact with an AI assistant when I submit a request,  
**so that** I can potentially resolve simple issues immediately without waiting for an agent.

**Acceptance Criteria:**
- [ ] AI assistant automatically engages after ticket submission
- [ ] AI analyzes the issue and determines if self-service is possible
- [ ] For simple issues, AI offers guided resolution
- [ ] For complex issues, AI informs user that an agent will assist
- [ ] User can opt out of self-service at any time

---

### 2.2 Following Guided Steps
**As an** end user,  
**I want to** follow step-by-step instructions provided by the AI,  
**so that** I can troubleshoot and resolve my issue on my own.

**Acceptance Criteria:**
- [ ] AI presents numbered, clear steps one at a time
- [ ] Each step has a checkbox for user to confirm completion
- [ ] AI asks for feedback after each step ("Did that help?")
- [ ] User can request clarification on any step
- [ ] Steps are mobile-friendly with clear formatting

---

### 2.3 Providing Feedback During Self-Service
**As an** end user,  
**I want to** tell the AI whether each step worked or not,  
**so that** the AI can adjust its guidance accordingly.

**Acceptance Criteria:**
- [ ] "This worked" / "This didn't work" quick response options
- [ ] AI adapts next steps based on feedback
- [ ] If multiple steps fail, AI offers escalation to agent
- [ ] Feedback is logged for improving future suggestions

---

### 2.4 Self-Service Resolution Confirmation
**As an** end user,  
**I want to** confirm that my issue is resolved after self-service,  
**so that** the ticket can be closed and I don't receive unnecessary follow-ups.

**Acceptance Criteria:**
- [ ] AI asks "Is your issue resolved?" after completing steps
- [ ] Quick response buttons: "Yes, resolved" / "No, need more help"
- [ ] If resolved, user can optionally rate the experience
- [ ] Ticket is automatically marked as resolved
- [ ] Summary of resolution is saved for future reference

---

## 3. Tracking Ticket Status

### 3.1 Viewing Ticket List
**As an** end user,  
**I want to** see a list of all my support tickets,  
**so that** I can track the status of my open and past requests.

**Acceptance Criteria:**
- [ ] User can log in to view their tickets
- [ ] List shows ticket ID, subject, status, and last update
- [ ] Tickets are sorted by most recent activity
- [ ] Filter options: All, Open, Resolved, Escalated
- [ ] Search functionality to find specific tickets

---

### 3.2 Viewing Ticket Details
**As an** end user,  
**I want to** view the full conversation and status of a specific ticket,  
**so that** I can see what has been done and what's pending.

**Acceptance Criteria:**
- [ ] Full conversation thread (user messages, AI responses, agent replies)
- [ ] Current status with visual indicator (badge/color)
- [ ] Assigned agent information (if applicable)
- [ ] Timestamps for all activities
- [ ] Attached files are viewable/downloadable

---

### 3.3 Receiving Status Notifications
**As an** end user,  
**I want to** receive notifications when my ticket status changes,  
**so that** I stay informed without manually checking.

**Acceptance Criteria:**
- [ ] Email notification on status change
- [ ] WhatsApp notification (if original channel was WhatsApp)
- [ ] Notification includes: ticket ID, new status, summary
- [ ] Link to view full ticket details
- [ ] User can configure notification preferences

---

### 3.4 Adding Information to Existing Ticket
**As an** end user,  
**I want to** add more information or reply to an existing ticket,  
**so that** I can provide updates or answer agent questions.

**Acceptance Criteria:**
- [ ] Reply button on ticket detail page
- [ ] Reply via email (same thread) updates the ticket
- [ ] Reply via WhatsApp (same conversation) updates the ticket
- [ ] File attachments can be added to replies
- [ ] Agent is notified of new user response

---

## 4. Escalating to Human Agent

### 4.1 Requesting Escalation During Self-Service
**As an** end user,  
**I want to** escalate to a human agent when self-service isn't working,  
**so that** I can get expert help for my issue.

**Acceptance Criteria:**
- [ ] "Talk to an agent" button always visible during self-service
- [ ] One-click escalation without losing conversation context
- [ ] User can optionally explain why self-service didn't work
- [ ] Confirmation that request is queued for an agent
- [ ] Estimated wait time shown (if available)

---

### 4.2 Automatic Escalation
**As an** end user,  
**I want** the system to automatically escalate my issue if self-service fails repeatedly,  
**so that** I don't get stuck in an unhelpful loop.

**Acceptance Criteria:**
- [ ] System detects when user marks multiple steps as "didn't work"
- [ ] System detects frustration signals (e.g., repeated questions)
- [ ] Automatic escalation with user notification
- [ ] All context is preserved for the agent
- [ ] User is informed of the escalation reason

---

### 4.3 Escalation for Complex Issues
**As an** end user,  
**I want** the AI to recognize when my issue is too complex for self-service,  
**so that** I'm immediately routed to an agent without wasting time.

**Acceptance Criteria:**
- [ ] AI classifies issue complexity upon submission
- [ ] Complex issues skip self-service and go directly to queue
- [ ] User is informed: "This requires agent assistance"
- [ ] Expected response time is communicated
- [ ] User can still provide additional context while waiting

---

## 5. Receiving Callbacks from Agents

### 5.1 Requesting a Callback
**As an** end user,  
**I want to** request that an agent calls me back,  
**so that** I can explain my issue verbally for faster resolution.

**Acceptance Criteria:**
- [ ] "Request callback" option on ticket or during chat
- [ ] User provides phone number and preferred time
- [ ] Confirmation of callback request with estimated time
- [ ] User can cancel or reschedule callback
- [ ] SMS/notification before agent calls

---

### 5.2 Receiving the Callback
**As an** end user,  
**I want to** receive a call from an agent at my preferred time,  
**so that** I can discuss my issue without being on hold.

**Acceptance Criteria:**
- [ ] Agent calls at scheduled time (or within a window)
- [ ] Caller ID shows company name/number
- [ ] Agent has full ticket context when calling
- [ ] User doesn't need to repeat issue details
- [ ] Call quality is clear and professional

---

### 5.3 Post-Call Summary
**As an** end user,  
**I want to** receive a summary of what was discussed/resolved during the call,  
**so that** I have a record for future reference.

**Acceptance Criteria:**
- [ ] Summary added to ticket after call ends
- [ ] Key points and resolutions documented
- [ ] Any follow-up actions are listed
- [ ] Summary sent via email/WhatsApp notification
- [ ] User can add corrections or comments

---

## 6. Participating in Screen-Sharing Sessions

### 6.1 Accepting Screen-Share Invitation
**As an** end user,  
**I want to** accept a screen-sharing invitation from an agent,  
**so that** they can see my issue directly and guide me to a solution.

**Acceptance Criteria:**
- [ ] Invitation appears as clickable link in chat/portal
- [ ] Clear explanation of what screen sharing entails
- [ ] One-click to join (browser-based, no install required)
- [ ] Permission prompt before sharing starts
- [ ] User can decline or postpone

---

### 6.2 Sharing Screen with Agent
**As an** end user,  
**I want to** share my screen with a support agent,  
**so that** they can see exactly what I'm experiencing.

**Acceptance Criteria:**
- [ ] Option to share full screen or specific window/tab
- [ ] Visual indicator that sharing is active
- [ ] Agent can see but not control (view-only by default)
- [ ] User can pause or stop sharing at any time
- [ ] Works on mobile (mobile screen sharing)

---

### 6.3 Receiving Remote Guidance
**As an** end user,  
**I want** the agent to highlight or annotate my screen during sharing,  
**so that** I can follow their visual instructions easily.

**Acceptance Criteria:**
- [ ] Agent can draw/highlight areas on shared screen
- [ ] Annotations are visible but non-intrusive
- [ ] Agent can point to specific buttons/elements
- [ ] Voice communication during screen share
- [ ] No interference with user's ability to interact

---

### 6.4 Ending Screen-Share Session
**As an** end user,  
**I want to** end the screen-sharing session when we're done,  
**so that** my privacy is protected afterward.

**Acceptance Criteria:**
- [ ] Clear "End sharing" button
- [ ] Sharing stops immediately upon click
- [ ] Confirmation that session has ended
- [ ] No residual access by agent after session
- [ ] Session summary added to ticket

---

## 7. General Experience

### 7.1 Mobile-First Experience
**As an** end user,  
**I want to** access all support features from my mobile phone,  
**so that** I can get help anytime, anywhere.

**Acceptance Criteria:**
- [ ] All pages are responsive and mobile-optimized
- [ ] Touch-friendly buttons and inputs
- [ ] Fast loading on mobile networks
- [ ] Works on iOS and Android browsers
- [ ] No horizontal scrolling required

---

### 7.2 Seamless Channel Switching
**As an** end user,  
**I want to** switch between channels (web, email, WhatsApp) without losing context,  
**so that** I can use whichever channel is convenient at the moment.

**Acceptance Criteria:**
- [ ] All channels linked to same ticket
- [ ] Conversation history visible regardless of channel
- [ ] Can start on WhatsApp, continue on web portal
- [ ] Attachments from all channels accessible
- [ ] Agent sees unified conversation view

---

### 7.3 Rating Support Experience
**As an** end user,  
**I want to** rate my support experience after resolution,  
**so that** I can provide feedback and help improve the service.

**Acceptance Criteria:**
- [ ] Rating prompt after ticket marked resolved
- [ ] Simple 1-5 star rating
- [ ] Optional text feedback field
- [ ] Can rate AI self-service and agent support separately
- [ ] Thank you message after submitting feedback

---

## Story Map Summary

| Epic | Stories Count | Priority |
|------|---------------|----------|
| Multi-Channel Submission | 3 | High |
| Self-Service Resolution | 4 | High |
| Ticket Tracking | 4 | High |
| Escalation to Agent | 3 | High |
| Callbacks | 3 | Medium |
| Screen Sharing | 4 | Medium |
| General Experience | 3 | High |
| **Total** | **24** | |

---

## Next Steps
1. Review and prioritize stories for MVP
2. Estimate story points
3. Group into sprints
4. Create detailed acceptance test cases
