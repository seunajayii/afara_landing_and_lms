import { useState } from "react";
import {
  ArrowUpRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  FolderOpen,
  Home,
  MessageCircle,
  Play,
  Sparkles,
  TrendingUp,
  UserRound,
  UsersRound,
} from "lucide-react";
import "./_group.css";

type IconType = typeof Home;
type NavItem = { label: string; icon: IconType };
type NavGroup = { label: string; items: NavItem[] };

const navGroups: NavGroup[] = [
  {
    label: "Home",
    items: [{ label: "Home", icon: Home }],
  },
  {
    label: "Learn",
    items: [
      { label: "My Courses", icon: BookOpen },
      { label: "Resources", icon: FolderOpen },
      { label: "My Progress", icon: TrendingUp },
    ],
  },
  {
    label: "Programme Work",
    items: [
      { label: "Assignments", icon: ClipboardCheck },
      { label: "Certificates", icon: Award },
    ],
  },
  {
    label: "Connect",
    items: [
      { label: "Learning Pods", icon: UsersRound },
      { label: "Events", icon: CalendarDays },
      { label: "Community", icon: MessageCircle },
    ],
  },
  {
    label: "Account",
    items: [{ label: "Profile", icon: UserRound }],
  },
];

const styles = `
  .grouped-lms {
    --ink: var(--ia-foreground);
    --pine: var(--ia-primary);
    --paper: var(--ia-background);
    min-height: 760px;
    width: 100%;
    overflow: hidden;
    color: var(--ink);
    background:
      radial-gradient(circle at 85% 0%, hsl(38 80% 91% / .55), transparent 27%),
      var(--paper);
    font-family: "DM Sans", sans-serif;
    font-size: 12px;
  }
  .grouped-lms * { box-sizing: border-box; }
  .lms-frame { display: flex; min-height: 760px; }
  .lms-sidebar {
    width: 176px;
    flex: 0 0 176px;
    display: flex;
    flex-direction: column;
    background: hsl(145 22% 91% / .76);
    border-right: 1px solid hsl(145 25% 36% / .14);
  }
  .lms-brand {
    display: flex;
    flex-direction: column;
    gap: 7px;
    padding: 21px 18px 17px;
    border-bottom: 1px solid hsl(145 25% 36% / .13);
  }
  .lms-brand-mark {
    color: var(--pine);
    font-family: "Playfair Display", serif;
    font-size: 23px;
    font-weight: 700;
    letter-spacing: -.9px;
    line-height: 1;
  }
  .lms-brand-sub {
    color: hsl(145 25% 36% / .8);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: .11em;
    text-transform: uppercase;
  }
  .lms-nav { flex: 1; padding: 16px 10px 8px; }
  .lms-nav-group { margin-bottom: 13px; }
  .lms-nav-label {
    padding: 0 9px 6px;
    color: hsl(145 25% 36% / .64);
    font-size: 8px;
    font-weight: 700;
    letter-spacing: .1em;
    text-transform: uppercase;
  }
  .lms-nav-button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 9px;
    border: 0;
    border-radius: 7px;
    color: hsl(145 25% 36% / .9);
    background: transparent;
    cursor: pointer;
    font-size: 10.5px;
    text-align: left;
    transition: transform .18s ease, background .18s ease, color .18s ease;
  }
  .lms-nav-button:hover { transform: translateX(2px); background: hsl(42 60% 96% / .72); }
  .lms-nav-button.active {
    color: var(--ink);
    background: hsl(42 60% 96%);
    box-shadow: 0 4px 13px hsl(145 25% 36% / .08);
    font-weight: 700;
  }
  .lms-nav-button.active svg { color: var(--pine); }
  .lms-nav-icon { flex: 0 0 auto; }
  .lms-profile {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 13px 15px;
    border-top: 1px solid hsl(145 25% 36% / .13);
  }
  .lms-avatar {
    width: 26px;
    height: 26px;
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 50%;
    color: hsl(42 60% 96%);
    background: var(--pine);
    font-size: 9px;
    font-weight: 700;
  }
  .lms-profile-name { color: var(--ink); font-size: 10px; font-weight: 700; }
  .lms-profile-role { margin-top: 2px; color: hsl(145 25% 36% / .74); font-size: 8px; }
  .lms-main { min-width: 0; flex: 1; padding: 22px 22px 26px; }
  .lms-topline {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    margin-bottom: 26px;
  }
  .lms-context {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: hsl(145 25% 36% / .76);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
  }
  .lms-context-dot { width: 6px; height: 6px; border-radius: 50%; background: hsl(25 78% 62%); }
  .lms-mode {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 6px 8px;
    border: 1px solid hsl(145 25% 36% / .16);
    border-radius: 999px;
    color: hsl(145 25% 36% / .84);
    background: hsl(42 60% 96% / .68);
    font-size: 8.5px;
    white-space: nowrap;
  }
  .lms-mode svg { color: var(--pine); }
  .lms-heading-kicker {
    margin: 0 0 8px;
    color: hsl(25 70% 48%);
    font-size: 9px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
  }
  .lms-heading {
    margin: 0;
    color: var(--ink);
    font-family: "Playfair Display", serif;
    font-size: clamp(26px, 4vw, 34px);
    font-weight: 600;
    letter-spacing: -1.2px;
    line-height: 1.08;
  }
  .lms-intro { max-width: 355px; margin: 9px 0 20px; color: hsl(145 25% 36% / .8); font-size: 11px; line-height: 1.5; }
  .lms-continue {
    position: relative;
    overflow: hidden;
    min-height: 158px;
    padding: 19px 20px;
    border-radius: 11px;
    color: hsl(42 60% 96%);
    background: var(--pine);
    box-shadow: 0 11px 24px hsl(145 92% 15% / .16);
  }
  .lms-continue:after {
    position: absolute;
    width: 155px;
    height: 155px;
    right: -52px;
    top: -62px;
    border: 1px solid hsl(42 60% 96% / .19);
    border-radius: 50%;
    box-shadow: 0 0 0 18px hsl(42 60% 96% / .04), 0 0 0 37px hsl(42 60% 96% / .04);
    content: "";
  }
  .lms-card-eyebrow { position: relative; z-index: 1; font-size: 8px; font-weight: 700; letter-spacing: .13em; opacity: .65; text-transform: uppercase; }
  .lms-continue-title { position: relative; z-index: 1; max-width: 280px; margin: 8px 0 4px; font-family: "Playfair Display", serif; font-size: 20px; line-height: 1.12; }
  .lms-continue-meta { position: relative; z-index: 1; color: hsl(42 60% 96% / .7); font-size: 10px; }
  .lms-progress-row { position: relative; z-index: 1; display: flex; align-items: center; gap: 9px; margin-top: 17px; }
  .lms-progress-track { width: 116px; height: 5px; overflow: hidden; border-radius: 9px; background: hsl(42 60% 96% / .2); }
  .lms-progress-fill { width: 64%; height: 100%; border-radius: inherit; background: hsl(28 82% 70%); }
  .lms-progress-copy { color: hsl(42 60% 96% / .73); font-size: 9px; }
  .lms-play {
    position: absolute;
    right: 20px;
    bottom: 19px;
    z-index: 1;
    display: grid;
    width: 31px;
    height: 31px;
    place-items: center;
    border: 0;
    border-radius: 50%;
    color: var(--pine);
    background: hsl(42 60% 96%);
    cursor: pointer;
    transition: transform .18s ease;
  }
  .lms-play:hover { transform: scale(1.08); }
  .lms-play svg { margin-left: 2px; }
  .lms-section-head { display: flex; align-items: baseline; justify-content: space-between; margin: 23px 0 10px; }
  .lms-section-title { margin: 0; font-size: 11px; font-weight: 700; }
  .lms-see-all { display: inline-flex; align-items: center; gap: 2px; border: 0; color: hsl(25 70% 48%); background: transparent; cursor: pointer; font-size: 9px; font-weight: 700; }
  .lms-lower { display: grid; grid-template-columns: minmax(0, 1.08fr) minmax(0, .92fr); gap: 10px; }
  .lms-panel { padding: 13px; border: 1px solid hsl(145 25% 36% / .13); border-radius: 9px; background: hsl(42 50% 98% / .72); }
  .lms-task { display: flex; align-items: flex-start; gap: 9px; padding: 9px 0; border-bottom: 1px solid hsl(145 25% 36% / .1); }
  .lms-task:last-child { padding-bottom: 1px; border-bottom: 0; }
  .lms-task-icon { color: hsl(25 70% 48%); }
  .lms-task-name { margin: 0 0 3px; color: var(--ink); font-size: 10px; font-weight: 700; line-height: 1.25; }
  .lms-task-meta { color: hsl(145 25% 36% / .7); font-size: 8.5px; line-height: 1.3; }
  .lms-task-due { margin-left: auto; padding-top: 1px; color: hsl(25 70% 48%); font-size: 8px; font-weight: 700; white-space: nowrap; }
  .lms-signal { display: flex; align-items: flex-start; gap: 9px; padding: 10px 0; border-bottom: 1px solid hsl(145 25% 36% / .1); }
  .lms-signal:last-child { border-bottom: 0; }
  .lms-signal-badge { display: grid; width: 24px; height: 24px; flex: 0 0 auto; place-items: center; border-radius: 7px; color: var(--pine); background: hsl(145 22% 88%); }
  .lms-signal-badge.warm { color: hsl(25 70% 48%); background: hsl(28 82% 86%); }
  .lms-signal-title { margin: 1px 0 3px; font-size: 9.5px; font-weight: 700; line-height: 1.25; }
  .lms-signal-meta { color: hsl(145 25% 36% / .72); font-size: 8px; line-height: 1.3; }
  .lms-connect {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9px;
    margin-top: 10px;
  }
  .lms-connect-card { padding: 12px; border-radius: 9px; background: hsl(145 22% 88% / .7); }
  .lms-connect-card.mentor { background: hsl(28 82% 86% / .64); }
  .lms-connect-icon { color: var(--pine); }
  .lms-connect-card.mentor .lms-connect-icon { color: hsl(25 70% 48%); }
  .lms-connect-title { margin: 8px 0 3px; font-size: 10px; font-weight: 700; }
  .lms-connect-copy { color: hsl(145 25% 36% / .75); font-size: 8px; line-height: 1.35; }
  .lms-connect-arrow { float: right; margin-top: -14px; color: hsl(145 25% 36% / .6); }
  @media (max-width: 560px) {
    .lms-sidebar { width: 154px; flex-basis: 154px; }
    .lms-main { padding: 18px 15px 22px; }
    .lms-lower { grid-template-columns: 1fr; }
  }
  @media (max-width: 420px) {
    .lms-sidebar { width: 62px; flex-basis: 62px; }
    .lms-brand { align-items: center; padding: 20px 8px 16px; }
    .lms-brand-mark { font-size: 18px; }
    .lms-brand-sub, .lms-nav-label, .lms-nav-button span, .lms-profile-name, .lms-profile-role { display: none; }
    .lms-nav { padding-inline: 7px; }
    .lms-nav-button { justify-content: center; padding-inline: 6px; }
    .lms-profile { justify-content: center; padding-inline: 8px; }
    .lms-topline { align-items: flex-start; flex-direction: column; gap: 8px; margin-bottom: 20px; }
  }
`;

export function GroupedLMS() {
  const [active, setActive] = useState("Home");
  const [started, setStarted] = useState(false);

  return (
    <div className="grouped-lms">
      <style>{styles}</style>
      <div className="lms-frame">
        <aside className="lms-sidebar" aria-label="Learner navigation">
          <div className="lms-brand">
            <div className="lms-brand-mark">AFÁRÁ</div>
            <div className="lms-brand-sub">An OPSB Initiative</div>
          </div>

          <nav className="lms-nav">
            {navGroups.map((group) => (
              <div className="lms-nav-group" key={group.label}>
                <div className="lms-nav-label">{group.label}</div>
                {group.items.map(({ label, icon: Icon }) => (
                  <button
                    className={`lms-nav-button ${active === label ? "active" : ""}`}
                    key={label}
                    onClick={() => setActive(label)}
                    type="button"
                    aria-current={active === label ? "page" : undefined}
                  >
                    <Icon className="lms-nav-icon" size={14} strokeWidth={1.8} />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="lms-profile">
            <div className="lms-avatar">AO</div>
            <div>
              <div className="lms-profile-name">Amina Okafor</div>
              <div className="lms-profile-role">Cohort 06 · Participant</div>
            </div>
          </div>
        </aside>

        <main className="lms-main">
          <div className="lms-topline">
            <div className="lms-context">
              <span className="lms-context-dot" />
              {active === "Home" ? "Your learning space" : `${active} · Participant view`}
            </div>
            <div className="lms-mode">
              <Sparkles size={11} strokeWidth={1.8} />
              Participant mode
            </div>
          </div>

          <p className="lms-heading-kicker">Tuesday, 14 May 2024</p>
          <h1 className="lms-heading">Good morning, Amina.</h1>
          <p className="lms-intro">
            One focused step is waiting for you. Pick up where you left off,
            then see what is coming up across your programme.
          </p>

          <section className="lms-continue" aria-label="Continue learning">
            <div className="lms-card-eyebrow">Continue learning</div>
            <div className="lms-continue-title">Financial modelling fundamentals</div>
            <div className="lms-continue-meta">Module 3 of 6 · Last opened yesterday</div>
            <div className="lms-progress-row">
              <div className="lms-progress-track"><div className="lms-progress-fill" /></div>
              <span className="lms-progress-copy">64% complete</span>
            </div>
            <button
              className="lms-play"
              type="button"
              aria-label={started ? "Lesson started" : "Start lesson"}
              onClick={() => setStarted(true)}
            >
              {started ? <CheckCircle2 size={15} /> : <Play size={14} fill="currentColor" />}
            </button>
          </section>

          <div className="lms-section-head">
            <h2 className="lms-section-title">Coming up</h2>
            <button className="lms-see-all" type="button" onClick={() => setActive("My Progress")}>
              View programme <ArrowUpRight size={11} />
            </button>
          </div>

          <div className="lms-lower">
            <section className="lms-panel" aria-label="Upcoming programme work">
              <div className="lms-task">
                <ClipboardCheck className="lms-task-icon" size={15} strokeWidth={1.8} />
                <div>
                  <p className="lms-task-name">Submit market entry brief</p>
                  <div className="lms-task-meta">Growth strategy · 20 min left</div>
                </div>
                <div className="lms-task-due">Due Thu</div>
              </div>
              <div className="lms-task">
                <Clock3 className="lms-task-icon" size={15} strokeWidth={1.8} />
                <div>
                  <p className="lms-task-name">Reflect on module 3</p>
                  <div className="lms-task-meta">Financial modelling · 10 min</div>
                </div>
                <div className="lms-task-due">Due Fri</div>
              </div>
            </section>

            <section className="lms-panel" aria-label="Upcoming sessions">
              <div className="lms-signal">
                <div className="lms-signal-badge warm"><CalendarDays size={13} strokeWidth={1.8} /></div>
                <div>
                  <div className="lms-signal-title">Live clinic</div>
                  <div className="lms-signal-meta">Tomorrow · 16:00 WAT</div>
                </div>
              </div>
              <div className="lms-signal">
                <div className="lms-signal-badge"><UsersRound size={13} strokeWidth={1.8} /></div>
                <div>
                  <div className="lms-signal-title">Pod check-in</div>
                  <div className="lms-signal-meta">Friday · Cedar pod</div>
                </div>
              </div>
            </section>
          </div>

          <div className="lms-section-head">
            <h2 className="lms-section-title">Your connections</h2>
            <button className="lms-see-all" type="button" onClick={() => setActive("Community")}>
              Explore <ChevronRight size={11} />
            </button>
          </div>
          <section className="lms-connect" aria-label="Connections">
            <button className="lms-connect-card" type="button" onClick={() => setActive("Learning Pods")}>
              <UsersRound className="lms-connect-icon" size={16} strokeWidth={1.8} />
              <div className="lms-connect-title">Learning Pods</div>
              <div className="lms-connect-copy">Your group studio · 5 members</div>
              <ChevronRight className="lms-connect-arrow" size={13} />
            </button>
            <button className="lms-connect-card mentor" type="button" onClick={() => setActive("Profile")}>
              <UserRound className="lms-connect-icon" size={16} strokeWidth={1.8} />
              <div className="lms-connect-title">Mentorship</div>
              <div className="lms-connect-copy">One-to-one guidance · 1 note</div>
              <ChevronRight className="lms-connect-arrow" size={13} />
            </button>
          </section>
        </main>
      </div>
    </div>
  );
}