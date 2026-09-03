import "./_group.css";
import {
  Award, BookOpen, Calendar, ClipboardCheck, FolderOpen, LayoutDashboard,
  LogOut, MessageSquare, Shield, TrendingUp, UserCircle, Users,
} from "lucide-react";

const items = [
  ["Dashboard", LayoutDashboard],
  ["My Courses", BookOpen],
  ["Learning Pods", Users],
  ["Events", Calendar],
  ["Resources", FolderOpen],
  ["Community", MessageSquare],
  ["Certificates", Award],
  ["My Progress", TrendingUp],
  ["Assignments", ClipboardCheck],
  ["Profile", UserCircle],
] as const;

export function CurrentLMS() {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--ia-background)" }}>
      <aside style={{ width: 248, flexShrink: 0, background: "var(--ia-sidebar)", borderRight: "1px solid var(--ia-sidebar-border)" }}>
        <div style={{ padding: "24px 22px 20px", borderBottom: "1px solid var(--ia-sidebar-border)" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 27, fontWeight: 700, letterSpacing: "-1px", color: "var(--ia-primary)" }}>AFÁRÁ</div>
          <p style={{ color: "var(--ia-muted)", fontSize: 11, margin: "10px 0 0" }}>An OPSB Initiative</p>
        </div>
        <nav style={{ padding: "18px 12px" }}>
          {items.map(([label, Icon], index) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 11px", marginBottom: 2, borderRadius: 6, background: index === 0 ? "var(--ia-sidebar-accent)" : "transparent", color: index === 0 ? "var(--ia-foreground)" : "var(--ia-muted)", fontSize: 12 }}>
              <Icon size={15} strokeWidth={1.8} />
              <span>{label}</span>
            </div>
          ))}
        </nav>
        <div style={{ padding: "14px 18px", borderTop: "1px solid var(--ia-sidebar-border)", color: "var(--ia-muted)", fontSize: 11, display: "flex", alignItems: "center", gap: 9 }}><LogOut size={14} /> Log Out</div>
      </aside>
      <main style={{ padding: 30, flex: 1 }}>
        <p style={{ color: "var(--ia-primary)", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", margin: "4px 0 10px" }}>Current structure</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 29, margin: 0 }}>Welcome back, Amina</h1>
        <p style={{ color: "var(--ia-muted)", fontSize: 13, lineHeight: 1.5, maxWidth: 290 }}>Learning, programme work, community, and account actions are all peers in one long list.</p>
        <div style={{ marginTop: 24, padding: 18, borderRadius: 8, background: "var(--ia-primary)", color: "white" }}>
          <div style={{ fontSize: 11, opacity: .7 }}>CONTINUE LEARNING</div><div style={{ fontSize: 18, fontWeight: 600, marginTop: 7 }}>Financial modelling fundamentals</div><div style={{ fontSize: 12, opacity: .75, marginTop: 7 }}>Module 3 of 6 · 64% complete</div>
        </div>
      </main>
    </div>
  );
}