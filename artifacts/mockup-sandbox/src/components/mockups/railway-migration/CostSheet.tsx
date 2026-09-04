import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Cloud,
  Database,
  Gauge,
  HardDrive,
  Info,
  Layers3,
  PlayCircle,
  Server,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const usdToNgn = 1329;

const money = (value: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value % 1 ? 2 : 0,
  }).format(value);

const naira = (value: number) =>
  `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value * usdToNgn)}`;

const monthlyBase = {
  railway: 20,
  r2: 23.47 / 12,
  zoom: 14.16,
};

const monthlySubtotal = Object.values(monthlyBase).reduce((sum, value) => sum + value, 0);
const annualRecurring = monthlySubtotal * 12;
const migrationAllowance = 1200;
const septemberTokenUsage = 300;
const octoberTokenUsage = 300;
const twoMonthTokenUsage = septemberTokenUsage + octoberTokenUsage;
const firstYearTotal = annualRecurring + migrationAllowance + twoMonthTokenUsage;

const options = [
  {
    name: "Production baseline",
    recommendation: "Recommended now",
    railway: "$20 / month",
    firstYear: firstYearTotal,
    useWhen: "One production web service, one database, and video delivered directly from R2.",
    trigger: "Stay here while CPU is below 70%, memory below 75%, and peak LMS concurrency is roughly below 50.",
    tone: "border-[#88b69a] bg-[#edf6ef]",
  },
  {
    name: "Growth configuration",
    recommendation: "Move when measured",
    railway: "$56.50 / month",
    firstYear: firstYearTotal + (56.5 - 20) * 12,
    useWhen: "Two web replicas are needed for reliability or busy class periods; database and egress usage are higher.",
    trigger: "Move here after sustained CPU above 70%, memory above 75%, repeated slow requests, or 50+ concurrent LMS users.",
    tone: "border-[#d6d4c5] bg-[#faf8f0]",
  },
  {
    name: "Video through Railway",
    recommendation: "Avoid",
    railway: "$20 + video egress",
    firstYear: firstYearTotal + 27 * 12,
    useWhen: "Recordings are proxied through the app instead of delivered directly from R2.",
    trigger: "At 25 complete views per lesson, video adds about 540 GB/month and roughly $27/month in Railway egress.",
    tone: "border-[#dfc0a7] bg-[#fbf3eb]",
  },
] as const;

const quoteRows = [
  {
    icon: Sparkles,
    item: "September + October AI/token usage",
    plain: "Two exceptional iteration months only. Ongoing maintenance/retainer is excluded from this proposal.",
    monthly: septemberTokenUsage,
    annual: twoMonthTokenUsage,
  },
  {
    icon: Server,
    item: "Railway production hosting",
    plain: "Pro account minimum for the web service and managed PostgreSQL.",
    monthly: monthlyBase.railway,
    annual: monthlyBase.railway * 12,
  },
  {
    icon: HardDrive,
    item: "Cloudflare R2 video storage",
    plain: "Average first-year storage cost for 36 recorded hours added each month.",
    monthly: monthlyBase.r2,
    annual: monthlyBase.r2 * 12,
  },
  {
    icon: PlayCircle,
    item: "Zoom Pro licence allowance",
    plain: "One annual-billed licence; remove this line if the client already has a suitable paid Zoom account.",
    monthly: monthlyBase.zoom,
    annual: monthlyBase.zoom * 12,
  },
] as const;

export function CostSheet() {
  return (
    <main className="min-h-[100dvh] bg-[#f3f6f1] px-4 py-6 text-[#19352b] sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1180px]">
        <header className="mb-6 flex flex-col justify-between gap-5 border-b border-[#cbd8ce] pb-6 md:flex-row md:items-end">
          <div>
            <div className="mb-4 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#557365]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#1e4b39] text-white"><Layers3 size={16} /></span>
              AFÁRÁ / CLIENT COST PROPOSAL
            </div>
            <p className="mb-2 text-xs font-medium uppercase tracking-[0.15em] text-[#758b7c]">Railway migration · first 12 months</p>
            <h1 className="max-w-4xl text-3xl font-semibold tracking-[-0.04em] text-[#15372a] sm:text-5xl">
              What it will cost to move—and keep the platform running.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-[#5d7567]">
              A plain-language estimate for migration, hosting, storage, Zoom recordings, AI usage, and ongoing technical care.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start rounded-full border border-[#b9ccbd] bg-[#e5eee6] px-3 py-2 text-xs font-semibold text-[#24553f] md:self-end">
            <Check size={14} /> Prepared 04 Sep 2026
          </div>
        </header>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-2xl bg-[#1e4b39] p-6 text-[#edf6ee] shadow-[0_12px_30px_rgba(38,75,56,0.12)] sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#acd0b5]">Recommended client budget</p>
            <div className="mt-4 flex flex-wrap items-end gap-x-5 gap-y-2">
              <span className="text-5xl font-semibold tracking-[-0.05em]">{money(firstYearTotal)}</span>
              <span className="pb-1 text-sm text-[#bfd6c4]">estimated first 12 months</span>
            </div>
            <p className="mt-2 text-sm text-[#c6dbc9]">Approximately {naira(firstYearTotal)} at the indicative planning rate.</p>
            <div className="mt-7 grid gap-3 sm:grid-cols-3">
              <div className="rounded-xl bg-white/8 p-4"><p className="text-xs text-[#b8d0bd]">One-time migration</p><p className="mt-1 text-2xl font-semibold">{money(migrationAllowance)}</p></div>
              <div className="rounded-xl bg-white/8 p-4"><p className="text-xs text-[#b8d0bd]">Platform / month</p><p className="mt-1 text-2xl font-semibold">{money(monthlySubtotal)}</p></div>
              <div className="rounded-xl bg-[#dcecce] p-4 text-[#204b39]"><p className="text-xs text-[#557866]">Sep + Oct tokens</p><p className="mt-1 text-2xl font-semibold">{money(twoMonthTokenUsage)}</p></div>
            </div>
            <p className="mt-5 border-t border-white/15 pt-4 text-xs leading-5 text-[#bcd2c1]">
              This is a planning quote, not a final invoice. Taxes, foreign-exchange movement, exceptional feature work, and any additional paid vendor seats are excluded.
            </p>
          </div>

          <div className="rounded-2xl border border-[#d5e0d7] bg-[#fbfcfa] p-6">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#6b8374]"><Gauge size={17} /> The simple answer</div>
            <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em]">Start on Railway Pro.</h2>
            <p className="mt-3 text-sm leading-6 text-[#5d7567]">
              Pro is the correct production tier even before traffic is high. It gives the client a team-ready production account; actual compute use is still metered.
            </p>
            <div className="mt-5 rounded-xl bg-[#eef3ee] p-4 text-xs leading-5 text-[#557365]">
              <b className="text-[#2b5d44]">Important:</b> “High traffic” is not another Railway plan. It is the point where measurements show that a second app replica or more resources are needed.
            </div>
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-[#d5e0d7] bg-[#fbfcfa] p-5 sm:p-7">
          <div className="mb-5 flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b8374]">Client quote</p><h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">What the monthly fee covers</h2></div>
            <p className="text-xs text-[#718477]">USD · based on supplied two-month averages</p>
          </div>
          <div className="overflow-hidden rounded-xl border border-[#dce5dd]">
            <div className="hidden grid-cols-[1.05fr_1.45fr_0.45fr_0.5fr] gap-4 bg-[#edf2ed] px-5 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-[#6b8374] md:grid">
              <span>Cost line</span><span>What it means</span><span className="text-right">Monthly / period</span><span className="text-right">12 months</span>
            </div>
            {quoteRows.map(({ icon: Icon, item, plain, monthly, annual }) => (
              <div key={item} className="grid gap-3 border-t border-[#e1e8e1] px-5 py-4 first:border-t-0 md:grid-cols-[1.05fr_1.45fr_0.45fr_0.5fr] md:items-center md:gap-4">
                <div className="flex items-center gap-3 font-semibold"><span className="rounded-lg bg-[#e5efe7] p-2 text-[#397456]"><Icon size={16} /></span><span className="text-sm">{item}</span></div>
                <p className="text-xs leading-5 text-[#64796c]">{plain}</p>
                <p className="text-right text-sm font-semibold">{money(monthly)}</p>
                <p className="text-right text-sm font-semibold text-[#2c684a]">{money(annual)}</p>
              </div>
            ))}
            <div className="grid gap-3 border-t-2 border-[#b8cdbd] bg-[#f0f5f0] px-5 py-4 md:grid-cols-[2.5fr_0.45fr_0.5fr] md:items-center">
              <p className="font-semibold">12-month infrastructure subtotal</p>
              <p className="text-right text-lg font-semibold">{money(monthlySubtotal)}</p>
              <p className="text-right text-lg font-semibold text-[#245f43]">{money(annualRecurring)}</p>
            </div>
          </div>
          <div className="mt-4 flex items-start gap-3 rounded-xl bg-[#faf2df] px-4 py-3 text-xs leading-5 text-[#765f35]">
            <Info size={16} className="mt-0.5 shrink-0" />
              The {money(migrationAllowance)} one-time migration allowance covers the ten-day move, environment setup, database migration, storage cutover, callback updates, verification, and rollback preparation. The existing maintenance retainer is intentionally excluded. AI/token usage is included only for September and October.
          </div>
        </section>

        <section className="mb-6 rounded-2xl border border-[#d5e0d7] bg-[#fbfcfa] p-5 sm:p-7">
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b8374]">Decision matrix</p>
            <h2 className="mt-1 text-2xl font-semibold tracking-[-0.03em]">When Pro is enough—and when to scale</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64796c]">User counts are guides only. The actual decision should use Railway’s CPU, memory, response-time, and egress measurements.</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {options.map((option, index) => (
              <article key={option.name} className={`rounded-xl border p-5 ${option.tone}`}>
                <div className="flex items-start justify-between gap-3">
                  <div><p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#708278]">Option {index + 1}</p><h3 className="mt-1 text-lg font-semibold">{option.name}</h3></div>
                  {index === 0 ? <CheckCircle2 size={20} className="text-[#3f8b61]" /> : index === 1 ? <ArrowRight size={20} className="text-[#8b7b53]" /> : <AlertTriangle size={20} className="text-[#a96642]" />}
                </div>
                <div className="mt-4 border-y border-black/8 py-3"><p className="text-xs text-[#718477]">Railway portion</p><p className="mt-1 text-2xl font-semibold">{option.railway}</p><p className="mt-1 text-xs font-semibold text-[#4f755e]">{option.recommendation}</p></div>
                <p className="mt-4 text-xs leading-5 text-[#5e7467]"><b>Use when:</b> {option.useWhen}</p>
                <p className="mt-3 text-xs leading-5 text-[#5e7467]"><b>Decision trigger:</b> {option.trigger}</p>
                <p className="mt-4 text-[11px] font-semibold text-[#64796c]">Estimated first year: {money(option.firstYear)}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-6 grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-2xl border border-[#d5e0d7] bg-[#fbfcfa] p-5 sm:p-7">
            <div className="flex items-center gap-3"><span className="rounded-lg bg-[#e4efe7] p-2 text-[#367353]"><HardDrive size={18} /></span><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#6b8374]">Zoom + storage model</p><h2 className="mt-1 text-xl font-semibold">36 recorded hours each month</h2></div></div>
            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[["18", "lessons / month"], ["2 hrs", "each lesson"], ["21.6 GB", "new video / month"], ["259 GB", "stored by month 12"]].map(([value, label]) => <div key={label} className="rounded-xl bg-[#eef3ee] p-3"><p className="text-xl font-semibold">{value}</p><p className="mt-1 text-[11px] text-[#6c8174]">{label}</p></div>)}
            </div>
            <p className="mt-4 text-xs leading-5 text-[#64796c]">
              Planning assumption: Zoom MP4 averages 0.6 GB per recorded hour. Actual files vary with layout, resolution, screen sharing, and participant video. At 0.4–1.0 GB/hour, month-12 storage would be roughly 173–432 GB.
            </p>
            <div className="mt-4 rounded-xl border border-[#c9dccd] bg-[#eff7f0] p-4 text-xs leading-5 text-[#4f705d]">
              <b>R2 first-year storage estimate:</b> about $23.47 total. Storage is not the expensive part; safe transfer and video delivery are the important architecture decisions.
            </div>
          </div>

          <div className="rounded-2xl border border-[#d7c8ae] bg-[#fbf5e8] p-5 sm:p-7">
            <div className="flex items-center gap-3"><span className="rounded-lg bg-[#f0dfbf] p-2 text-[#8e6936]"><ShieldCheck size={18} /></span><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8b734c]">Recommendation</p><h2 className="mt-1 text-xl font-semibold">Import, verify, then clear Zoom</h2></div></div>
            <ol className="mt-5 space-y-3 text-xs leading-5 text-[#705f43]">
              <li className="flex gap-3"><span className="font-bold text-[#9a7138]">01</span><span>Zoom records the lesson in the cloud and sends the completion webhook.</span></li>
              <li className="flex gap-3"><span className="font-bold text-[#9a7138]">02</span><span>The app streams the MP4 into private R2 storage using a retry-safe multipart upload.</span></li>
              <li className="flex gap-3"><span className="font-bold text-[#9a7138]">03</span><span>The app verifies file size/checksum and confirms protected playback.</span></li>
              <li className="flex gap-3"><span className="font-bold text-[#9a7138]">04</span><span>Delete the Zoom copy after seven days. This keeps Zoom’s included 10 GB from becoming a storage bill.</span></li>
            </ol>
            <div className="mt-5 flex gap-3 rounded-xl bg-white/70 p-4 text-xs leading-5 text-[#705f43]">
              <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[#a76c3c]" />
              The current importer holds the whole recording in web-server memory. A two-hour file can exceed a 1 GB service. Streamed/multipart transfer must be included in the migration—not deferred.
            </div>
          </div>
        </section>

        <section className="mb-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-2xl border border-[#d5e0d7] bg-[#eef3ee] p-5 sm:p-7">
            <div className="flex items-center gap-2 text-sm font-semibold"><Database size={17} className="text-[#3e7f5b]" /> What changes the quote</div>
            <ul className="mt-4 space-y-2 text-xs leading-5 text-[#62796b]">
              <li>• AI use materially above the current $300/month allowance.</li>
              <li>• More Zoom host licences, webinars, large-meeting add-ons, or long Zoom retention.</li>
              <li>• New feature development outside routine maintenance.</li>
              <li>• A second Railway replica, materially larger database, or sustained high compute use.</li>
              <li>• Taxes and the USD/NGN rate at invoice date.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-[#d5e0d7] bg-[#fbfcfa] p-5 sm:p-7">
            <div className="flex items-center gap-2 text-sm font-semibold"><Cloud size={17} className="text-[#3e7f5b]" /> Price sources</div>
            <div className="mt-4 space-y-3 text-xs leading-5 text-[#557365]">
              <a className="block break-all underline decoration-[#b5cbb9] underline-offset-2" href="https://docs.railway.com/pricing" target="_blank" rel="noreferrer">Railway plans and resource pricing — docs.railway.com/pricing</a>
              <a className="block break-all underline decoration-[#b5cbb9] underline-offset-2" href="https://developers.cloudflare.com/r2/pricing/" target="_blank" rel="noreferrer">Cloudflare R2 storage and operations — developers.cloudflare.com/r2/pricing</a>
              <a className="block break-all underline decoration-[#b5cbb9] underline-offset-2" href="https://www.zoom.com/pricing" target="_blank" rel="noreferrer">Zoom Workplace pricing — zoom.com/pricing</a>
              <a className="block break-all underline decoration-[#b5cbb9] underline-offset-2" href="https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0067670" target="_blank" rel="noreferrer">Zoom cloud recording storage limits — support.zoom.com</a>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-[#d5e0d7] bg-[#fbfcfa] p-5 sm:p-7">
          <div className="flex items-center gap-2 text-sm font-semibold"><Info size={17} className="text-[#92733d]" /> Assumptions and commercial notes</div>
          <div className="mt-4 grid gap-x-8 gap-y-2 text-xs leading-5 text-[#62796b] sm:grid-cols-2">
            <p>• USD figures use current public prices checked on 4 Sep 2026.</p>
            <p>• NGN figures use an indicative ₦1,329/$ planning rate.</p>
              <p>• The existing build/maintenance retainer is excluded from this proposal.</p>
              <p>• AI/token usage includes $300 for September and $300 for October only; later usage is billed only if incurred.</p>
            <p>• One Zoom Pro licence is included at the annual-billed public rate; remove it if already owned.</p>
            <p>• R2 calculation assumes recordings are retained for the full year and 10 GB/month free storage.</p>
            <p>• Quote excludes VAT/withholding, domain renewal, paid email overages, and major new product scope.</p>
          </div>
        </section>

        <footer className="flex flex-wrap justify-between gap-3 py-6 text-[11px] text-[#819388]">
          <span>AFÁRÁ · Vendor-to-client first-year sustainability proposal</span>
          <span>Version 2 · decision-ready estimate</span>
        </footer>
      </div>
    </main>
  );
}

export default CostSheet;