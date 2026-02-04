# hurAI - UI/Vibe Coding Prompts

Prompts for generating user interface designs and interactive prototypes.

---

## 1. End User Interface (Mobile-First)

### Prompt: Support Portal Home
```
Create a mobile-first responsive web interface for hurAI end-user support portal.


Design Requirements:
- Modern, clean design with dark mode support
- Mobile-first layout (works on 375px+ screens)
- Primary actions: Submit new ticket, View my tickets, Chat with AI
- Status indicators for open tickets
- Quick access to self-service help

UI Elements:
1. Header with hurAI logo and user menu
2. Hero section with "How can we help?" search/input
3. Quick action cards (New Ticket, My Tickets, FAQ)
4. Recent tickets list with status badges
5. Floating chat button for AI assistant

Style:
- Glassmorphism cards
- Vibrant accent colors (suggest: purple/blue gradient)
- Smooth micro-animations on interactions
- Inter or Outfit font family
```

### Prompt: AI Self-Service Chat
```
Create a mobile-first chat interface for hurAI's AI self-service assistant.

Design Requirements:
- Full-screen chat on mobile, sidebar on desktop
- Conversational UI with message bubbles
- Support for guided step display (numbered steps with checkboxes)
- "Escalate to Agent" button always visible
- Typing indicators and smooth message animations

Features:
1. Message input with attachment support
2. AI responses with markdown rendering
3. Step-by-step guide cards with progress
4. Quick reply suggestion chips
5. Satisfaction rating after resolution

Conversation Example:
- User: "My internet is not working"
- AI: "I can help! Let's troubleshoot. First, try these steps:"
  [Step 1: Restart router - checkbox]
  [Step 2: Check cable connections - checkbox]
- User checks boxes, provides feedback
- AI: "Did that resolve your issue?" [Yes] [No, escalate]
```

### Prompt: Ticket Status View
```
Create a mobile-first ticket detail view for hurAI end users.

Design Requirements:
- Clean, scannable layout
- Clear status progression (Submitted → In Progress → Resolved)
- Conversation thread with agent/AI messages
- Action buttons based on ticket state

UI Elements:
1. Ticket header (ID, subject, status badge)
2. Timeline/progress indicator
3. Conversation thread (chronological)
4. Agent info card (if assigned)
5. Action buttons (Add reply, Close ticket, Escalate)
6. Attachments gallery

Status Colors:
- Open: Blue
- In Progress: Orange  
- Waiting on User: Yellow
- Resolved: Green
- Escalated: Red
```

---

## 2. Support Agent Interface (Desktop-Optimized)

### Prompt: Agent Dashboard
```
Create a desktop-optimized dashboard for hurAI support agents.

Design Requirements:
- Information-dense but not cluttered
- Dark mode friendly
- Real-time updates for new tickets
- Quick actions accessible

Layout:
1. Left sidebar: Navigation, ticket filters, queue stats
2. Main area: Ticket list with preview pane
3. Right sidebar: AI suggestions, similar tickets, KB search

Features:
- Ticket list with sorting/filtering
- Unread/priority indicators
- Quick assign/escalate actions
- Search across all tickets
- Personal productivity stats

Key Metrics to Display:
- Open tickets assigned to me
- Average resolution time
- Today's resolved count
- Pending escalations
```

### Prompt: Ticket Resolution View
```
Create a ticket resolution interface for hurAI agents with AI assistance.

Design Requirements:
- Split view: Ticket details + AI panel
- Rich text editor for responses
- One-click access to similar tickets
- Inline KB article insertion

Layout:
1. Left panel (60%): Ticket conversation thread
2. Right panel (40%): AI assistant

Right Panel Sections:
- AI Suggested Response (editable, one-click insert)
- Similar Past Tickets (expandable cards)
- Relevant KB Articles (quick insert)
- Customer Context (anonymized info)

Actions:
- Send Response
- Add Internal Note
- Escalate with Reason
- Initiate Callback
- Start Screen Share
- Mark Resolved
```

### Prompt: Voice Call Interface
```
Create a voice call interface for hurAI agents with live LLM assistance.

Design Requirements:
- Minimal distraction during calls
- Real-time transcription display
- LLM suggestions appear non-intrusively
- Quick action buttons

Layout:
1. Top: Call controls (mute, hold, end, transfer)
2. Center: Live transcription (scrolling)
3. Bottom: AI suggestions panel
4. Floating: Timer, customer info

AI Suggestions Panel:
- Real-time suggestions based on conversation
- "Suggested Response" cards
- KB article recommendations
- Next-step prompts
- Click to copy any suggestion

Visual Indicators:
- Speaking indicator (user vs agent)
- LLM processing spinner
- Suggestion confidence level
```

---

## 3. Admin Interface

### Prompt: Admin Configuration Dashboard
```
Create an admin dashboard for hurAI system configuration.

Design Requirements:
- Clean, professional admin aesthetic
- Clear navigation hierarchy
- Status indicators for integrations
- System health overview

Navigation:
1. Dashboard (overview)
2. Channels (Email, WhatsApp, Twilio)
3. LLM Configuration
4. Knowledge Base
5. Users & Roles
6. Security & Audit
7. Analytics

Dashboard Cards:
- System health status
- Active integrations with status
- Today's ticket volume
- Agent activity summary
- LLM usage/costs
- Recent alerts/issues
```

### Prompt: LLM Configuration Interface
```
Create an LLM configuration interface for hurAI administrators.

Design Requirements:
- Easy model selection and comparison
- Clear cost/performance tradeoffs
- Test prompts before deploying

Features:
1. Provider cards (OpenAI, Anthropic, Gemini, Custom)
2. Model selector with specs (speed, cost, capability)
3. Use case assignment (self-service, agent assist, summarization)
4. Prompt template editor
5. Test playground
6. Usage analytics per model

Configuration Options:
- Default model per use case
- Fallback model if primary fails
- Temperature/token settings
- Rate limits
- Cost alerts
```

---

## 4. Component Library

### Prompt: Design System
```
Create a design system/component library for hurAI application.

Requirements:
- Support both light and dark modes
- Mobile-first responsive components
- Accessibility (WCAG AA)
- Consistent spacing and typography

Components Needed:
1. Buttons (primary, secondary, ghost, icon)
2. Form inputs (text, textarea, select, checkbox, radio)
3. Cards (ticket card, suggestion card, stat card)
4. Badges (status, priority, channel)
5. Avatars (user, agent, AI)
6. Navigation (sidebar, tabs, breadcrumbs)
7. Modals and dialogs
8. Toast notifications
9. Loading states and skeletons
10. Chat bubbles (user, agent, AI)

Color Palette:
- Primary: Purple gradient (#8B5CF6 → #6366F1)
- Success: Green (#10B981)
- Warning: Amber (#F59E0B)
- Error: Red (#EF4444)
- Neutral: Slate grays

Typography:
- Headings: Outfit
- Body: Inter
- Code: JetBrains Mono
```

---

## 5. Full Application Prompts

### Prompt: Complete End User App
```
Build a complete mobile-first end-user support portal for hurAI.

Tech Stack: HTML, CSS (vanilla), JavaScript

Pages:
1. Home/Landing - Submit ticket, view recent tickets
2. New Ticket - Form with channel selection, file upload
3. My Tickets - List view with filters
4. Ticket Detail - Conversation thread, actions
5. AI Chat - Self-service assistant (simulated)

Features:
- Responsive design (mobile-first)
- Dark/light mode toggle
- Simulated AI responses in chat
- Smooth transitions and micro-animations
- Local storage for demo data

Design Style:
- Premium, modern SaaS aesthetic
- Glassmorphism cards
- Gradient accents
- Subtle shadows and depth
- Animated state changes
```

### Prompt: Complete Agent Dashboard
```
Build a complete desktop-optimized agent dashboard for hurAI.

Tech Stack: HTML, CSS (vanilla), JavaScript

Features:
1. Left sidebar navigation
2. Ticket queue with filtering
3. Ticket detail view with AI panel
4. Simulated AI suggestions
5. Knowledge Base search
6. Basic callback simulation

Interactions:
- Ticket selection and detail view
- Response composition with AI insert
- Marking tickets as resolved
- Simulated real-time updates

Design Style:
- Professional, information-rich
- Dark mode by default
- Clear visual hierarchy
- Minimal but effective animations
```
