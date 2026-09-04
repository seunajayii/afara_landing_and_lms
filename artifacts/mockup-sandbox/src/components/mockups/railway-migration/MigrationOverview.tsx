import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronDown,
  Cloud,
  Copy,
  Database,
  ExternalLink,
  FileSearch,
  HardDrive,
  Info,
  Layers3,
  LockKeyhole,
  Mail,
  MoreHorizontal,
  Network,
  Play,
  Rocket,
  Server,
  ShieldCheck,
  Timer,
  UploadCloud,
  Webhook,
  X,
  Zap,
} from "lucide-react";
import { useState } from "react";

const phases = [
  ["01", "Audit", "Map routes, jobs, secrets, integrations", "Done"],
  ["02", "Provision", "Create Railway project, service, and PostgreSQL", "Ready"],
  ["03", "Data prep", "Export schema, inventory objects, freeze writes", "Queued"],
  ["04", "App deploy", "Build Node / Express service with health checks", "Queued"],
  ["05", "Data move", "Restore database and copy protected objects", "Queued"],
  ["06", "Integrations", "Verify callbacks, email, video, and AI services", "Queued"],
  ["07", "Cutover", "Switch DNS, monitor errors, keep rollback open", "Queued"],
  ["08", "Cleanup", "Decommission Replit resources after sign-off", "Queued"],
];

const risks = [
  { title: "Object Storage data copy", detail: "Replit Object Storage is not a drop-in Railway volume. Copy and checksum protected objects before cutover.", level: "High", icon: HardDrive },
  { title: "Database consistency", detail: "Freeze writes for the final export; validate row counts and foreign-key checks before opening traffic.", level: "High", icon: Database },
  { title: "50 MB request limit", detail: "Large uploads need direct-to-object-storage flows or resumable upload handling, not the web service.", level: "High", icon: UploadCloud },
  { title: "Callbacks & webhooks", detail: "Zoom and YouTube callbacks must use the new public URL and be replay-tested after DNS changes.", level: "Medium", icon: Webhook },
  { title: "Startup migrations", detail: "Run migrations as a controlled release step; do not let every web replica migrate on boot.", level: "Medium", icon: Rocket },
];

const scenarios = [
  { name: "Hobby", label: "Minimum", cost: "$8.85", note: "small cohort / low traffic", tone: "bg-[#e9f0e8]" },
  { name: "Pro", label: "Expected", cost: "$20", note: "recommended starting point", tone: "bg-[#dfece4]" },
  { name: "Pro", label: "Higher traffic", cost: "$56.50", note: "more egress + service usage", tone: "bg-[#f4ead8]" },
];

function Pill({ children, tone = "green" }: { children: React.ReactNode; tone?: "green" | "amber" | "slate" }) {
  const styles = { green: "bg-[#e4eee4] text-[#275c43]", amber: "bg-[#f5ecd9] text-[#896b2e]", slate: "bg-[#edf0ed] text-[#617069]" };
  return <span className={`inline-flex items-center rounded-full px-2 py-1 text-[10px] font-semibold tracking-[.04em] ${styles[tone]}`}>{children}</span>;
}

export function MigrationOverview() {
  const [activePhase, setActivePhase] = useState(0);
  const [scenario, setScenario] = useState(1);
  const [showNotes, setShowNotes] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyPlan = async () => {
    await navigator.clipboard?.writeText("AFÁRÁ Railway migration plan — 10 business days, indicative.");
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <main className="min-h-[100dvh] bg-[#f5f7f3] text-[#20352b] selection:bg-[#c9dfce]">
      <div className="mx-auto max-w-[1440px] px-4 py-5 sm:px-8 lg:px-12">
        <header className="flex flex-wrap items-start justify-between gap-5 border-b border-[#d8e1d8] pb-5">
          <div className="flex items-start gap-4">
            <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#164c39] text-[#f6f6ee] shadow-[0_6px_16px_rgba(31,74,51,.16)]">
              <Network size={22} strokeWidth={1.7} />
            </div>
            <div>
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#638071]"><span>AFÁRÁ / OPERATIONS</span><span className="h-1 w-1 rounded-full bg-[#bd8750]" /> Planning pack</div>
              <h1 className="mt-1 font-serif text-3xl font-medium tracking-[-.04em] text-[#183c2e] sm:text-[38px]">Railway migration overview</h1>
              <p className="mt-1 max-w-2xl text-sm text-[#697a70]">A controlled path from the current Replit runtime to a production-ready Railway foundation.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={() => setShowNotes((value) => !value)} className="inline-flex items-center gap-2 rounded-lg border border-[#ccd9ce] bg-[#fbfcf9] px-3 py-2 text-xs font-semibold text-[#365545] transition hover:border-[#9bb5a2]"><Info size={14} /> {showNotes ? "Hide notes" : "Planning notes"}</button>
            <button type="button" onClick={copyPlan} className="inline-flex items-center gap-2 rounded-lg bg-[#164c39] px-3 py-2 text-xs font-semibold text-[#f5f7ef] transition hover:bg-[#0f3d2d]">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "Copied" : "Copy summary"}</button>
          </div>
        </header>

        {showNotes && <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#d8cda9] bg-[#fbf5e7] px-4 py-3 text-xs leading-relaxed text-[#725d31]"><Info size={16} className="mt-0.5 shrink-0" /><p><strong>Planning basis.</strong> Costs and timings are indicative, intended for a decision conversation rather than a vendor quote. Confirm service usage, egress, and object-storage volume during Phase 01.</p><button type="button" aria-label="Close planning notes" onClick={() => setShowNotes(false)} className="ml-auto"><X size={15} /></button></div>}

        <section className="mt-6 grid gap-4 lg:grid-cols-[1.45fr_.55fr]">
          <div className="relative overflow-hidden rounded-2xl bg-[#164c39] p-6 text-[#f5f5ec] shadow-[0_12px_30px_rgba(31,74,51,.14)] sm:p-8">
            <div className="pointer-events-none absolute -right-16 -top-28 h-80 w-80 rounded-full border border-[#9dbca4]/20" /><div className="pointer-events-none absolute -right-5 -top-16 h-56 w-56 rounded-full border border-[#9dbca4]/20" />
            <div className="relative">
              <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#b8d0bb]"><ShieldCheck size={14} /> Decision frame</div>
              <h2 className="mt-4 max-w-3xl font-serif text-3xl leading-[1.05] tracking-[-.035em] sm:text-[43px]">Move the application,<br /><span className="text-[#c8ddbd]">not the uncertainty.</span></h2>
              <p className="mt-5 max-w-xl text-sm leading-relaxed text-[#d1dfd1]">Railway hosts the Node / Express web service and PostgreSQL. Protected objects move toward Cloudflare R2, while specialist services remain external and deliberately decoupled.</p>
              <div className="mt-7 flex flex-wrap items-center gap-3 text-[11px] font-semibold"><Pill tone="green">10 business days · indicative</Pill><span className="text-[#afc8b4]">Owner: Platform & Operations</span></div>
            </div>
          </div>
          <div className="rounded-2xl border border-[#d8e2d7] bg-[#fbfcf9] p-5">
            <div className="flex items-center justify-between"><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#708278]">At a glance</div><Timer size={16} className="text-[#759080]" /></div>
            <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
              {[["08", "migration phases"], ["05", "material risks"], ["03", "cost scenarios"], ["₦1,329", "planning rate / USD"]].map(([value, label]) => <div key={label}><div className="font-serif text-2xl text-[#1d543e]">{value}</div><div className="mt-1 text-[11px] leading-tight text-[#77867d]">{label}</div></div>)}
            </div>
            <div className="mt-6 border-t border-[#e0e7df] pt-4 text-[10px] leading-relaxed text-[#87948b]">Prices are a planning estimate, as of 4 Sep 2026. NGN conversion is indicative.</div>
          </div>
        </section>

        <section className="mt-5 rounded-2xl border border-[#d8e2d7] bg-[#fbfcf9] p-5 sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#708278]">Target architecture</div><h2 className="mt-1 font-serif text-2xl tracking-[-.025em] text-[#234b38]">A smaller core, clearer boundaries</h2></div>
            <div className="flex items-center gap-2 text-[10px] text-[#78877e]"><span className="h-2 w-2 rounded-full bg-[#4e9b6e]" /> on Railway <span className="ml-2 h-2 w-2 rounded-full bg-[#bc8752]" /> external / retained</div>
          </div>
          <div className="mt-6 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <ArchCard icon={Server} title="Node / Express" sub="Railway web service" primary /><ArchCard icon={Database} title="PostgreSQL" sub="Railway managed database" primary />
            </div>
            <ArrowRight className="mx-auto rotate-90 text-[#99aa9e] lg:rotate-0" size={20} />
            <ArchCard icon={Cloud} title="Cloudflare R2" sub="Intended protected-object destination" />
            <div className="hidden h-px w-8 bg-[#ccd8cd] lg:block" />
            <div className="grid flex-1 grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2">
              <External name="Resend" icon={Mail} /><External name="Zoom" icon={Play} /><External name="YouTube" icon={Zap} /><External name="OpenAI" icon={MoreHorizontal} />
            </div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
          <div className="rounded-2xl border border-[#d8e2d7] bg-[#fbfcf9] p-5 sm:p-6">
            <div className="flex items-end justify-between gap-3"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#708278]">Delivery path</div><h2 className="mt-1 font-serif text-2xl tracking-[-.025em] text-[#234b38]">Eight phases, one owner per decision</h2></div><Pill>{phases[activePhase][3]}</Pill></div>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              {phases.map((phase, index) => <button type="button" key={phase[0]} onClick={() => setActivePhase(index)} className={`group flex items-center gap-3 rounded-xl border p-3 text-left transition ${activePhase === index ? "border-[#7cab8b] bg-[#edf5ed]" : "border-[#e2e9e1] bg-[#f9fbf8] hover:border-[#bdcec0]"}`}><span className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[10px] font-bold ${index === 0 ? "bg-[#d7ead8] text-[#2d7650]" : "bg-[#eef1ed] text-[#7d8d82]"}`}>{index === 0 ? <Check size={14} /> : phase[0]}</span><span className="min-w-0 flex-1"><span className="block text-xs font-bold text-[#345744]">{phase[1]}</span><span className="mt-0.5 block truncate text-[10px] text-[#829087]">{phase[2]}</span></span><ChevronDown size={14} className={`shrink-0 text-[#9bab9f] transition ${activePhase === index ? "-rotate-90" : "-rotate-90 opacity-0 group-hover:opacity-100"}`} /></button>)}
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl bg-[#f3f6f1] px-4 py-3 text-xs text-[#5f7165]"><FileSearch size={16} className="text-[#5e9270]" /><span><strong className="text-[#365b45]">Current focus:</strong> {phases[activePhase][2]}.</span></div>
          </div>

          <div className="rounded-2xl border border-[#d8e2d7] bg-[#fbfcf9] p-5 sm:p-6">
            <div className="flex items-end justify-between"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#708278]">Indicative runway</div><h2 className="mt-1 font-serif text-2xl tracking-[-.025em] text-[#234b38]">10 business days</h2></div><span className="text-[11px] font-semibold text-[#668071]">Day 01 → 10</span></div>
            <div className="mt-7 space-y-4">{[["01–02", "Audit + provision"], ["03–05", "Data prep + deploy"], ["06–07", "Move data + verify"], ["08–10", "Cutover + observe"]].map(([days, label], index) => <div key={days} className="flex items-center gap-3"><span className="w-12 font-mono text-[10px] text-[#8b9a8f]">{days}</span><div className="h-2 flex-1 overflow-hidden rounded-full bg-[#e7eee6]"><div className={`h-full rounded-full ${index === 0 ? "w-[22%] bg-[#4f976b]" : index === 1 ? "w-[39%] bg-[#73a982]" : index === 2 ? "w-[25%] bg-[#9bbd8d]" : "w-[30%] bg-[#c6a26e]"}`} /></div><span className="w-28 text-right text-[11px] font-semibold text-[#4f6659]">{label}</span></div>)}</div>
            <div className="mt-7 rounded-xl border border-dashed border-[#cbd9cc] px-4 py-3 text-[11px] leading-relaxed text-[#74847a]"><strong className="text-[#476350]">Gate:</strong> business sign-off after rollback rehearsal and callback verification.</div>
          </div>
        </section>

        <section className="mt-5 grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
          <div className="rounded-2xl border border-[#d8e2d7] bg-[#fbfcf9] p-5 sm:p-6">
            <div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#708278]">Monthly scenarios</div><div className="mt-1 flex flex-wrap items-baseline justify-between gap-2"><h2 className="font-serif text-2xl tracking-[-.025em] text-[#234b38]">What Railway may cost</h2><span className="text-[10px] text-[#849189]">USD / month</span></div>
            <div className="mt-5 space-y-2">{scenarios.map((item, index) => <button type="button" key={item.cost} onClick={() => setScenario(index)} className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${scenario === index ? "border-[#7cab8b] shadow-[0_3px_0_#7cab8b]" : "border-[#e1e8e0] hover:border-[#bfcfc1]"}`}><span className={`grid h-8 w-8 place-items-center rounded-lg text-[#426752] ${item.tone}`}>{index === 1 ? <CheckCircle2 size={16} /> : <Layers3 size={16} />}</span><span className="flex-1"><span className="text-xs font-bold text-[#3b5948]">{item.name} · {item.label}</span><span className="mt-0.5 block text-[10px] text-[#87958c]">{item.note}</span></span><span className="font-serif text-xl text-[#24563d]">{item.cost}</span></button>)}</div>
            <div className="mt-4 flex items-start gap-2 text-[10px] leading-relaxed text-[#839087]"><Info size={13} className="mt-0.5 shrink-0" /> Planning estimate, as of 4 Sep 2026. NGN planning rate: ₦1,329 / USD. Indicative only; excludes R2 and third-party usage.</div>
          </div>
          <div className="rounded-2xl border border-[#d8e2d7] bg-[#fbfcf9] p-5 sm:p-6">
            <div className="flex items-end justify-between gap-2"><div><div className="text-[10px] font-bold uppercase tracking-[.16em] text-[#708278]">Watchlist</div><h2 className="mt-1 font-serif text-2xl tracking-[-.025em] text-[#234b38]">Risks to retire before cutover</h2></div><AlertTriangle size={20} className="text-[#b38343]" /></div>
            <div className="mt-5 grid gap-2 sm:grid-cols-2">{risks.map(({ title, detail, level, icon: Icon }) => <div key={title} className="rounded-xl border border-[#e1e8e0] bg-[#f9fbf8] p-3"><div className="flex items-center gap-2"><Icon size={15} className={level === "High" ? "text-[#b4754e]" : "text-[#ae8a4e"} /><span className="text-xs font-bold text-[#466151]">{title}</span><span className={`ml-auto text-[9px] font-bold uppercase tracking-[.08em] ${level === "High" ? "text-[#b4754e]" : "text-[#ae8a4e]"}`}>{level}</span></div><p className="mt-2 text-[10px] leading-relaxed text-[#819087]">{detail}</p></div>)}</div>
          </div>
        </section>

        <footer className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#d8e1d8] py-5 text-[10px] text-[#85928a]"><span>AFÁRÁ · Railway migration planning pack · Prepared for decision review</span><span className="flex items-center gap-2"><LockKeyhole size={13} /> Internal planning document <ExternalLink size={12} /></span></footer>
      </div>
    </main>
  );
}

function ArchCard({ icon: Icon, title, sub, primary = false }: { icon: typeof Server; title: string; sub: string; primary?: boolean }) {
  return <div className={`flex flex-1 items-center gap-3 rounded-xl border p-4 ${primary ? "border-[#aac9b0] bg-[#edf5ed]" : "border-[#e0e7df] bg-[#f9fbf8]"}`}><div className={`grid h-9 w-9 place-items-center rounded-lg ${primary ? "bg-[#d5e8d7] text-[#3e815b]" : "bg-[#f2eadb] text-[#a77742]"}`}><Icon size={18} /></div><div><div className="text-xs font-bold text-[#3e5c4a]">{title}</div><div className="mt-1 text-[10px] leading-tight text-[#819087]">{sub}</div></div></div>;
}

function External({ name, icon: Icon }: { name: string; icon: typeof Mail }) {
  return <div className="flex items-center gap-2 rounded-lg border border-[#e4e8df] bg-[#fafbf8] px-3 py-2"><Icon size={13} className="text-[#a77a48]" /><span className="text-[10px] font-semibold text-[#6f7f75]">{name}</span></div>;
}