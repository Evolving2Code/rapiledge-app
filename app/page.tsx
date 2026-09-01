"use client";

import {
  Activity,
  ArrowLeft,
  ArrowRight,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  CircleDollarSign,
  Clock3,
  FileText,
  LayoutDashboard,
  Mail,
  Menu,
  MoreHorizontal,
  Phone,
  Plus,
  Search,
  Settings2,
  Sparkles,
  StickyNote,
  Users,
  Video,
  X,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";

type View = "overview" | "contacts" | "pipeline" | "tasks" | "notes";

type Contact = {
  id: number;
  name: string;
  initials: string;
  company: string;
  role: string;
  stage: string;
  value: string;
  lastContact: string;
  color: string;
};

const navigation: { id: View; label: string; icon: LucideIcon; badge?: string }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "contacts", label: "Contacts", icon: Users },
  { id: "pipeline", label: "Pipeline", icon: CircleDollarSign },
  { id: "tasks", label: "Tasks", icon: Check, badge: "7" },
  { id: "notes", label: "Notes", icon: FileText },
];

const initialContacts: Contact[] = [
  {
    id: 1,
    name: "Maya Chen",
    initials: "MC",
    company: "Northstar Studio",
    role: "Co-founder",
    stage: "Proposal",
    value: "$42,000",
    lastContact: "Today, 9:12 AM",
    color: "#e5b6a9",
  },
  {
    id: 2,
    name: "Jon Bell",
    initials: "JB",
    company: "Bellwether Labs",
    role: "VP Marketing",
    stage: "Negotiation",
    value: "$28,500",
    lastContact: "Yesterday",
    color: "#c4d4c5",
  },
  {
    id: 3,
    name: "Priya Shah",
    initials: "PS",
    company: "Common Thread",
    role: "Head of Growth",
    stage: "Discovery",
    value: "$18,000",
    lastContact: "Aug 28",
    color: "#e9d6a6",
  },
  {
    id: 4,
    name: "Elliot Brooks",
    initials: "EB",
    company: "Good Measure",
    role: "Founder",
    stage: "Won",
    value: "$31,200",
    lastContact: "Aug 25",
    color: "#c7c0d5",
  },
];

const tasks = [
  { id: 1, title: "Send revised proposal", contact: "Maya Chen · Northstar Studio", due: "Overdue", overdue: true },
  { id: 2, title: "Share Q3 case study", contact: "Jon Bell · Bellwether Labs", due: "Today, 2:00 PM", overdue: false },
  { id: 3, title: "Confirm decision timeline", contact: "Priya Shah · Common Thread", due: "Tomorrow", overdue: false },
  { id: 4, title: "Add notes from kickoff", contact: "Elliot Brooks · Good Measure", due: "Sep 04", overdue: false },
];

const pipelineColumns = [
  { name: "Discovery", count: 3, total: "$62,000", color: "#203c40", deals: [["Common Thread", "Priya Shah", "$18,000"], ["Vela House", "Sam Ortiz", "$24,000"]] },
  { name: "Proposal", count: 4, total: "$98,500", color: "#8da99b", deals: [["Northstar Studio", "Maya Chen", "$42,000"], ["Morrow & Co.", "Alex Morrow", "$19,500"]] },
  { name: "Negotiation", count: 2, total: "$51,000", color: "#e5b84d", deals: [["Bellwether Labs", "Jon Bell", "$28,500"], ["Highline", "Tessa Wong", "$22,500"]] },
  { name: "Won", count: 3, total: "$67,200", color: "#ef684d", deals: [["Good Measure", "Elliot Brooks", "$31,200"], ["Fieldwork", "Noah Kim", "$36,000"]] },
];

const activity = [
  { icon: Mail, title: "Email logged", description: "Maya replied to “A few thoughts on scope”", time: "9:12 AM" },
  { icon: Phone, title: "Call summary added", description: "28 min call with Jon Bell · Bellwether Labs", time: "Yesterday" },
  { icon: StickyNote, title: "Note added", description: "Priya prefers a phased rollout over a big launch", time: "Aug 28" },
  { icon: ArrowRight, title: "Deal moved", description: "Good Measure moved from Proposal to Won", time: "Aug 25" },
];

function initialsFor(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function Home() {
  const [view, setView] = useState<View>("overview");
  const [contacts, setContacts] = useState(initialContacts);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [query, setQuery] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [briefExpanded, setBriefExpanded] = useState(false);
  const [completed, setCompleted] = useState<number[]>([]);
  const [newContact, setNewContact] = useState({ name: "", company: "", email: "" });

  const visibleContacts = useMemo(
    () =>
      contacts.filter((contact) =>
        `${contact.name} ${contact.company} ${contact.role}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [contacts, query],
  );

  function changeView(nextView: View) {
    setView(nextView);
    setSelectedContact(null);
    setQuery("");
  }

  function openContact(contact: Contact) {
    setSelectedContact(contact);
    setQuery("");
  }

  function toggleTask(id: number) {
    setCompleted((current) => (current.includes(id) ? current.filter((taskId) => taskId !== id) : [...current, id]));
  }

  function addContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!newContact.name.trim()) return;
    const contact: Contact = {
      id: contacts.length + 1,
      name: newContact.name,
      initials: initialsFor(newContact.name),
      company: newContact.company || "New company",
      role: "New contact",
      stage: "Discovery",
      value: "—",
      lastContact: "Not contacted",
      color: "#d4c7b8",
    };
    setContacts((current) => [contact, ...current]);
    setNewContact({ name: "", company: "", email: "" });
    setModalOpen(false);
    setView("contacts");
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">R</div>
          <div className="brand-name">
            Rapi<span>Ledge</span>
          </div>
        </div>
        <div className="workspace-label">Your workspace</div>
        <nav className="nav" aria-label="Main navigation">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = view === item.id && !selectedContact;
            return (
              <button
                className={`nav-button ${isActive ? "active" : ""}`}
                key={item.id}
                onClick={() => changeView(item.id)}
                type="button"
              >
                <Icon />
                <span>{item.label}</span>
                {item.badge && <span className="nav-badge">{item.badge}</span>}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-spacer" />
        <div className="connected-card">
          <div className="connected-title">
            Connected apps
            <Settings2 />
          </div>
          <div className="connected-row">
            <span className="connected-dot" />
            Gmail synced · just now
          </div>
          <div className="connected-row">
            <span className="connected-dot" />
            Recall.ai connected
          </div>
        </div>
        <div className="sidebar-footer">
          <div className="avatar">AR</div>
          <div className="user-meta">
            <strong>Alex Rivera</strong>
            <span>Owner · RapiLedge</span>
          </div>
          <ChevronDown size={14} color="#89908b" />
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="mobile-brand">
            <div className="brand-mark">R</div>
            <div className="brand-name">Rapi<span>Ledge</span></div>
          </div>
          <label className="search-box">
            <Search />
            <input
              aria-label="Search your workspace"
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your workspace..."
              value={query}
            />
          </label>
          <div className="topbar-actions">
            <button className="icon-button" aria-label="Notifications" type="button">
              <Bell />
            </button>
            <div className="avatar">AR</div>
          </div>
        </header>

        {selectedContact ? (
          <ContactDetail contact={selectedContact} onBack={() => setSelectedContact(null)} />
        ) : (
          <>
            <div className="page-heading">
              <div>
                <div className="eyebrow">{view === "overview" ? "Tuesday, September 01, 2026" : "Your workspace"}</div>
                <h1>
                  {view === "overview" && "Good morning, Alex."}
                  {view === "contacts" && "Contacts"}
                  {view === "pipeline" && "Pipeline"}
                  {view === "tasks" && "Tasks"}
                  {view === "notes" && "Notes"}
                </h1>
                <p>
                  {view === "overview" && "Here’s what deserves your attention today."}
                  {view === "contacts" && "The people and context behind every relationship."}
                  {view === "pipeline" && "A clear view of what’s moving, and what’s stuck."}
                  {view === "tasks" && "Small follow-ups. Big difference in how prepared you look."}
                  {view === "notes" && "The details worth remembering, all in one place."}
                </p>
              </div>
              <div className="heading-actions">
                <button className="secondary-button" onClick={() => setModalOpen(true)} type="button">
                  <Plus /> Add contact
                </button>
                <button className="primary-button" onClick={() => setBriefExpanded(true)} type="button">
                  <Sparkles /> Brief me
                </button>
              </div>
            </div>

            {view === "overview" && <Dashboard onOpenContact={openContact} onOpenBrief={() => setBriefExpanded(true)} />}
            {view === "contacts" && (
              <ContactsView contacts={visibleContacts} onOpenContact={openContact} onAdd={() => setModalOpen(true)} />
            )}
            {view === "pipeline" && <PipelineView />}
            {view === "tasks" && <TasksView completed={completed} onToggle={toggleTask} />}
            {view === "notes" && <NotesView />}
          </>
        )}
      </main>

      {modalOpen && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-contact-title">
            <div className="modal-header">
              <div>
                <h2 id="add-contact-title">Add a contact</h2>
                <p>Start a record. RapiLedge will keep the context.</p>
              </div>
              <button className="icon-button" onClick={() => setModalOpen(false)} aria-label="Close" type="button">
                <X />
              </button>
            </div>
            <form onSubmit={addContact}>
              <div className="field">
                <label htmlFor="name">Name</label>
                <input
                  autoFocus
                  id="name"
                  onChange={(event) => setNewContact({ ...newContact, name: event.target.value })}
                  placeholder="e.g. Maya Chen"
                  required
                  value={newContact.name}
                />
              </div>
              <div className="field">
                <label htmlFor="company">Company</label>
                <input
                  id="company"
                  onChange={(event) => setNewContact({ ...newContact, company: event.target.value })}
                  placeholder="e.g. Northstar Studio"
                  value={newContact.company}
                />
              </div>
              <div className="field">
                <label htmlFor="email">Email</label>
                <input
                  id="email"
                  onChange={(event) => setNewContact({ ...newContact, email: event.target.value })}
                  placeholder="name@company.com"
                  type="email"
                  value={newContact.email}
                />
              </div>
              <div className="modal-actions">
                <button className="secondary-button" onClick={() => setModalOpen(false)} type="button">
                  Cancel
                </button>
                <button className="primary-button" type="submit">
                  Create contact <ArrowRight />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {briefExpanded && !modalOpen && (
        <div className="modal-backdrop" role="presentation">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="brief-title">
            <div className="modal-header">
              <div>
                <div className="eyebrow">AI pre-call digest</div>
                <h2 id="brief-title">You’re ready for Maya.</h2>
                <p>Generated from 4 activities, 2 notes and 1 open task.</p>
              </div>
              <button className="icon-button" onClick={() => setBriefExpanded(false)} aria-label="Close" type="button">
                <X />
              </button>
            </div>
            <p className="brief-copy" style={{ color: "var(--ink)", marginTop: 22 }}>
              Maya is aligned on the direction, but still needs confidence in the rollout plan. Lead with the phased
              launch option and ask how her team felt about the revised scope.
            </p>
            <ul className="brief-points" style={{ color: "var(--muted)" }}>
              <li style={{ color: "var(--muted)" }}>Open loop: send the revised proposal before today’s call.</li>
              <li style={{ color: "var(--muted)" }}>Remember: her dog Juniper’s birthday is September 18.</li>
              <li style={{ color: "var(--muted)" }}>Flag: budget conversation may need her co-founder present.</li>
            </ul>
            <div className="modal-actions" style={{ marginTop: 20 }}>
              <button className="primary-button" onClick={() => setBriefExpanded(false)} type="button">
                Got it <Check />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dashboard({
  onOpenContact,
  onOpenBrief,
}: {
  onOpenContact: (contact: Contact) => void;
  onOpenBrief: () => void;
}) {
  return (
    <>
      <div className="stat-row">
        <div className="stat">
          <div className="card-label">Active pipeline</div>
          <div className="stat-value">
            <strong>$248.7k</strong>
            <span>+12.4%</span>
          </div>
          <div className="stat-subtext">Across 12 open deals</div>
        </div>
        <div className="stat">
          <div className="card-label">Tasks due</div>
          <div className="stat-value">
            <strong>07</strong>
            <span style={{ color: "#bb4d39" }}>2 overdue</span>
          </div>
          <div className="stat-subtext">Keep your promises close</div>
        </div>
        <div className="stat">
          <div className="card-label">New this week</div>
          <div className="stat-value">
            <strong>14</strong>
            <span>+4</span>
          </div>
          <div className="stat-subtext">Emails and call notes logged</div>
        </div>
        <div className="stat">
          <div className="card-label">Next meeting</div>
          <div className="stat-value">
            <strong>10:30</strong>
          </div>
          <div className="stat-subtext">Maya Chen · in 42 minutes</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="left-stack">
          <section className="card brief-card">
            <div className="card-header">
              <div>
                <div className="card-label">Next up · 10:30 AM</div>
                <h2>Walk in knowing everything.</h2>
              </div>
              <div className="brief-date">VIDEO CALL</div>
            </div>
            <div className="brief-body">
              <div className="brief-intro">
                <div className="brief-avatar">MC</div>
                <div>
                  <strong>Maya Chen</strong>
                  <span>Co-founder · Northstar Studio</span>
                </div>
              </div>
              <p className="brief-copy">
                Maya is still thinking about <em>the rollout timeline</em>. She liked the phased approach — make that
                your opening.
              </p>
              <ul className="brief-points">
                <li>Last touch: replied to your scope email this morning</li>
                <li>Open loop: send revised proposal before the call</li>
                <li>Worth remembering: Juniper’s birthday is September 18</li>
              </ul>
              <div className="brief-action">
                <span>Updated 2 min ago · Claude</span>
                <button onClick={onOpenBrief} type="button">
                  Open full brief <ArrowRight />
                </button>
              </div>
            </div>
          </section>

          <section className="card pipeline-card">
            <div className="card-header">
              <div>
                <div className="card-label">Revenue at a glance</div>
                <h2>Pipeline pulse</h2>
              </div>
              <div className="pipeline-total">
                Total <strong>$248.7k</strong>
              </div>
            </div>
            <div className="pipeline-bars" aria-label="Pipeline breakdown">
              <span className="one" />
              <span className="two" />
              <span className="three" />
              <span className="four" />
            </div>
            <div className="pipeline-legend">
              <Legend color="#203c40" label="Discovery" value="$62k" />
              <Legend color="#8da99b" label="Proposal" value="$98.5k" />
              <Legend color="#e5b84d" label="Negotiation" value="$51k" />
              <Legend color="#ef684d" label="Won" value="$67.2k" />
            </div>
          </section>

          <section className="card activity-card">
            <div className="card-header">
              <div>
                <div className="card-label">Across your workspace</div>
                <h2>Recent activity</h2>
              </div>
              <button className="quiet-link" type="button">
                View all
              </button>
            </div>
            <div className="activity-list">
              {activity.map((item) => {
                const Icon = item.icon;
                return (
                  <div className="activity-item" key={item.title}>
                    <div className="activity-icon">
                      <Icon />
                    </div>
                    <div>
                      <strong>{item.title}</strong>
                      <p>{item.description}</p>
                    </div>
                    <div className="activity-time">{item.time}</div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        <div className="right-stack">
          <section className="card queue-card">
            <div className="card-header">
              <div>
                <div className="card-label">Don’t let these slip</div>
                <h2>Priority queue</h2>
              </div>
              <Clock3 size={15} color="#89908b" />
            </div>
            <div className="queue-list">
              <QueueItem title="Send revised proposal" detail="Maya Chen · overdue" time="Now" />
              <QueueItem title="Share Q3 case study" detail="Jon Bell · due today" time="2:00 PM" yellow />
              <QueueItem title="Confirm decision timeline" detail="Priya Shah · tomorrow" time="Sep 02" yellow />
            </div>
          </section>

          <section className="card people-card">
            <div className="card-header">
              <div>
                <div className="card-label">Stay close</div>
                <h2>Recent contacts</h2>
              </div>
              <button className="quiet-link" type="button">
                See all
              </button>
            </div>
            {initialContacts.slice(0, 3).map((contact) => (
              <button className="person-row" key={contact.id} onClick={() => onOpenContact(contact)} type="button">
                <div className="avatar" style={{ background: contact.color }}>
                  {contact.initials}
                </div>
                <div className="person-details">
                  <strong>{contact.name}</strong>
                  <span>{contact.company}</span>
                </div>
                <ArrowRight />
              </button>
            ))}
          </section>

          <section className="card" style={{ padding: "18px 19px 19px", background: "#fffaf0" }}>
            <div className="card-label">A little reminder</div>
            <p
              style={{
                margin: "10px 0 0",
                color: "#46514b",
                fontFamily: "Georgia, serif",
                fontSize: "14px",
                lineHeight: 1.45,
              }}
            >
              “You’ll look like you have a photographic memory.”
            </p>
            <div style={{ marginTop: 12, color: "#9d7b28", fontFamily: "DM Mono, monospace", fontSize: "9px" }}>
              THAT&apos;S THE WHOLE POINT
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="legend-item">
      <i style={{ background: color }} />
      <div>
        <strong>{value}</strong>
        {label}
      </div>
    </div>
  );
}

function QueueItem({ title, detail, time, yellow = false }: { title: string; detail: string; time: string; yellow?: boolean }) {
  return (
    <div className="queue-item">
      <div className={`queue-dot ${yellow ? "yellow" : ""}`} />
      <div>
        <strong>{title}</strong>
        <p>{detail}</p>
      </div>
      <div className="queue-time">{time}</div>
    </div>
  );
}

function ContactDetail({ contact, onBack }: { contact: Contact; onBack: () => void }) {
  return (
    <>
      <div className="page-heading" style={{ display: "block", paddingBottom: 22 }}>
        <button className="back-button" onClick={onBack} type="button">
          <ArrowLeft /> Back to workspace
        </button>
        <div className="contact-heading" style={{ marginTop: 22 }}>
          <div className="large-avatar" style={{ background: contact.color }}>
            {contact.initials}
          </div>
          <div>
            <div className="contact-heading-copy">
              <h1>{contact.name}</h1>
              <span className="tag">High priority</span>
            </div>
            <div className="contact-company">
              {contact.role} · {contact.company}
            </div>
          </div>
          <div className="heading-actions" style={{ marginLeft: "auto", alignSelf: "center" }}>
            <button className="secondary-button" type="button">
              <Mail /> Email
            </button>
            <button className="primary-button" type="button">
              <Phone /> Log a call
            </button>
          </div>
        </div>
      </div>

      <div className="contact-layout">
        <div className="left-stack">
          <section className="card">
            <div className="profile-strip">
              <div className="profile-field">
                <span>Last contact</span>
                <strong>{contact.lastContact}</strong>
              </div>
              <div className="profile-field">
                <span>Relationship</span>
                <strong>2 years · 14 touches</strong>
              </div>
              <div className="profile-field">
                <span>Next meeting</span>
                <strong>Today, 10:30 AM</strong>
              </div>
            </div>
            <div className="card-header">
              <div>
                <div className="card-label">Everything in one stream</div>
                <h2>Activity timeline</h2>
              </div>
              <button className="quiet-link" type="button">
                Add activity
              </button>
            </div>
            <div className="timeline">
              <TimelineEvent icon={Mail} title="Maya replied to your email" date="Today · 9:12 AM" text="“The phased option feels right. Can we talk through what phase one would look like?”" source="Gmail" />
              <TimelineEvent icon={Sparkles} title="AI call summary" date="Aug 29 · 4:18 PM" text="Maya is bought into the direction. She needs a clearer picture of the rollout timeline before signing off." source="AI CALL" ai />
              <TimelineEvent icon={StickyNote} title="You added a note" date="Aug 27 · 11:05 AM" text="Maya’s dog is Juniper — birthday is September 18. Ask about the new studio space." source="MANUAL" />
              <TimelineEvent icon={Video} title="Discovery call completed" date="Aug 24 · 2:00 PM" text="28 min · recording and transcript available" source="RECALL.AI" />
            </div>
          </section>
        </div>

        <div className="detail-side">
          <section className="card brief-card">
            <div className="card-header">
              <div>
                <div className="card-label">Your unfair advantage</div>
                <h2>Brief me</h2>
              </div>
              <Sparkles size={16} color="#f3c761" />
            </div>
            <div className="brief-body">
              <p className="brief-copy" style={{ marginTop: 0 }}>
                Lead with the phased launch. Maya likes the work — the last thing she needs is confidence in how her
                team will absorb it.
              </p>
              <ul className="brief-points">
                <li>Ask how her co-founder feels about the budget</li>
                <li>Circle back to the revised scope email</li>
                <li>Juniper&apos;s birthday is September 18</li>
              </ul>
              <div className="brief-action">
                <span>4 sources · 2 notes</span>
                <button type="button">
                  Refresh <Sparkles />
                </button>
              </div>
            </div>
          </section>
          <section className="card deal-detail">
            <div className="card-header">
              <div>
                <div className="card-label">Money on the table</div>
                <h2>Northstar rebrand</h2>
              </div>
              <MoreHorizontal size={16} color="#89908b" />
            </div>
            <div className="deal-stage">
              <span>{contact.stage}</span>
              <strong>60% likely</strong>
            </div>
            <div className="deal-metrics">
              <div className="deal-metric">
                <span>Value</span>
                <strong>{contact.value}</strong>
              </div>
              <div className="deal-metric">
                <span>Close date</span>
                <strong>Sep 18</strong>
              </div>
            </div>
          </section>
          <section className="card notes-card">
            <div className="card-header">
              <div>
                <div className="card-label">Remember this</div>
                <h2>Notes</h2>
              </div>
              <button className="quiet-link" type="button">
                <Plus size={13} /> Add
              </button>
            </div>
            <div className="note-item">
              <p>“The new studio space has a lot of natural light — she&apos;s excited about it.”</p>
              <footer>
                <span>Manual note</span>
                <span>Aug 27</span>
              </footer>
            </div>
            <div className="note-item">
              <p>AI flagged: timeline confidence is the current blocker.</p>
              <footer>
                <span className="tag">AI note</span>
                <span>Aug 29</span>
              </footer>
            </div>
          </section>
        </div>
      </div>
    </>
  );
}

function TimelineEvent({
  icon: Icon,
  title,
  date,
  text,
  source,
  ai = false,
}: {
  icon: LucideIcon;
  title: string;
  date: string;
  text: string;
  source: string;
  ai?: boolean;
}) {
  return (
    <div className="timeline-event">
      <div className="timeline-marker">
        <Icon />
      </div>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
        <span className={`source-pill ${ai ? "ai" : ""}`}>{source}</span>
      </div>
      <time>{date}</time>
    </div>
  );
}

function ContactsView({
  contacts,
  onOpenContact,
  onAdd,
}: {
  contacts: Contact[];
  onOpenContact: (contact: Contact) => void;
  onAdd: () => void;
}) {
  return (
    <>
      <div className="collection-toolbar">
        <p>{contacts.length} people in your workspace</p>
        <button className="secondary-button" onClick={onAdd} type="button">
          <Plus /> Add contact
        </button>
      </div>
      <section className="card table-card">
        <div className="table-row header">
          <div>Contact</div>
          <div>Company</div>
          <div>Stage</div>
          <div>Last contact</div>
          <div />
        </div>
        {contacts.map((contact) => (
          <button className="table-row" key={contact.id} onClick={() => onOpenContact(contact)} type="button">
            <div className="table-contact">
              <div className="avatar" style={{ background: contact.color }}>
                {contact.initials}
              </div>
              <div>
                <strong>{contact.name}</strong>
                <span>{contact.role}</span>
              </div>
            </div>
            <div className="table-muted">{contact.company}</div>
            <div>
              <span className="stage-label">{contact.stage}</span>
            </div>
            <div className="table-muted">{contact.lastContact}</div>
            <div className="row-menu">
              <MoreHorizontal />
            </div>
          </button>
        ))}
      </section>
    </>
  );
}

function PipelineView() {
  return (
    <div className="kanban">
      {pipelineColumns.map((column) => (
        <section className="kanban-column" key={column.name}>
          <div className="kanban-column-header">
            <span>{column.name}</span>
            <strong>{column.count}</strong>
          </div>
          {column.deals.map(([company, contact, value]) => (
            <div className="deal-card" key={company}>
              <h3>{company}</h3>
              <p>{contact}</p>
              <footer>
                <strong>{value}</strong>
                <span>last touch 2d</span>
              </footer>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}

function TasksView({ completed, onToggle }: { completed: number[]; onToggle: (id: number) => void }) {
  return (
    <div className="task-list">
      {tasks.map((task) => {
        const isDone = completed.includes(task.id);
        return (
          <div className="task-row" key={task.id}>
            <button className={`task-check ${isDone ? "done" : ""}`} onClick={() => onToggle(task.id)} aria-label={`Mark ${task.title} ${isDone ? "incomplete" : "complete"}`} type="button">
              {isDone && <Check />}
            </button>
            <div className="task-copy" style={isDone ? { opacity: 0.45, textDecoration: "line-through" } : undefined}>
              <strong>{task.title}</strong>
              <span>{task.contact}</span>
            </div>
            <div className={`task-due ${task.overdue ? "" : "upcoming"}`}>{isDone ? "Complete" : task.due}</div>
          </div>
        );
      })}
    </div>
  );
}

function NotesView() {
  return (
    <div className="dashboard-grid" style={{ marginTop: 0 }}>
      <section className="card notes-card">
        <div className="card-header">
          <div>
            <div className="card-label">All the little things</div>
            <h2>Recent notes</h2>
          </div>
          <button className="primary-button" type="button">
            <Plus /> New note
          </button>
        </div>
        <div className="note-item">
          <p>Maya&apos;s dog is Juniper — birthday is September 18. Ask about the new studio space.</p>
          <footer><span className="tag">Manual</span><span>Maya Chen · Aug 27</span></footer>
        </div>
        <div className="note-item">
          <p>AI flagged: timeline confidence is the current blocker.</p>
          <footer><span className="tag">AI call</span><span>Maya Chen · Aug 29</span></footer>
        </div>
        <div className="note-item">
          <p>Priya prefers a phased rollout over a big launch — her team is stretched this quarter.</p>
          <footer><span className="tag">Manual</span><span>Priya Shah · Aug 28</span></footer>
        </div>
      </section>
      <section className="card brief-card" style={{ alignSelf: "start" }}>
        <div className="card-header">
          <div>
            <div className="card-label">The promise</div>
            <h2>Never ask twice.</h2>
          </div>
          <StickyNote size={16} color="#f3c761" />
        </div>
        <div className="brief-body">
          <p className="brief-copy">Every note is here for a reason: to resurface at exactly the right moment.</p>
        </div>
      </section>
    </div>
  );
}
