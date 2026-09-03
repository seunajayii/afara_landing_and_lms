import "./_group.css";
import {
  Award, BarChart2, BookOpen, Calendar, ClipboardCheck, FileText,
  FolderOpen, LayoutDashboard, Mail, Network, Shield, TrendingUp, Users,
} from "lucide-react";

const items = [
  ["Dashboard", LayoutDashboard],
  ["Applications", FileText],
  ["Cohorts", FolderOpen],
  ["Cohort Analytics", BarChart2],
  ["Learning Pods", Network],
  ["Progress Reporting", TrendingUp],
  ["Assignments", ClipboardCheck],
  ["Course Management", BookOpen],
  ["User Management", Users],
  ["Resource Management", FolderOpen],
  ["Event Management", Calendar],
  ["Certificate Management", Award],
  ["Newsletter", Mail],
] as const;

export function CurrentAdmin() {
  return (
    <div className="min-h-screen flex" style={{ background: "var(--ia-background)" }}>
      <aside style={{ width: 248, flexShrink: 0, background: "var(--ia-sidebar)", borderRight: "1px solid var(--ia-sidebar-border)" }}>
        <div style={{ padding: "24px 22px 20px", borderBottom: "1px solid var(--ia-sidebar-border)" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 27, fontWeight: 700, letterSpacing: "-1px", color: "var(--ia-primary)" }}>AFÁRÁ</div>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 10, color: "var(--ia-primary)", fontSize: 11, fontWeight: 600 }}>
            <Shield size={13} /> Admin Portal
          </div>
        </div>
        <nav style={{ padding: "18px 12px" }}>
          {items.map(([label, Icon], index) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 11, padding: "10px 11px", marginBottom: 2, borderRadius: 6, background: index === 0 ? "var(--ia-sidebar-accent)" : "transparent", color: index === 0 ? "var(--ia-foreground)" : "var(--ia-muted)", fontSize: 12 }}>
              <Icon size={15} strokeWidth={1.8} />
              <span>{label}</span>
            </div>
          ))}
        </nav>
      </aside>
      <main style={{ padding: 30, flex: 1 }}>
        <p style={{ color: "var(--ia-primary)", fontSize: 11, fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase", margin: "4px 0 10px" }}>Current structure</p>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 29, margin: 0 }}>Admin dashboard</h1>
        <p style={{ color: "var(--ia-muted)", fontSize: 13, lineHeight: 1.5, maxWidth: 290 }}>Every destination is presented as a top-level item, regardless of the workflow it belongs to.</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginTop: 24 }}>
          {["Applications", "Cohorts", "Courses", "Events"].map((label) => <div key={label} style={{ background: "var(--ia-card)", border: "1px solid var(--ia-border)", borderRadius: 8, padding: 16 }}><div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div><div style={{ width: 48, height: 7, borderRadius: 5, background: "var(--ia-primary-soft)", marginTop: 13 }} /></div>)}
        </div>
      </main>
    </div>
  );
}