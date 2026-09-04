import { ArrowUpRight, Check, CircleAlert, Cloud, Database, Gauge, HardDrive, Info, Layers3, Server, ShieldCheck } from "lucide-react";

const rateRows = [
  ["Plan minimum", "Hobby $5 / mo · Pro $20 / mo"],
  ["RAM", "$10 / GB-month"],
  ["CPU", "$20 / vCPU-month"],
  ["Egress", "$0.05 / GB"],
  ["Volume", "$0.15 / GB-month"],
];

const scenarios = [
  {
    name: "Minimum practical",
    tag: "Lean baseline",
    total: "$8.85",
    naira: "₦11,762",
    note: "Hobby minimum applies",
    items: ["Web · 0.35 GB · 0.05 vCPU", "DB · 0.25 GB · 0.03 vCPU", "5 GB volume · 10 GB egress"],
    tint: "border-slate-200 bg-white",
  },
  {
    name: "Expected production",
    tag: "Recommended starting point",
    total: "$20.00",
    naira: "₦26,580",
    note: "$17 usage, Pro minimum applies",
    items: ["Web · 0.6 GB · 0.1 vCPU", "DB · 0.5 GB · 0.05 vCPU", "10 GB volume · 30 GB egress"],
    tint: "border-emerald-300 bg-emerald-50/60",
  },
  {
    name: "Higher traffic",
    tag: "Growth stress case",
    total: "$56.50",
    naira: "₦75,089",
    note: "Usage estimate; no plan floor",
    items: ["Web · 2 replicas × 0.6 GB · 0.125 vCPU", "DB · 1 GB · 0.15 vCPU", "30 GB volume · 100 GB egress"],
    tint: "border-slate-200 bg-slate-50",
  },
];

const controls = [
  "Start on Pro with explicit service limits; review usage after 7–14 days.",
  "Set a monthly spend alert before production traffic is enabled.",
  "Keep one owner for Railway billing and one reviewer for monthly variance.",
  "Right-size from measured usage; do not increase limits pre-emptively.",
];

export function CostSheet() {
  return (
    <main className="min-h-[100dvh] bg-[#f3f6f1] px-4 py-6 text-[#19352b] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1180px]">
        <header className="mb-5 flex flex-col justify-between gap-5 border-b border-[#cbd8ce] pb-5 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#557365]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e4b39] text-white"><Layers3 size={16} /></span>
              AFÁRÁ / OPERATIONS PACK
            </div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-[#758b7c]">Railway migration planning · cost sheet</p>
            <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-[#15372a] sm:text-5xl">A clear monthly envelope for the first release.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5d7567]">Infrastructure assumptions translated into budget decisions for an executive review. Values below are estimates, not measured usage.</p>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-[#b9ccbd] bg-[#e5eee6] px-3 py-2 text-xs font-semibold text-[#24553f] md:self-end">
            <Check size={14} /> Prepared 04 Sep 2026
          </div>
        </header>

        <section className="mb-5 grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="rounded-2xl border border-[#d5e0d7] bg-[#fbfcfa] p-5 shadow-[0_12px_30px_rgba(38,75,56,0.06)] sm:p-7">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b8374]">Executive readout</p>
                <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">Budget the expected production path at <span className="text-[#1d7550]">$20 / month</span>.</h2>
              </div>
              <Gauge className="mt-1 text-[#3d8765]" size={25} />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-[#eaf2eb] p-4"><p className="text-xs text-[#64806f]">Expected Railway</p><p className="mt-1 text-2xl font-semibold">$20.00</p><p className="mt-1 text-xs text-[#668071]">≈ ₦26,580 / mo</p></div>
              <div className="rounded-xl bg-[#f2eee3] p-4"><p className="text-xs text-[#81755d]">Higher traffic</p><p className="mt-1 text-2xl font-semibold text-[#735b2b]">$56.50</p><p className="mt-1 text-xs text-[#81755d]">≈ ₦75,089 / mo</p></div>
              <div className="rounded-xl bg-[#edf0ed] p-4"><p className="text-xs text-[#6a7c70]">Next decision</p><p className="mt-1 text-base font-semibold">Measure, then right-size</p><p className="mt-1 text-xs text-[#6a7c70]">after 7–14 days</p></div>
            </div>
            <div className="mt-6 flex gap-3 border-t border-[#e0e8e0] pt-5 text-sm leading-6 text-[#5d7567]">
              <Info className="mt-1 shrink-0 text-[#4a8b67]" size={16} />
              The $17 expected usage estimate is below Railway’s Pro plan minimum, so the payable monthly minimum is $20.
            </div>
          </div>
          <div className="rounded-2xl bg-[#1e4b39] p-6 text-[#e7f1e7] shadow-[0_12px_30px_rgba(38,75,56,0.12)]">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#a7cdb2]">Starting limits</p>
            <h2 className="mt-2 text-xl font-semibold tracking-[-0.02em]">Conservative by default.</h2>
            <div className="mt-6 space-y-4">
              <div className="flex items-center justify-between border-b border-[#4a705c] pb-3"><span className="flex items-center gap-2 text-sm"><Server size={16} className="text-[#a7cdb2]" /> Web · single replica</span><b className="text-sm">1 vCPU / 1 GB</b></div>
              <div className="flex items-center justify-between border-b border-[#4a705c] pb-3"><span className="flex items-center gap-2 text-sm"><Database size={16} className="text-[#a7cdb2]" /> Database</span><b className="text-sm">1 vCPU / 1 GB</b></div>
              <p className="pt-1 text-xs leading-5 text-[#bed8c2]">Apply limits now. Observe real traffic, memory pressure, and database growth before changing them.</p>
            </div>
          </div>
        </section>

        <section className="mb-5 rounded-2xl border border-[#d5e0d7] bg-[#fbfcfa] p-5 sm:p-7">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b8374]">Scenario comparison</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">Three operating envelopes</h2></div>
            <p className="text-xs text-[#718477]">USD / month · conversion shown for planning only</p>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {scenarios.map((scenario) => (
              <article key={scenario.name} className={`rounded-xl border p-5 ${scenario.tint}`}>
                <div className="flex items-start justify-between gap-2"><div><h3 className="font-semibold">{scenario.name}</h3><p className="mt-1 text-xs text-[#6b8374]">{scenario.tag}</p></div><ArrowUpRight size={16} className="text-[#7b9684]" /></div>
                <div className="mt-6 flex items-end justify-between border-b border-[#dbe5dc] pb-4"><div><span className="text-3xl font-semibold tracking-[-0.04em]">{scenario.total}</span><span className="ml-1 text-xs text-[#789080]">/ mo</span></div><span className="text-sm font-semibold text-[#377451]">{scenario.naira}</span></div>
                <ul className="mt-4 space-y-2 text-xs leading-5 text-[#60786a]">{scenario.items.map((item) => <li key={item} className="flex gap-2"><span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-[#5e9975]" />{item}</li>)}</ul>
                <p className="mt-4 text-[11px] font-medium text-[#789080]">{scenario.note}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-[#f0f4ef] px-4 py-3 text-xs leading-5 text-[#61786a]"><b className="text-[#315c45]">Formula:</b> (RAM GB × $10) + (vCPU × $20) + (volume GB × $0.15) + (egress GB × $0.05), subject to the plan minimum. For replicas, multiply the web resources by replica count.</div>
        </section>

        <section className="mb-5 grid gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="rounded-2xl border border-[#d5e0d7] bg-[#fbfcfa] p-5 sm:p-7">
            <div className="mb-4 flex items-center gap-3"><span className="rounded-lg bg-[#e4efe7] p-2 text-[#367353]"><HardDrive size={18} /></span><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b8374]">Storage alternative</p><h2 className="mt-1 text-lg font-semibold">Cloudflare R2 rates</h2></div></div>
            <div className="divide-y divide-[#e2e9e2] border-y border-[#e2e9e2]">
              {[["Storage", "10 GB-month free · then $0.015 / GB-month"], ["Class A operations", "1m free · then $4.50 / million"], ["Class B operations", "10m free · then $0.36 / million"], ["Egress", "Free"]].map(([label, value]) => <div key={label} className="flex justify-between gap-4 py-3 text-xs"><span className="font-semibold text-[#486555]">{label}</span><span className="text-right text-[#6c8174]">{value}</span></div>)}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#718477]">R2 is the preferred home for uploaded media and other objects that should not consume Railway volume.</p>
          </div>
          <div className="rounded-2xl border border-[#d5e0d7] bg-[#fbfcfa] p-5 sm:p-7">
            <div className="mb-4 flex items-center gap-3"><span className="rounded-lg bg-[#f2eee3] p-2 text-[#94743b]"><ShieldCheck size={18} /></span><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b8374]">Governance</p><h2 className="mt-1 text-lg font-semibold">Spending controls</h2></div></div>
            <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{controls.map((control, i) => <div key={control} className="flex gap-3 text-xs leading-5 text-[#62796b]"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#e6efe7] text-[10px] font-bold text-[#377451]">{i + 1}</span>{control}</div>)}</div>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#d5e0d7] bg-[#eef3ee] p-5 sm:p-7"><div className="flex items-center gap-2 text-sm font-semibold"><CircleAlert size={17} className="text-[#92733d]" /> Assumptions & exclusions</div><ul className="mt-4 space-y-2 text-xs leading-5 text-[#62796b]"><li>• One always-on web service and one database service; no autoscaling assumed.</li><li>• Estimates exclude build minutes, backup products, support, taxes, domain, email, observability, and third-party SaaS.</li><li>• ₦ figures use an illustrative ₦1,329 / $ conversion for planning; confirm treasury rate at approval.</li><li>• Rates are recorded as of 4 Sep 2026 and should be rechecked before commitment.</li></ul></div>
          <div className="rounded-2xl border border-[#d5e0d7] bg-[#fbfcfa] p-5 sm:p-7"><div className="flex items-center gap-2 text-sm font-semibold"><Cloud size={17} className="text-[#3e7f5b]" /> Sources</div><div className="mt-4 space-y-3 text-xs leading-5 text-[#557365]"><a className="block break-all underline decoration-[#b5cbb9] underline-offset-2 hover:text-[#1d7550]" href="https://railway.com/pricing" target="_blank" rel="noreferrer">https://railway.com/pricing</a><a className="block break-all underline decoration-[#b5cbb9] underline-offset-2 hover:text-[#1d7550]" href="https://docs.railway.com/pricing" target="_blank" rel="noreferrer">https://docs.railway.com/pricing</a><a className="block break-all underline decoration-[#b5cbb9] underline-offset-2 hover:text-[#1d7550]" href="https://developers.cloudflare.com/r2/pricing/" target="_blank" rel="noreferrer">https://developers.cloudflare.com/r2/pricing/</a></div></div>
        </section>
        <footer className="py-6 text-[11px] text-[#819388]">AFÁRÁ · Internal planning document · Railway migration / 01</footer>
      </div>
    </main>
  );
}

export default CostSheet;