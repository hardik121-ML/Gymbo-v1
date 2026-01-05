# Gymbo PRD v1.1 (Cleaned)

# Product Requirements Document (PRD)

## Gymbo: Punch Card Tracker for Personal Trainers

**Version**: 1.1 (MVP)  
**Date**: December 31, 2024  
**Status**: Final

---

## 🎯 Critical Path (MVP Launch)

The minimum tickets required for Sarfaraz to start using Gymbo:

| Phase | Tickets | Description |
| -- | -- | -- |
| **1. Foundation** | MAT-58 to MAT-66 | Project setup, database, Supabase |
| **2. Auth** | MAT-67 to MAT-71 | Phone/PIN login system |
| **3. Clients** | MAT-72 to MAT-74 | Client list, add, detail pages |
| **4. Punch** | MAT-75 to MAT-79 | Core punch functionality |
| **5. Payments** | MAT-80 to MAT-83 | Payment logging |
| **6. Balance** | MAT-84 to MAT-86 | Balance display & alerts |

**Defer if needed:** Contact picker (MAT-87), Edit flows (MAT-88-89), Audit UI (MAT-90-91), PDF export (MAT-92-95), Polish (MAT-96-98)

---

## 1\. Situation / Context

### Problem Statement

Independent personal trainers in India operate as mobile gig workers, traveling to clients' homes for one-on-one sessions. They manage 10-50 clients over time, with prepaid class packages and variable per-client pricing.

Currently, trainers like Sarfaraz rely on **memory** to track:

* How many classes each client has remaining
* When payments are due
* Whether clients have gone into negative balance (credit)
* Historical class records for trust/disputes

This mental overhead is error-prone, creates anxiety, and erodes client trust when records are disputed.

### Opportunity

A lightweight, mobile-first punch card system that serves as a "second brain" for class and payment tracking. No scheduling, no client-facing app, no billing automation—just accurate record-keeping that the trainer controls.

---

## 2\. User Personas

### Primary Persona: Sarfaraz (The Mobile Personal Trainer)

| Attribute | Description |
| -- | -- |
| **Role** | Independent personal trainer |
| **Work model** | Travels to clients' homes across the city |
| **Device** | Smartphone only (Android/iOS), always on the move |
| **Client base** | 10-30 active clients, up to 50 in lifecycle (including churned) |
| **Pricing** | Variable per client (₹500-2000/class typical) |
| **Payment model** | Prepaid packages (e.g., 10 classes upfront), manual UPI collection |
| **Current tracking** | Memory + occasional WhatsApp messages |
| **Tech comfort** | Uses WhatsApp, UPI apps daily; not a power user |

#### Behavioral Traits

* Good at managing day-to-day schedule (doesn't need a scheduler)
* Struggles with long-term financial tracking (monthly/quarterly view)
* Needs to be "nice" to clients—can't be rigid about expiry or no-shows
* Extends credit when clients run out of classes
* Wants proof of records to build trust with clients

### Secondary Persona: Churned/Returning Client (Data Entity Only)

* No UI for clients in MVP
* Client exists as a record: Name, Phone, Rate, Balance, History
* May go inactive for months, then return

---

## 3\. Customer Definition

| Term | Definition |
| -- | -- |
| **Customer (paying)** | The personal trainer (Sarfaraz) who pays for the SaaS |
| **Client (end-user of trainer)** | The trainee who buys class packages from the trainer |
| **User** | The trainer (only user with system access in MVP) |

**ICP (Ideal Customer Profile)**: Independent personal trainers in India, including those moonlighting from gym jobs, who want simple class/payment tracking without complex gym management software.

---

## 4\. Needs & Wants

### Needs (Must Solve)

| \# | Need | Evidence |
| -- | -- | -- |
| N1 | Track remaining class balance per client | "How many classes are complete? When is payment due per client?" |
| N2 | Record classes as they occur (punch) | "Punching means that the class is completing" |
| N3 | Handle negative balance (credit) | "Classes can go into negative balance that can get filled later" |
| N4 | Log payments and auto-calculate classes added | "He takes up-front payment for X number of classes" |
| N5 | Variable pricing per client | "Different clients pay different prices" |
| N6 | Mobile-only access | "He is on the move so he can only use it on the phone" |
| N7 | Export records for client trust | "Ability to quickly show the customer your records" |

### Wants (Nice to Have)

| \# | Want | Priority |
| -- | -- | -- |
| W1 | Easy client import from phone contacts | High |
| W2 | Audit trail of all edits visible in UI | Medium |
| W3 | Retrospective punching (up to 3 months back) | Medium |
| W4 | Summary view across all clients | Medium |
| W5 | Offline capability | Low (MVP) |

---

## 5\. Prioritization (MoSCoW)

### Must Have (MVP)

 1. Add client (name, phone from contacts, rate)
 2. View client list with balance indicators
 3. Punch a class (date, defaults to today)
 4. Unpunch (remove) a class
 5. Edit punch date
 6. Log payment (amount → auto-calculate classes, editable)
 7. View client balance (positive, zero, negative)
 8. Negative balance indicator/alert
 9. Export per-client PDF statement
10. Export all-clients PDF summary
11. Date range selection for exports

### Should Have (MVP if time permits)

1. Audit trail visible per client
2. Multiple punches on same day
3. Import client from phone contacts

### Could Have (Post-MVP)

1. Offline mode with sync
2. Search/filter clients
3. Inactive client visual distinction

### Won't Have (Out of Scope)

 1. Scheduler / Calendar
 2. Client-facing app
 3. Automated billing / invoicing
 4. Multi-trainer accounts
 5. Push notifications
 6. WhatsApp integration
 7. Class expiry enforcement
 8. Class duration tracking
 9. Gym/facility management
10. Analytics/reporting beyond basic export
11. Hindi language (MVP is English only)

---

## 6\. Solution Architecture

### System Overview

```
┌─────────────────────────────────────────────────────┐
│                   TRAINER'S PHONE                   │
│  ┌───────────────────────────────────────────────┐  │
│  │              PWA (Mobile Web App)             │  │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────────────┐  │  │
│  │  │ Client  │ │  Punch  │ │     Export      │  │  │
│  │  │  List   │ │  Card   │ │   (PDF Gen)     │  │  │
│  │  └─────────┘ └─────────┘ └─────────────────┘  │  │
│  │                    │                          │  │
│  │              Local Cache                      │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │      Supabase       │
              │  ┌───────────────┐  │
              │  │   Trainers    │  │
              │  │   Clients     │  │
              │  │   Punches     │  │
              │  │   Payments    │  │
              │  │   Rate History│  │
              │  │   Audit Log   │  │
              │  └───────────────┘  │
              └─────────────────────┘
```

### Data Model

```
TRAINER
├── id (UUID)
├── phone (string, unique)
├── pin_hash (string)
├── name (string)
├── created_at (timestamp)
│
├── CLIENTS
│   ├── id (UUID)
│   ├── trainer_id (FK)
│   ├── name (string)
│   ├── phone (string, unique per trainer)
│   ├── current_rate (integer, ₹)
│   ├── balance (integer, can be negative)
│   ├── created_at (timestamp)
│   └── updated_at (timestamp)
│
├── PUNCHES
│   ├── id (UUID)
│   ├── client_id (FK)
│   ├── punch_date (date)
│   ├── created_at (timestamp)
│   └── is_deleted (boolean, soft delete)
│
├── PAYMENTS
│   ├── id (UUID)
│   ├── client_id (FK)
│   ├── amount (integer, ₹)
│   ├── classes_added (integer)
│   ├── rate_at_payment (integer, ₹)
│   ├── payment_date (date)
│   └── created_at (timestamp)
│
├── RATE_HISTORY
│   ├── id (UUID)
│   ├── client_id (FK)
│   ├── rate (integer, ₹)
│   ├── effective_date (date, editable)
│   └── created_at (timestamp)
│
└── AUDIT_LOG
    ├── id (UUID)
    ├── client_id (FK)
    ├── action (enum: PUNCH_ADD, PUNCH_REMOVE, PUNCH_EDIT, PAYMENT_ADD, RATE_CHANGE)
    ├── details (JSON)
    ├── previous_balance (integer)
    └── timestamp (timestamp)
```

### Authentication Model

| Aspect | Decision |
| -- | -- |
| Identifier | Phone number |
| Secret | 4-digit PIN |
| New device recovery | Enter same phone + PIN |
| Forgot PIN | Manual admin reset |
| Auth provider | None (zero cost) |

---

## 7\. Trade-offs Evaluation

| Decision | Option A | Option B | Chosen | Rationale |
| -- | -- | -- | -- | -- |
| **Platform** | Native iOS + Android | PWA | **PWA** | Faster to build, OS-agnostic, install via shortcut |
| **Offline** | Full offline-first | Online with cache | **Online with cache** | Reduces sync complexity for MVP; trainers usually have connectivity |
| **Payment calc** | Manual entry only | Auto-calc + editable | **Auto-calc + editable** | Less friction, trainer can override edge cases |
| **Audit trail** | Backend only | Visible in UI | **Visible in UI** | Builds trainer confidence, helps resolve client disputes |
| **PDF generation** | Server-side | Client-side (browser) | **Client-side** | No server cost, instant, works offline |
| **Contact import** | Deep integration | Browser Contact Picker API | **Contact Picker API** | Simpler, no permissions headache, progressive enhancement |
| **Auth** | Phone OTP | Phone + PIN | **Phone + PIN** | Zero SMS cost, simple, acceptable security for MVP |
| **Rate changes** | Overwrite current rate | Log with effective date | **Log with effective date** | Preserves history, new rate applies to new payments only |

---

## 8\. Recommendations Summary

### MVP Scope

**Core Loop:**

1. Trainer signs up with phone + 4-digit PIN
2. Adds clients (manually or from contacts)
3. Sets per-client rate
4. Logs payments → balance increases (auto-calculated, editable)
5. Punches classes → balance decreases
6. Views dashboard with balance indicators
7. Exports PDF for client trust

**Key Design Principles:**

* **One-thumb operation**: All primary actions reachable with thumb
* **Punch-first UI**: The most common action (recording a class) should be < 3 taps
* **Glanceable balances**: Red/yellow/green indicators for negative/low/healthy balance
* **Non-destructive edits**: Soft delete + audit trail, never lose data

---

## 9\. Non-Functional Requirements

| Category | Requirement | Target |
| -- | -- | -- |
| **Performance** | Time to punch a class | < 3 seconds (including UI feedback) |
| **Performance** | App load time | < 2 seconds on 4G |
| **Availability** | Uptime | 99% (acceptable for MVP) |
| **Scalability** | Clients per trainer | Support up to 100 clients |
| **Scalability** | Punches per client | Support up to 500 punches (multi-year history) |
| **Security** | Authentication | Phone + 4-digit PIN |
| **Security** | Data isolation | Row-level security per trainer |
| **Data** | Backup | Daily automated backups (Supabase default) |
| **Data** | Export | PDF generation < 5 seconds for 50 clients |
| **Compatibility** | Browsers | Chrome, Safari (mobile) last 2 versions |
| **Compatibility** | Devices | Phones with screen width ≥ 320px |
| **Localization** | Language | English (MVP) |
| **Localization** | Currency | INR only (MVP) |

---

## 10\. Key Screens

### 10.1 First Launch / Signup

```
┌─────────────────────────────────┐
│            Gymbo                │
├─────────────────────────────────┤
│                                 │
│  Enter your phone number        │
│  ┌─────────────────────────────┐│
│  │ +91 98765 43210             ││
│  └─────────────────────────────┘│
│                                 │
│  Create a 4-digit PIN           │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐       │
│  │ ● │ │ ● │ │ ● │ │ ● │       │
│  └───┘ └───┘ └───┘ └───┘       │
│                                 │
│        [ Get Started ]          │
└─────────────────────────────────┘
```

### 10.2 Client List (Home)

```
┌─────────────────────────────────┐
│  Gymbo            [+ Add Client]│
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ 🔴 Rahul Sharma        -3   │ │
│ │    ₹800/class              │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🟡 Priya Patel          2   │ │
│ │    ₹1000/class             │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ 🟢 Amit Kumar          12   │ │
│ │    ₹600/class              │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│        [Export All PDF]         │
└─────────────────────────────────┘

Legend:
🔴 = Negative balance (owes classes)
🟡 = Low balance (≤3 classes)
🟢 = Healthy balance (>3 classes)
```

### 10.3 Client Punch Card

```
┌─────────────────────────────────┐
│ ← Rahul Sharma                  │
├─────────────────────────────────┤
│                                 │
│        BALANCE: -3              │
│    (3 classes on credit)        │
│                                 │
│   [  PUNCH CLASS  ]  ← Big CTA  │
│                                 │
├─────────────────────────────────┤
│ Recent Punches                  │
│ ┌─────────────────────────────┐ │
│ │ Dec 30, 2024      [Edit][X] │ │
│ │ Dec 28, 2024      [Edit][X] │ │
│ │ Dec 28, 2024      [Edit][X] │ │
│ │ Dec 25, 2024      [Edit][X] │ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ [+ Log Payment]  [View History] │
│ [Export PDF]     [Audit Log]    │
└─────────────────────────────────┘
```

### 10.4 Log Payment Flow

```
┌─────────────────────────────────┐
│ Log Payment for Rahul           │
├─────────────────────────────────┤
│                                 │
│ Amount Received                 │
│ ┌─────────────────────────────┐ │
│ │ ₹  8,000                    │ │
│ └─────────────────────────────┘ │
│                                 │
│ Classes Added                   │
│ ┌─────────────────────────────┐ │
│ │ 10  (auto-calculated)    ✎  │ │
│ └─────────────────────────────┘ │
│ Rate: ₹800/class                │
│                                 │
│       [ Save Payment ]          │
│                                 │
│ New balance: -3 + 10 = 7        │
└─────────────────────────────────┘
```

---

## 11\. Interaction Patterns

| Action | Interaction | Feedback |
| -- | -- | -- |
| Punch class | Tap "Punch Class" → Date picker (default today) → Confirm | Haptic + balance animates down |
| Unpunch | Swipe left on punch → "Remove" | Strike-through animation → disappears |
| Edit punch date | Tap "Edit" → Date picker → Save | Inline update |
| Add client | Tap "+" → Choose from contacts OR manual entry | Added to list with 0 balance |
| Log payment | Tap "Log Payment" → Enter amount → Auto-calc classes → Confirm | Balance animates up |
| Change rate | Client settings → Edit rate → Set effective date | Logged in rate history |

---

## 12\. Scope Summary

### In Scope (MVP)

| Feature | Description |
| -- | -- |
| Trainer auth | Phone + 4-digit PIN signup/login |
| Client CRUD | Add, view, edit, (soft) delete clients |
| Client import | From phone contacts via Contact Picker API |
| Punch class | Record class on a date (default today, up to 3 months back) |
| Unpunch class | Remove a recorded class |
| Edit punch | Change date of a punch |
| Multiple punches/day | Allowed |
| Log payment | Amount + auto-calc classes (editable) |
| Balance tracking | Real-time, can go negative |
| Balance indicators | Visual red/yellow/green |
| Rate per client | Set and update with effective date |
| Rate history | Logged, new rate applies to new payments only |
| Audit trail | Visible per client |
| PDF export | Per-client and all-clients, with date range |

### Out of Scope

| Feature | Reason |
| -- | -- |
| Scheduler / Calendar | Not requested, avoid over-engineering |
| Client-facing app | No UI for trainees in v1 |
| Automated billing | Manual payment logging only |
| Multi-trainer accounts | Single trainer per account |
| Push notifications | In-app indicators only |
| WhatsApp integration | Manual sharing via PDF |
| Class expiry | Classes roll over, no enforcement |
| Hindi language | English only for MVP |

---

## 13\. Assumptions

| \# | Assumption | Risk if Wrong |
| -- | -- | -- |
| A1 | Trainers have consistent mobile internet access | Need robust offline mode |
| A2 | One punch = one class (no half-classes) | Data model change needed |
| A3 | Trainers are comfortable with English UI | Need Hindi localization |
| A4 | Phone number is sufficient unique identifier for clients | May need email fallback |
| A5 | Trainers will manually share PDFs (no need for auto-send) | May need WhatsApp API |
| A6 | 50-100 clients is max per trainer | May need pagination/search |
| A7 | Trainers trust browser-based PWA (vs native app) | May need App Store presence |
| A8 | Sarfaraz's needs represent broader market | May need more user research |
| A9 | 4-digit PIN is sufficient security | May need stronger auth later |
| A10 | Manual admin PIN reset is acceptable | Need self-service recovery at scale |

---

## 14\. Constraints

| \# | Constraint | Impact |
| -- | -- | -- |
| C1 | Single developer resource | Limits MVP scope |
| C2 | Supabase as backend | Must work within Supabase capabilities |
| C3 | PWA (not native) | Limited access to native features |
| C4 | No budget for WhatsApp Business API | Manual sharing only |
| C5 | India-first (UPI, INR) | Currency/payment methods fixed |
| C6 | No SMS/auth provider | Phone + PIN auth only |
| C7 | Single user MVP (Sarfaraz) | Limited validation |

---

## 15\. Dependencies

| \# | Dependency | Type | Risk |
| -- | -- | -- | -- |
| D1 | Supabase (backend, database) | External service | Low - mature platform |
| D2 | Contact Picker API | Browser API | Low - fallback to manual entry |
| D3 | PDF generation library (client-side) | Open source | Low - jsPDF or similar |
| D4 | Sarfaraz's availability for feedback | User | Medium - schedule around his availability |

---

## 16\. Success Metrics

### Primary Success Metric

**Sarfaraz uses the app daily for 30 consecutive days, provides positive qualitative feedback, and wants to continue using it.**

### Qualitative KPIs (MVP)

| Signal | Method |
| -- | -- |
| "This saves me mental effort" | Interview with Sarfaraz |
| "I trust these records" | Interview |
| "I showed this to a client" | Interview |
| "I want \[X feature\]" | Feature request log |
| Stops relying on memory | Observed behavior |

### Quantitative KPIs (Post-MVP)

| Metric | Target | Measurement |
| -- | -- | -- |
| **Activation** | 80% of signups add ≥1 client within 24 hours | Supabase analytics |
| **Engagement** | 70% of active trainers punch ≥5 classes/week | Weekly cohort analysis |
| **Retention** | 60% monthly retention (D30) | Cohort analysis |
| **Core action** | Avg time to punch < 5 seconds | In-app timing |
| **Data quality** | <5% of punches are edited/removed | Audit log analysis |
| **Export usage** | 30% of trainers export ≥1 PDF/month | Feature usage tracking |

---

## 17\. Release Criteria

### MVP Launch Checklist

#### Functional Completeness

- [ ] Trainer can sign up with phone + 4-digit PIN
- [ ] Trainer can log in on new device with phone + PIN
- [ ] Trainer can add client (manual entry)
- [ ] Trainer can add client (from phone contacts)
- [ ] Trainer can set per-client rate
- [ ] Trainer can edit client rate (with effective date)
- [ ] Trainer can punch a class (today or past date, up to 3 months)
- [ ] Trainer can punch multiple classes on same day
- [ ] Trainer can unpunch (remove) a class
- [ ] Trainer can edit punch date
- [ ] Trainer can log payment with auto-calculated classes
- [ ] Trainer can override auto-calculated classes
- [ ] Balance updates correctly (positive and negative)
- [ ] Balance indicators display correctly (red/yellow/green)
- [ ] Negative balance shows alert indicator
- [ ] Audit trail records all actions
- [ ] Audit trail visible to trainer per client
- [ ] Rate history logged with effective dates
- [ ] PDF export works (per-client)
- [ ] PDF export works (all-clients summary)
- [ ] Date range selection works for exports

#### Non-Functional Completeness

- [ ] App loads in <2 seconds on 4G
- [ ] Punch action completes in <3 seconds
- [ ] Works on Chrome Mobile (Android)
- [ ] Works on Safari Mobile (iOS)
- [ ] PWA installable via "Add to Home Screen"
- [ ] Data persists across sessions
- [ ] No data loss on app close/reopen
- [ ] Row-level security isolates trainer data

#### Quality Gates

- [ ] Sarfaraz has tested all core flows
- [ ] No critical bugs open
- [ ] No high-severity bugs open
- [ ] Error handling for network failures
- [ ] Loading states for all async actions

### Launch Definition

**MVP is "launched" when Sarfaraz confirms:**

1. "I can track all my clients here"
2. "I can see who owes me classes"
3. "I can show proof to clients"
4. "I want to keep using this"

---

## Appendix A: Open Questions for Post-MVP

| \# | Question | Notes |
| -- | -- | -- |
| 1 | Should we add a scheduler? | Wait for Sarfaraz to ask |
| 2 | Hindi localization priority? | Depends on expansion plans |
| 3 | Pricing model for SaaS? | Not defined yet |
| 4 | Multi-trainer (gym owner) tier? | Explicitly out of scope but future opportunity |
| 5 | Client-facing portal for trust? | Alternative to PDF export |
| 6 | WhatsApp auto-share? | 30 paisa/message, evaluate ROI |
| 7 | Self-service PIN recovery? | Needed at scale |
| 8 | Trainer logo on PDF? | Nice to have |

---

## Appendix B: Glossary

| Term | Definition |
| -- | -- |
| **Punch** | Recording that a class occurred on a specific date |
| **Unpunch** | Removing a previously recorded class |
| **Balance** | Number of classes remaining in a client's prepaid package (can be negative) |
| **Negative balance** | Client has used more classes than paid for (credit extended by trainer) |
| **Rate** | Price per class for a specific client (in ₹) |
| **Package** | Prepaid bundle of X classes; balances merge when new payments are made |

---

## Appendix C: Revision History

| Version | Date | Author | Changes |
| -- | -- | -- | -- |
| 1.0 | Dec 31, 2024 | — | Initial PRD |
| 1.1 | Dec 31, 2024 | — | Added Critical Path section, fixed table formatting, reorganized sections |

**End of Document**