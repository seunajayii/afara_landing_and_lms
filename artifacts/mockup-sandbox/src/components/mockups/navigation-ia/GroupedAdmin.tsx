import "./_group.css";
import {
  AlertCircle,
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  ClipboardCheck,
  FileBarChart,
  FileText,
  FolderKanban,
  GraduationCap,
  LayoutDashboard,
  Mail,
  MoreHorizontal,
  Network,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";

type NavItem = {
  label: string;
  icon: typeof LayoutDashboard;
  badge?: string;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const groups: NavGroup[] = [
  {
    label: "Overview",
    items: [{ label: "Cohort workspace", icon: LayoutDashboard }],
  },
  {
    label: "Programme Operations",
    items: [
      { label: "Applications", icon: FileText, badge: "12" },
      { label: "Cohorts", icon: FolderKanban },
      { label: "Analytics", icon: BarChart3 },
    ],
  },
  {
    label: "Learning Delivery",
    items: [
      { label: "Learning Pods", icon: Network },
      { label: "Progress", icon: FileBarChart },
      { label: "Reports", icon: FileText },
      { label: "Assignments", icon: ClipboardCheck, badge: "4" },
      { label: "Courses", icon: BookOpen },
      { label: "Resources", icon: FolderKanban },
    ],
  },
  {
    label: "Engagement",
    items: [
      { label: "Events", icon: CalendarDays },
      { label: "Newsletter", icon: Mail },
    ],
  },
  {
    label: "People & Access",
    items: [{ label: "Users", icon: Users }],
  },
  {
    label: "Credentials",
    items: [{ label: "Certificates", icon: GraduationCap }],
  },
];

const activity = [
  { initials: "KN", name: "Kemi Nwosu", detail: "submitted an assignment", time: "8 min ago", tone: "sage" },
  { initials: "OA", name: "Olu Adebayo", detail: "joined Learning Pod 04", time: "42 min ago", tone: "ochre" },
  { initials: "MS", name: "Maya Sarpong", detail: "completed Week 3", time: "1 hr ago", tone: "rose" },
];

export function GroupedAdmin() {
  const [activeItem, setActiveItem] = useState("Cohort workspace");
  const [cohortOpen, setCohortOpen] = useState(false);
  const [attentionOpen, setAttentionOpen] = useState(true);
  const [query, setQuery] = useState("");

  const visibleGroups = groups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.label.toLowerCase().includes(query.toLowerCase())),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div
      className="min-h-[100dvh]"
      style={{
        display: "flex",
        minWidth: 620,
        background: "var(--ia-background)",
        color: "var(--ia-foreground)",
        overflow: "hidden",
      }}
    >
      <aside
        style={{
          width: 228,
          flex: "0 0 228px",
          minHeight: "100dvh",
          background: "var(--ia-sidebar)",
          borderRight: "1px solid var(--ia-sidebar-border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ padding: "22px 18px 18px", borderBottom: "1px solid var(--ia-sidebar-border)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div
                style={{
                  fontFamily: "'Playfair Display', serif",
                  fontSize: 26,
                  fontWeight: 700,
                  letterSpacing: "-1px",
                  lineHeight: 1,
                  color: "var(--ia-primary)",
                }}
              >
                AFÁRÁ
              </div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginTop: 9,
                  color: "var(--ia-muted)",
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: ".03em",
                }}
              >
                <ShieldCheck size={13} strokeWidth={1.8} /> Admin portal
              </div>
            </div>
            <div
              aria-label="AFÁRÁ admin"
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                display: "grid",
                placeItems: "center",
                background: "var(--ia-primary)",
                color: "var(--ia-background)",
                fontSize: 10,
                fontWeight: 700,
              }}
            >
              AM
            </div>
          </div>
        </div>

        <div style={{ padding: "15px 12px 10px" }}>
          <button
            type="button"
            onClick={() => setCohortOpen((open) => !open)}
            style={{
              width: "100%",
              border: "1px solid var(--ia-border)",
              borderRadius: 8,
              background: "var(--ia-card)",
              padding: "10px 10px 9px",
              color: "var(--ia-foreground)",
              textAlign: "left",
              cursor: "pointer",
            }}
          >
            <span style={{ display: "block", color: "var(--ia-muted)", fontSize: 9, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>
              Working in
            </span>
            <span style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 5, marginTop: 5, fontSize: 11, fontWeight: 700 }}>
              AFÁRÁ Fellowship · 2024
              <ChevronDown size={14} style={{ transform: cohortOpen ? "rotate(180deg)" : undefined }} />
            </span>
          </button>
          {cohortOpen && (
            <div
              style={{
                marginTop: 5,
                padding: "5px 0",
                border: "1px solid var(--ia-border)",
                borderRadius: 8,
                background: "var(--ia-card)",
                boxShadow: "0 8px 22px rgba(35, 56, 45, .08)",
              }}
            >
              {["AFÁRÁ Fellowship · 2024", "AFÁRÁ Fellowship · 2023"].map((cohort) => (
                <button
                  type="button"
                  key={cohort}
                  onClick={() => setCohortOpen(false)}
                  style={{
                    width: "100%",
                    border: 0,
                    background: cohort.endsWith("2024") ? "var(--ia-sidebar-accent)" : "transparent",
                    padding: "8px 10px",
                    textAlign: "left",
                    color: "var(--ia-foreground)",
                    fontSize: 10,
                    cursor: "pointer",
                  }}
                >
                  {cohort}
                </button>
              ))}
            </div>
          )}
        </div>

        <div style={{ padding: "0 12px 11px", position: "relative" }}>
          <Search size={13} style={{ position: "absolute", left: 22, top: 9, color: "var(--ia-muted)" }} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Find a destination"
            aria-label="Find a destination"
            style={{
              width: "100%",
              border: "1px solid transparent",
              borderRadius: 7,
              background: "rgba(255,255,255,.46)",
              padding: "8px 8px 8px 28px",
              outline: "none",
              color: "var(--ia-foreground)",
              fontSize: 10,
            }}
          />
        </div>

        <nav aria-label="Admin destinations" style={{ flex: 1, overflow: "auto", padding: "0 10px 18px" }}>
          {visibleGroups.map((group) => (
            <div key={group.label} style={{ marginTop: group.label === "Overview" ? 2 : 14 }}>
              <div
                style={{
                  padding: "0 10px 6px",
                  color: "var(--ia-muted)",
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: ".1em",
                  textTransform: "uppercase",
                }}
              >
                {group.label}
              </div>
              {group.items.map(({ label, icon: Icon, badge }) => {
                const isActive = label === activeItem;
                return (
                  <button
                    type="button"
                    key={label}
                    onClick={() => setActiveItem(label)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                      border: 0,
                      borderLeft: isActive ? "2px solid var(--ia-primary)" : "2px solid transparent",
                      borderRadius: "0 6px 6px 0",
                      background: isActive ? "var(--ia-sidebar-accent)" : "transparent",
                      color: isActive ? "var(--ia-foreground)" : "var(--ia-muted)",
                      padding: "7px 9px",
                      textAlign: "left",
                      fontSize: 10.5,
                      fontWeight: isActive ? 700 : 500,
                      cursor: "pointer",
                    }}
                  >
                    <Icon size={14} strokeWidth={isActive ? 2.1 : 1.8} />
                    <span style={{ flex: 1 }}>{label}</span>
                    {badge && <span style={{ color: "var(--ia-primary)", fontSize: 9, fontWeight: 700 }}>{badge}</span>}
                  </button>
                );
              })}
            </div>
          ))}
          {visibleGroups.length === 0 && <div style={{ padding: "12px 10px", color: "var(--ia-muted)", fontSize: 10 }}>No destinations found.</div>}
        </nav>

        <div style={{ borderTop: "1px solid var(--ia-sidebar-border)", padding: "12px 18px", color: "var(--ia-muted)", fontSize: 9 }}>
          <span style={{ display: "inline-block", width: 6, height: 6, marginRight: 6, borderRadius: "50%", background: "#849d74" }} />
          All systems operational
        </div>
      </aside>

      <main style={{ flex: 1, minWidth: 0, padding: "25px 28px 30px", overflow: "auto" }}>
        <header style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 18 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--ia-primary)", fontSize: 10, fontWeight: 700, letterSpacing: ".11em", textTransform: "uppercase" }}>
              <Sparkles size={13} strokeWidth={1.8} /> {activeItem}
            </div>
            <h1 style={{ margin: "8px 0 5px", fontFamily: "'Playfair Display', serif", fontSize: 30, lineHeight: 1.08, letterSpacing: "-.7px", fontWeight: 600 }}>
              Good morning, Amara.
            </h1>
            <p style={{ margin: 0, color: "var(--ia-muted)", fontSize: 12, lineHeight: 1.5 }}>
              Here’s the pulse of your fellowship workspace.
            </p>
          </div>
          <button
            type="button"
            aria-label="View all activity"
            onClick={() => setActiveItem("Reports")}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              border: "1px solid var(--ia-border)",
              borderRadius: 7,
              background: "var(--ia-card)",
              padding: "8px 10px",
              color: "var(--ia-muted)",
              fontSize: 10,
              cursor: "pointer",
            }}
          >
            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#c68155" }} />
            Activity <ArrowUpRight size={12} />
          </button>
        </header>

        <section
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.55fr) minmax(145px, .8fr)",
            gap: 12,
            marginTop: 25,
          }}
        >
          <div
            style={{
              minHeight: 130,
              borderRadius: 10,
              background: "var(--ia-primary)",
              color: "var(--ia-background)",
              padding: "18px 19px",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div style={{ position: "absolute", width: 180, height: 180, right: -52, top: -77, border: "1px solid rgba(245,239,226,.18)", borderRadius: "50%" }} />
            <div style={{ position: "absolute", width: 145, height: 145, right: -21, top: -59, border: "1px solid rgba(245,239,226,.12)", borderRadius: "50%" }} />
            <div style={{ position: "relative", color: "rgba(246,240,226,.68)", fontSize: 10, fontWeight: 700, letterSpacing: ".1em", textTransform: "uppercase" }}>Current cohort</div>
            <div style={{ position: "relative", marginTop: 9, fontFamily: "'Playfair Display', serif", fontSize: 22, lineHeight: 1.1 }}>Fellowship 2024</div>
            <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 7, marginTop: 12, color: "rgba(246,240,226,.76)", fontSize: 10 }}>
              <Users size={13} /> 48 fellows <span style={{ opacity: .45 }}>·</span> Week 04 of 12
            </div>
          </div>
          <div style={{ border: "1px solid var(--ia-border)", borderRadius: 10, background: "var(--ia-card)", padding: "17px 16px" }}>
            <div style={{ color: "var(--ia-muted)", fontSize: 10, fontWeight: 700, letterSpacing: ".06em", textTransform: "uppercase" }}>Completion</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 13 }}>
              <span style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "var(--ia-primary)" }}>68</span>
              <span style={{ color: "var(--ia-muted)", fontSize: 11 }}>%</span>
            </div>
            <div style={{ height: 5, marginTop: 11, overflow: "hidden", borderRadius: 9, background: "var(--ia-primary-soft)" }}>
              <div style={{ width: "68%", height: "100%", borderRadius: 9, background: "#b27454" }} />
            </div>
            <div style={{ marginTop: 7, color: "var(--ia-muted)", fontSize: 9 }}>+4.6% from last week</div>
          </div>
        </section>

        {attentionOpen && (
          <section
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginTop: 14,
              border: "1px solid #dfcda9",
              borderRadius: 9,
              background: "#f5edda",
              padding: "12px 13px",
            }}
          >
            <div style={{ display: "grid", placeItems: "center", width: 28, height: 28, flex: "0 0 28px", borderRadius: 7, background: "#e6d5ae", color: "#80602c" }}>
              <AlertCircle size={15} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ color: "#6c5025", fontSize: 11, fontWeight: 700 }}>Needs attention</div>
              <div style={{ marginTop: 2, color: "#846b41", fontSize: 10 }}>12 applications waiting for review · 4 assignments due today</div>
            </div>
            <button
              type="button"
              onClick={() => setActiveItem("Applications")}
              style={{ border: 0, background: "transparent", color: "#6c5025", fontSize: 10, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }}
            >
              Review queue <ArrowUpRight size={12} style={{ verticalAlign: "-2px" }} />
            </button>
            <button type="button" aria-label="Dismiss needs attention" onClick={() => setAttentionOpen(false)} style={{ display: "grid", placeItems: "center", border: 0, background: "transparent", color: "#9b855e", cursor: "pointer" }}>
              <X size={14} />
            </button>
          </section>
        )}

        <section style={{ display: "grid", gridTemplateColumns: "minmax(0, 1.17fr) minmax(0, .83fr)", gap: 12, marginTop: 14 }}>
          <div style={{ border: "1px solid var(--ia-border)", borderRadius: 10, background: "var(--ia-card)", padding: "16px 16px 12px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600 }}>Learning at a glance</h2>
                <p style={{ margin: "4px 0 0", color: "var(--ia-muted)", fontSize: 10 }}>Fellowship 2024 · this week</p>
              </div>
              <button type="button" onClick={() => setActiveItem("Progress")} style={{ border: 0, background: "transparent", color: "var(--ia-primary)", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>View progress <ArrowUpRight size={11} style={{ verticalAlign: "-2px" }} /></button>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 7, height: 96, marginTop: 16, padding: "0 3px 3px", borderBottom: "1px solid var(--ia-border)" }}>
              {[42, 57, 49, 73, 62, 78, 68].map((height, index) => (
                <div key={index} style={{ display: "flex", flex: 1, flexDirection: "column", alignItems: "center", gap: 6, height: "100%", justifyContent: "flex-end" }}>
                  <div style={{ width: "100%", maxWidth: 24, height: `${height}%`, borderRadius: "4px 4px 1px 1px", background: index === 5 ? "#b27454" : "var(--ia-primary-soft)" }} />
                  <span style={{ color: "var(--ia-muted)", fontSize: 8 }}>{["M", "T", "W", "T", "F", "S", "S"][index]}</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 18, marginTop: 13 }}>
              <div><div style={{ color: "var(--ia-muted)", fontSize: 9 }}>Active fellows</div><div style={{ marginTop: 3, color: "var(--ia-primary)", fontSize: 15, fontWeight: 700 }}>43 <span style={{ color: "#849d74", fontSize: 9 }}>↑ 3</span></div></div>
              <div><div style={{ color: "var(--ia-muted)", fontSize: 9 }}>Pod check-ins</div><div style={{ marginTop: 3, color: "var(--ia-primary)", fontSize: 15, fontWeight: 700 }}>31 <span style={{ color: "var(--ia-muted)", fontSize: 9 }}>/ 48</span></div></div>
            </div>
          </div>

          <div style={{ border: "1px solid var(--ia-border)", borderRadius: 10, background: "var(--ia-card)", padding: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ margin: 0, fontFamily: "'Playfair Display', serif", fontSize: 18, fontWeight: 600 }}>Recent activity</h2>
                <p style={{ margin: "4px 0 0", color: "var(--ia-muted)", fontSize: 10 }}>Across your workspace</p>
              </div>
              <MoreHorizontal size={16} color="var(--ia-muted)" />
            </div>
            <div style={{ marginTop: 12 }}>
              {activity.map((item) => (
                <div key={item.name} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 0", borderBottom: "1px solid var(--ia-border)" }}>
                  <div style={{ display: "grid", placeItems: "center", width: 25, height: 25, flex: "0 0 25px", borderRadius: "50%", background: item.tone === "sage" ? "#d9e5d7" : item.tone === "ochre" ? "#eadfc4" : "#ead9d2", color: "var(--ia-primary)", fontSize: 8, fontWeight: 700 }}>{item.initials}</div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ overflow: "hidden", color: "var(--ia-foreground)", fontSize: 9.5, fontWeight: 600, textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.name} <span style={{ color: "var(--ia-muted)", fontWeight: 400 }}>{item.detail}</span></div>
                    <div style={{ marginTop: 2, color: "var(--ia-muted)", fontSize: 8.5 }}>{item.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, borderTop: "1px solid var(--ia-border)", paddingTop: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <CheckCircle2 size={15} color="#849d74" />
            <span style={{ color: "var(--ia-muted)", fontSize: 10 }}>Next live session</span>
            <strong style={{ fontSize: 10 }}>Designing for access</strong>
            <span style={{ color: "var(--ia-muted)", fontSize: 10 }}>Tomorrow, 10:00 AM</span>
          </div>
          <button type="button" onClick={() => setActiveItem("Events")} style={{ border: 0, background: "transparent", color: "var(--ia-primary)", fontSize: 10, fontWeight: 700, cursor: "pointer" }}>Open calendar <ArrowUpRight size={11} style={{ verticalAlign: "-2px" }} /></button>
        </section>
      </main>
    </div>
  );
}