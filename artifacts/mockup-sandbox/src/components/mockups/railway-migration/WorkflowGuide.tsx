import { useState } from "react";
import {
  ArrowDownToLine,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  Copy,
  Database,
  Download,
  FileText,
  GitBranch,
  Globe2,
  HardDrive,
  LockKeyhole,
  Menu,
  Network,
  Printer,
  Server,
  ShieldCheck,
  Terminal,
} from "lucide-react";

const phases = [
  ["01", "Readiness", "Day 1", "Audit & owners"],
  ["02", "Foundation", "Days 2–3", "GitHub, Railway, Postgres"],
  ["03", "Migrate", "Days 4–6", "Secrets, storage, data"],
  ["04", "Launch", "Days 7–10", "Cutover & hypercare"],
] as const;

const sequence = [
  {
    day: "D01",
    title: "Readiness & audit",
    owner: "Migration lead",
    tag: "GO / NO-GO",
    icon: FileText,
    text: "Confirm repository access, current runtime, data inventory, vendor contacts and a named rollback owner. Freeze feature work after the audit.",
    checks: ["Production backup verified", "Domain / DNS access confirmed", "Rollback owner on-call"],
  },
  {
    day: "D02",
    title: "GitHub + Railway setup",
    owner: "Platform engineer",
    tag: "FOUNDATION",
    icon: GitBranch,
    text: "Connect the production repository to a Railway project. Pin the Node version, select the production branch and keep deploys manual until staging is green.",
    checks: ["Railway project + service created", "Branch protection enabled", "Build logs visible to team"],
  },
  {
    day: "D03",
    title: "Provision Postgres",
    owner: "Data owner",
    tag: "FOUNDATION",
    icon: Database,
    text: "Add Railway Postgres in the same region as the application. Capture DATABASE_URL from the service reference, never from a chat message.",
    checks: ["DATABASE_URL resolves", "Connection limit reviewed", "Daily backups enabled"],
  },
  {
    day: "D04",
    title: "Variables & secrets",
    owner: "Platform engineer",
    tag: "SECURITY",
    icon: LockKeyhole,
    text: "Add the inventory below to Railway Variables. Use separate staging values, rotate any copied credentials and do not commit .env files.",
    checks: ["All required variables present", "Production values reviewed", "Session secret rotated"],
  },
  {
    day: "D05",
    title: "Object-storage decision + copy",
    owner: "Product + data owner",
    tag: "DECISION",
    icon: HardDrive,
    text: "Inventory protected uploads in Replit Object Storage and legacy R2 paths, then copy required objects to the chosen S3-compatible store. Preserve keys and verify samples across file sizes.",
    checks: ["Destination recorded", "Object count reconciled", "Private read path tested"],
  },
  {
    day: "D06",
    title: "Staging deployment",
    owner: "Platform engineer",
    tag: "VERIFY",
    icon: Server,
    text: "Deploy the pinned commit to a staging service. Run the smoke path: sign in, create a record, upload a file, send a callback, restart the service.",
    checks: ["Build and start both pass", "/api/health returns 200", "Session survives restart"],
  },
  {
    day: "D07",
    title: "Export, import & checks",
    owner: "Data owner",
    tag: "MIGRATE",
    icon: ArrowDownToLine,
    text: "Put the source in maintenance mode, take a final export, restore into Railway Postgres and run startup migrations. Reconcile counts before opening staging.",
    checks: ["Export checksum recorded", "Migrations complete cleanly", "Users / applications reconcile"],
  },
  {
    day: "D08",
    title: "Provider callbacks & webhooks",
    owner: "Integrations owner",
    tag: "INTEGRATIONS",
    icon: Network,
    text: "Update callback, OAuth and webhook URLs at each provider. Verify raw-body handling where signatures are checked, then send one real delivery per integration.",
    checks: ["Callback URLs updated", "Webhook signature verified", "Duplicate delivery is idempotent"],
  },
  {
    day: "D09",
    title: "DNS cutover",
    owner: "Migration lead",
    tag: "CUTOVER",
    icon: Globe2,
    text: "Lower TTL ahead of the window, confirm the Railway domain and then switch the canonical record. Keep the old service read-only until acceptance is signed.",
    checks: ["TTL lowered", "TLS certificate active", "Smoke test from external network"],
  },
  {
    day: "D10",
    title: "Hypercare + rollback window",
    owner: "All owners",
    tag: "24–48 HRS",
    icon: ShieldCheck,
    text: "Watch health, error rate, queue latency, auth and uploads for 24–48 hours. Roll back if critical paths fail or data integrity cannot be explained quickly.",
    checks: ["On-call rota published", "Rollback command rehearsed", "Decision log closed"],
  },
] as const;

const secrets = [
  "DATABASE_URL", "SESSION_SECRET", "APP_BASE_URL",
  "R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY",
  "R2_BUCKET_NAME", "R2_PUBLIC_URL", "RESEND_API_KEY",
  "ZOOM_CLIENT_ID", "ZOOM_CLIENT_SECRET", "ZOOM_REDIRECT_URI",
  "ZOOM_WEBHOOK_SECRET_TOKEN", "AI_INTEGRATIONS_OPENAI_API_KEY",
  "AI_INTEGRATIONS_OPENAI_BASE_URL",
];

export function WorkflowGuide() {
  const [activePhase, setActivePhase] = useState("01");
  const [menuOpen, setMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyInventory = () => {
    navigator.clipboard?.writeText(secrets.join("\n"));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen bg-[#f3f6f1] text-[#18342d] antialiased">
      <header className="sticky top-0 z-20 border-b border-[#d8e2d8] bg-[#f3f6f1]/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between px-5 py-4 lg:px-10">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#174d3e] text-sm font-bold text-[#d9efad]">A</div>
            <div>
              <div className="text-[15px] font-bold tracking-[0.18em] text-[#174d3e]">AFÁRÁ</div>
              <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-[#71867d]">Operations office</div>
            </div>
          </div>
          <div className="hidden items-center gap-7 text-xs font-semibold text-[#557067] md:flex">
            <span>Planning pack</span><span className="text-[#afc0b5]">/</span><span>Railway migration</span>
            <button onClick={() => window.print()} className="flex items-center gap-2 rounded-md border border-[#c8d7cc] bg-[#fbfcf9] px-3 py-2 text-[#174d3e] transition hover:border-[#174d3e]"><Printer size={14} /> Print / PDF</button>
          </div>
          <button className="rounded-md p-2 text-[#174d3e] md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle menu"><Menu size={20} /></button>
        </div>
        {menuOpen && <div className="border-t border-[#d8e2d8] px-5 py-3 text-xs font-semibold text-[#557067] md:hidden">Planning pack <span className="mx-2 text-[#afc0b5]">/</span> Railway migration</div>}
      </header>

      <main className="mx-auto max-w-[1320px] px-5 pb-20 lg:px-10">
        <section className="grid gap-10 border-b border-[#d8e2d8] py-12 lg:grid-cols-[1fr_340px] lg:py-16">
          <div>
            <div className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.16em] text-[#567b55]"><span className="h-2 w-2 rounded-full bg-[#a3c957]" /> Internal · v1.0 · 04 Sep 2026</div>
            <h1 className="max-w-3xl text-4xl font-semibold leading-[1.06] tracking-[-0.04em] text-[#174d3e] sm:text-5xl lg:text-6xl">Railway migration<br /><span className="text-[#6f8c78]">workflow & setup guide</span></h1>
            <p className="mt-6 max-w-2xl text-base leading-7 text-[#557067]">A ten-day operating sequence for moving the AFÁRÁ application to Railway without losing the thread between infrastructure, data and the people who depend on it.</p>
            <div className="mt-8 flex flex-wrap gap-2">
              <span className="rounded-full bg-[#174d3e] px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-[#e7f2da]">Decision-ready</span>
              <span className="rounded-full border border-[#c8d7cc] bg-[#fbfcf9] px-3 py-1.5 text-[11px] font-semibold text-[#557067]">Owner-led</span>
              <span className="rounded-full border border-[#c8d7cc] bg-[#fbfcf9] px-3 py-1.5 text-[11px] font-semibold text-[#557067]">Rollback-aware</span>
            </div>
          </div>
          <div className="rounded-xl border border-[#cadacb] bg-[#e5eee2] p-6">
            <div className="mb-6 flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.15em] text-[#567b55]">At a glance</span><Clock3 size={18} className="text-[#6f8c78]" /></div>
            <div className="space-y-4">
              { [["10", "working days"], ["04", "owner roles"], ["24–48h", "hypercare window"]].map(([value, label]) => <div key={label} className="flex items-end justify-between border-b border-[#c7d8c5] pb-3"><span className="text-2xl font-semibold tracking-tight text-[#174d3e]">{value}</span><span className="text-xs font-medium text-[#668075]">{label}</span></div>)}
            </div>
            <div className="mt-6 flex items-start gap-2 text-xs leading-5 text-[#557067]"><CircleAlert size={15} className="mt-0.5 shrink-0 text-[#8a6b35]" /> No cutover without a verified export, health check and named rollback owner.</div>
          </div>
        </section>

        <section className="border-b border-[#d8e2d8] py-7">
          <div className="mb-4 flex items-center justify-between"><h2 className="text-xs font-bold uppercase tracking-[0.16em] text-[#567b55]">The operating sequence</h2><span className="text-xs text-[#789086]">Select a workstream</span></div>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {phases.map(([num, title, days, detail]) => <button key={num} onClick={() => setActivePhase(num)} className={`group flex items-center gap-3 rounded-lg border p-3 text-left transition ${activePhase === num ? "border-[#174d3e] bg-[#174d3e] text-[#eef5e9]" : "border-[#d8e2d8] bg-[#fbfcf9] text-[#557067] hover:border-[#91ac99]"}`}><span className={`font-mono text-[11px] ${activePhase === num ? "text-[#b7d77b]" : "text-[#8aa093]"}`}>{num}</span><span className="min-w-0"><span className="block text-sm font-bold">{title}</span><span className={`block text-[11px] ${activePhase === num ? "text-[#bdd0c1]" : "text-[#80958b]"}`}>{days} · {detail}</span></span><ChevronRight size={15} className="ml-auto shrink-0 opacity-60" /></button>)}
          </div>
        </section>

        <section className="grid gap-10 py-10 lg:grid-cols-[1fr_300px]">
          <div>
            <div className="mb-6 flex items-end justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-[#567b55]">Day-by-day runbook</p><h2 className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[#174d3e]">Move in sequence. Prove each gate.</h2></div><span className="hidden text-xs text-[#789086] sm:block">10 steps · 1 owner per decision</span></div>
            <div className="space-y-3">
              {sequence.map(({ day, title, owner, tag, icon: Icon, text, checks }) => <article key={day} className="group rounded-xl border border-[#d8e2d8] bg-[#fbfcf9] p-5 transition hover:border-[#9bb39e] hover:shadow-[0_8px_24px_rgba(32,74,53,0.06)] sm:p-6"><div className="flex gap-4"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#e5eee2] text-[#3d6d54]"><Icon size={18} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><span className="font-mono text-[11px] font-bold text-[#8ba194]">{day}</span><h3 className="mt-1 text-[17px] font-bold text-[#174d3e]">{title}</h3></div><span className="rounded bg-[#edf3e8] px-2 py-1 text-[10px] font-bold tracking-wider text-[#63805e]">{tag}</span></div><p className="mt-3 max-w-3xl text-sm leading-6 text-[#60776d]">{text}</p><div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 border-t border-[#e4ebe3] pt-3">{checks.map((check) => <span key={check} className="flex items-center gap-1.5 text-[11px] font-medium text-[#668075]"><Check size={13} className="text-[#76a653]" />{check}</span>)}</div><div className="mt-3 text-[11px] font-bold uppercase tracking-[0.12em] text-[#91a29a]">Owner · <span className="text-[#557067]">{owner}</span></div></div></div></article>)}
            </div>
          </div>

          <aside className="space-y-4">
            <div className="rounded-xl border border-[#cadacb] bg-[#e5eee2] p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#567b55]"><Terminal size={15} /> Railway settings</div><div className="mt-5 space-y-4 font-mono text-xs"><div><div className="mb-1 font-sans text-[10px] font-bold uppercase tracking-wider text-[#789086]">Build command</div><div className="rounded-md bg-[#174d3e] px-3 py-2 text-[#d9efad]">npm run build</div></div><div><div className="mb-1 font-sans text-[10px] font-bold uppercase tracking-wider text-[#789086]">Start command</div><div className="rounded-md bg-[#174d3e] px-3 py-2 text-[#d9efad]">npm run start</div></div><div><div className="mb-1 font-sans text-[10px] font-bold uppercase tracking-wider text-[#789086]">Health check</div><div className="rounded-md bg-[#174d3e] px-3 py-2 text-[#d9efad]">/api/health</div></div><div className="flex items-start gap-2 border-t border-[#c7d8c5] pt-3 font-sans text-[11px] leading-5 text-[#557067]"><Server size={14} className="mt-0.5 shrink-0 text-[#567b55]" /> Listen on Railway <strong>PORT</strong>; do not hard-code a port.</div></div></div>
            <div className="rounded-xl border border-[#d8e2d8] bg-[#fbfcf9] p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#567b55]"><ShieldCheck size={15} /> Non-negotiables</div><ul className="mt-4 space-y-3 text-xs leading-5 text-[#60776d]"><li className="flex gap-2"><CheckCircle2 size={15} className="shrink-0 text-[#76a653]" />Database-backed sessions via <code className="text-[11px]">connect-pg-simple</code>.</li><li className="flex gap-2"><CheckCircle2 size={15} className="shrink-0 text-[#76a653]" />Run startup migrations before accepting traffic.</li><li className="flex gap-2"><CheckCircle2 size={15} className="shrink-0 text-[#76a653]" />50 MB JSON, form and upload body constraint.</li></ul></div>
            <div className="rounded-xl border border-[#d8e2d8] bg-[#fbfcf9] p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#567b55]"><LockKeyhole size={15} /> Secret inventory</div><button onClick={copyInventory} className="flex items-center gap-1 text-[11px] font-bold text-[#63805e] hover:text-[#174d3e]">{copied ? <Check size={13} /> : <Copy size={13} />}{copied ? "Copied" : "Copy names"}</button></div><p className="mt-3 text-[11px] leading-5 text-[#80958b]">Names only. Values belong in Railway Variables.</p><div className="mt-3 flex flex-wrap gap-1.5">{secrets.map((secret) => <code key={secret} className="rounded bg-[#edf3e8] px-2 py-1 text-[10px] text-[#557067]">{secret}</code>)}</div></div>
            <div className="rounded-xl border border-[#cbbd9f] bg-[#f5eddb] p-5"><div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-[#8a6b35]"><CircleAlert size={15} /> Rollback triggers</div><p className="mt-3 text-xs leading-5 text-[#725f3d]">Rollback immediately for sustained 5xx errors, failed sign-in or callbacks, missing uploads, session loss after restart, or any unexplained data mismatch.</p><div className="mt-4 flex items-center gap-2 text-[11px] font-bold text-[#8a6b35]"><ArrowUpRight size={14} /> Keep source read-only through acceptance.</div></div>
          </aside>
        </section>

        <footer className="flex flex-col gap-4 border-t border-[#d8e2d8] pt-6 text-xs text-[#789086] sm:flex-row sm:items-center sm:justify-between"><div><span className="font-bold text-[#557067]">AFÁRÁ operations</span> · Internal planning document · Owner: migration lead</div><div className="flex items-center gap-2"><Download size={14} /> Prepared for a calm, observable cutover</div></footer>
      </main>
    </div>
  );
}

export default WorkflowGuide;