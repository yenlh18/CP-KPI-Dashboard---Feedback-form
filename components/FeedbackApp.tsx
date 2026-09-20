"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { copy, type Lang } from "@/lib/copy";

type View = "landing" | "feedback" | "bug" | "thanks";
type ThanksKind = "feedback" | "bug";

interface FeedbackFormState {
  dept: string;
  overall: number | null;
  overallFeedback: string;
  easeSubmit: number | null;
  clarityKpi: number | null;
  clarityScore: number | null;
  changeFlow: number | null;
  changeNote: string;
}

interface BugFormState {
  issue: string;
  whereTags: string[];
  domain: string;
}

const FEEDBACK_STEPS = 2;
const LANG_STORAGE_KEY = "cpkpi_fb_lang";

const emptyFeedback: FeedbackFormState = {
  dept: "",
  overall: null,
  overallFeedback: "",
  easeSubmit: null,
  clarityKpi: null,
  clarityScore: null,
  changeFlow: null,
  changeNote: "",
};

const emptyBug: BugFormState = { issue: "", whereTags: [], domain: "" };

function fireConfetti(subtle = false) {
  if (typeof document === "undefined") return;
  const colors = ["#F05A22", "#ec9224", "#ed5a26", "#ffb27a", "#ffd7c2"];
  const n = subtle ? 28 : 56;
  const pieces: HTMLSpanElement[] = [];
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const s = document.createElement("span");
    s.className = "confetti-piece";
    s.style.left = Math.random() * 100 + "%";
    s.style.background = colors[i % colors.length];
    s.style.animationDuration = 1.4 + Math.random() * 1.8 + "s";
    s.style.animationDelay = Math.random() * 0.3 + "s";
    s.style.transform = `translateY(-10px) rotate(${Math.random() * 360}deg)`;
    frag.appendChild(s);
    pieces.push(s);
  }
  document.body.appendChild(frag);
  setTimeout(() => pieces.forEach((p) => p.remove()), 3200);
}

function EmojiScale({
  value,
  onChange,
  options,
}: {
  value: number | null;
  onChange: (v: number) => void;
  options: readonly { v: number; e: string; label: string }[];
}) {
  return (
    <div className="grid grid-cols-5 gap-1 sm:gap-2 mt-3">
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          className={`emoji-btn ${value === o.v ? "selected" : ""}`}
          onClick={() => onChange(o.v)}
          aria-label={o.label}
        >
          <span className="e">{o.e}</span>
          <span className="l">{o.label}</span>
        </button>
      ))}
    </div>
  );
}

function Chips({
  value,
  onChange,
  options,
}: {
  value: string[];
  onChange: (v: string[]) => void;
  options: readonly string[];
}) {
  const toggle = (o: string) => {
    onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
  };
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          className={`chip ${value.includes(o) ? "selected" : ""}`}
          onClick={() => toggle(o)}
        >
          {value.includes(o) ? "✓ " : ""}
          {o}
        </button>
      ))}
    </div>
  );
}

function LabelBlock({
  text,
  required,
  optionalLabel,
}: {
  text: string;
  required?: boolean;
  optionalLabel?: string;
}) {
  return (
    <div className="mb-1">
      <label className="font-semibold text-[15px] sm:text-base" style={{ color: "var(--ink)" }}>
        {text}
        {required && <span style={{ color: "var(--brand)" }}> *</span>}
        {optionalLabel && (
          <span style={{ fontWeight: 400, fontSize: 13, color: "var(--ink-3)" }}> {optionalLabel}</span>
        )}
      </label>
    </div>
  );
}

export default function FeedbackApp() {
  const [lang, setLangState] = useState<Lang>("vi");
  const [view, setView] = useState<View>("landing");
  const [step, setStep] = useState(0);
  const [thanksKind, setThanksKind] = useState<ThanksKind>("feedback");
  const [feedback, setFeedback] = useState<FeedbackFormState>(emptyFeedback);
  const [bug, setBug] = useState<BugFormState>(emptyBug);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const c = copy[lang];

  useEffect(() => {
    const saved = window.localStorage.getItem(LANG_STORAGE_KEY);
    if (saved === "vi" || saved === "en") setLangState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    window.localStorage.setItem(LANG_STORAGE_KEY, lang);
  }, [lang]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [view, step]);

  function goto(next: View, opts: { step?: number; thanksKind?: ThanksKind } = {}) {
    setError(null);
    if (opts.step !== undefined) setStep(opts.step);
    if (opts.thanksKind) setThanksKind(opts.thanksKind);
    setView(next);
  }

  function reset() {
    setFeedback(emptyFeedback);
    setBug(emptyBug);
    setStep(0);
    setError(null);
    goto("landing");
  }

  const step0Valid = feedback.dept.trim() !== "" && feedback.overall !== null;
  const bugValid = bug.issue.trim() !== "";

  async function submitFeedback() {
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          domain: feedback.dept,
          overall: feedback.overall,
          overallFeedback: feedback.overallFeedback,
          easeSubmit: feedback.easeSubmit,
          clarityKpi: feedback.clarityKpi,
          clarityScore: feedback.clarityScore,
          changeFlow: feedback.changeFlow,
          changeNote: feedback.changeNote,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      fireConfetti();
      goto("thanks", { thanksKind: "feedback" });
    } catch (err) {
      console.error(err);
      setError(c.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  async function submitBug() {
    if (submitting || !bugValid) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/bug", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lang,
          issue: bug.issue,
          whereTags: bug.whereTags,
          domain: bug.domain,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      fireConfetti(true);
      goto("thanks", { thanksKind: "bug" });
    } catch (err) {
      console.error(err);
      setError(c.errorGeneric);
    } finally {
      setSubmitting(false);
    }
  }

  function Shell({ children, compactHero = false }: { children: React.ReactNode; compactHero?: boolean }) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-16">
        <div className="flex items-center justify-between mb-4">
          <span className="badge">✨ {c.badge}</span>
          <div className="lang-toggle" role="tablist" aria-label="Language">
            <button
              role="tab"
              aria-selected={lang === "vi"}
              className={lang === "vi" ? "active" : ""}
              onClick={() => setLangState("vi")}
            >
              VI
            </button>
            <button
              role="tab"
              aria-selected={lang === "en"}
              className={lang === "en" ? "active" : ""}
              onClick={() => setLangState("en")}
            >
              EN
            </button>
          </div>
        </div>
        <header className={`hero mb-6 ${compactHero ? "compact" : ""}`}>
          <Image src="/header.jpg" alt="CP KPI Dashboard" width={1600} height={600} priority className="w-full h-auto" />
        </header>
        {children}
        <footer className="mt-10 text-center text-xs" style={{ color: "var(--ink-3)" }}>
          CP KPI Dashboard — Corporate Platforms
        </footer>
      </div>
    );
  }

  // ---------- Landing ----------
  if (view === "landing") {
    return (
      <Shell>
        <section className="step-enter">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-3" style={{ color: "var(--ink)" }}>
            {c.landingTitle}
          </h1>
          <p className="text-base sm:text-lg leading-relaxed mb-8" style={{ color: "var(--ink-2)" }}>
            {c.landingSub}
          </p>

          <div className="grid sm:grid-cols-2 gap-4">
            <button className="landing-card card p-6 text-left" onClick={() => goto("bug")}>
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">🐞</div>
                <span className="arrow text-xl" style={{ color: "var(--brand)" }}>
                  →
                </span>
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--ink)" }}>
                {c.cardBugTitle}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
                {c.cardBugDesc}
              </p>
              <div className="mt-4 text-sm font-semibold" style={{ color: "var(--brand)" }}>
                {c.cardBugCta} →
              </div>
            </button>
            <button
              className="landing-card card p-6 text-left"
              onClick={() => goto("feedback", { step: 0 })}
              style={{ background: "linear-gradient(135deg, rgba(240,90,34,0.06), rgba(236,146,36,0.04))" }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">💬</div>
                <span className="arrow text-xl" style={{ color: "var(--brand)" }}>
                  →
                </span>
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--ink)" }}>
                {c.cardFbTitle}
              </h3>
              <p className="text-sm leading-relaxed" style={{ color: "var(--ink-2)" }}>
                {c.cardFbDesc}
              </p>
              <div className="mt-4 text-sm font-semibold" style={{ color: "var(--brand)" }}>
                {c.cardFbCta} →
              </div>
            </button>
          </div>

          <div className="card-soft p-4 mt-6 flex items-center gap-3">
            <div className="text-lg">💁</div>
            <div className="text-sm" style={{ color: "var(--ink-2)" }}>
              <span style={{ color: "var(--ink-3)" }}>{c.contactLabel}</span>{" "}
              <span style={{ fontWeight: 600, color: "var(--ink)" }}>{c.contactPeople}</span>
            </div>
          </div>
        </section>
      </Shell>
    );
  }

  // ---------- Feedback flow ----------
  if (view === "feedback") {
    const pct = Math.round(((step + 1) / FEEDBACK_STEPS) * 100);
    const isLast = step === FEEDBACK_STEPS - 1;
    const canAdvance = step === 0 ? step0Valid : true;

    return (
      <Shell compactHero>
        <section className="step-enter" key={`s${step}`}>
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: "var(--ink-3)" }}>
              <span className="section-tag">
                <span className="dot" />
                {c.stepOf(step + 1, FEEDBACK_STEPS)}
              </span>
              <span>{pct}%</span>
            </div>
            <div className="progress-track">
              <div className="progress-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>

          {step === 0 && (
            <>
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: "var(--ink)" }}>
                  {c.step1Title}
                </h2>
                <p className="text-sm sm:text-base" style={{ color: "var(--ink-2)" }}>
                  {c.step1Sub}
                </p>
              </div>
              <div className="card p-5 sm:p-6 mb-4">
                <LabelBlock text={c.q_dept} required />
                <input
                  className="input mt-3"
                  type="text"
                  placeholder={c.q_dept_ph}
                  value={feedback.dept}
                  onChange={(e) => setFeedback((f) => ({ ...f, dept: e.target.value }))}
                />
              </div>
              <div className="card p-5 sm:p-6 mb-4">
                <LabelBlock text={c.q_overall} required />
                <EmojiScale
                  value={feedback.overall}
                  onChange={(v) => setFeedback((f) => ({ ...f, overall: v }))}
                  options={c.scaleUseful}
                />
              </div>
              <div className="card p-5 sm:p-6">
                <LabelBlock text={c.q_overall_feedback} optionalLabel={c.optional} />
                <textarea
                  className="textarea mt-3"
                  rows={4}
                  placeholder={c.q_overall_feedback_ph}
                  value={feedback.overallFeedback}
                  onChange={(e) => setFeedback((f) => ({ ...f, overallFeedback: e.target.value }))}
                />
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: "var(--ink)" }}>
                  {c.step2Title}
                </h2>
                <p className="text-sm sm:text-base" style={{ color: "var(--ink-2)" }}>
                  {c.step2Sub}
                </p>
              </div>

              <div className="section-tag mb-3" style={{ fontWeight: 700, color: "var(--brand)" }}>
                {c.section1Title}
              </div>
              <div className="card p-5 sm:p-6 mb-4">
                <LabelBlock text={c.q_ease_submit} optionalLabel={c.optional} />
                <EmojiScale
                  value={feedback.easeSubmit}
                  onChange={(v) => setFeedback((f) => ({ ...f, easeSubmit: v }))}
                  options={c.scaleEase}
                />
                <div className="divider mt-5" />
                <div className="mt-5">
                  <LabelBlock text={c.q_clarity_kpi} optionalLabel={c.optional} />
                </div>
                <EmojiScale
                  value={feedback.clarityKpi}
                  onChange={(v) => setFeedback((f) => ({ ...f, clarityKpi: v }))}
                  options={c.scaleClarity}
                />
                <div className="divider mt-5" />
                <div className="mt-5">
                  <LabelBlock text={c.q_clarity_score} optionalLabel={c.optional} />
                </div>
                <EmojiScale
                  value={feedback.clarityScore}
                  onChange={(v) => setFeedback((f) => ({ ...f, clarityScore: v }))}
                  options={c.scaleClarity}
                />
              </div>

              <div className="section-tag mb-3 mt-6" style={{ fontWeight: 700, color: "var(--brand)" }}>
                {c.section2Title}
              </div>
              <div className="card p-5 sm:p-6 mb-4">
                <LabelBlock text={c.q_change_flow} optionalLabel={c.optional} />
                <EmojiScale
                  value={feedback.changeFlow}
                  onChange={(v) => setFeedback((f) => ({ ...f, changeFlow: v }))}
                  options={c.scaleClarity}
                />
              </div>
              <div className="card p-5 sm:p-6">
                <LabelBlock text={c.q_change_note} optionalLabel={c.optional} />
                <textarea
                  className="textarea mt-3"
                  rows={3}
                  placeholder={c.q_change_note_ph}
                  value={feedback.changeNote}
                  onChange={(e) => setFeedback((f) => ({ ...f, changeNote: e.target.value }))}
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between gap-3 mt-6">
            <button
              className="btn-ghost text-sm"
              onClick={() => (step === 0 ? goto("landing") : goto("feedback", { step: step - 1 }))}
            >
              ← {c.back}
            </button>
            {isLast ? (
              <button className="btn-primary px-6 py-3 rounded-xl text-base" disabled={submitting} onClick={submitFeedback}>
                {submitting ? c.submitting : `${c.submit} ✨`}
              </button>
            ) : (
              <button
                className="btn-primary px-6 py-3 rounded-xl text-base"
                disabled={!canAdvance}
                onClick={() => goto("feedback", { step: step + 1 })}
              >
                {c.next} →
              </button>
            )}
          </div>
          {error && (
            <div className="text-xs mt-2 text-right" style={{ color: "var(--brand)" }}>
              {error}
            </div>
          )}
        </section>
      </Shell>
    );
  }

  // ---------- Bug report ----------
  if (view === "bug") {
    return (
      <Shell compactHero>
        <section className="step-enter">
          <div className="mb-6">
            <h2 className="text-xl sm:text-2xl font-bold mb-1" style={{ color: "var(--ink)" }}>
              🐞 {c.bugTitle}
            </h2>
            <p className="text-sm sm:text-base" style={{ color: "var(--ink-2)" }}>
              {c.bugSub}
            </p>
          </div>

          <div className="card p-5 sm:p-6 mb-4">
            <LabelBlock text={c.bug_issue} required />
            <textarea
              className="textarea mt-3"
              rows={4}
              placeholder={c.bug_issue_ph}
              value={bug.issue}
              onChange={(e) => setBug((b) => ({ ...b, issue: e.target.value }))}
            />
          </div>

          <div className="card p-5 sm:p-6 mb-4">
            <LabelBlock text={c.bug_where} />
            <Chips
              value={bug.whereTags}
              onChange={(v) => setBug((b) => ({ ...b, whereTags: v }))}
              options={c.bug_where_opts}
            />
          </div>

          <div className="card p-5 sm:p-6 mb-4">
            <LabelBlock text={c.bug_screenshot} />
            <div
              className="file-drop mt-3"
              onClick={() => alert(lang === "vi" ? "Chưa hỗ trợ upload trong bản demo này" : "Upload isn't wired up in this demo")}
            >
              <div className="text-2xl mb-1">📎</div>
              <div className="text-sm">PNG / JPG · ≤10MB</div>
            </div>
          </div>

          <div className="card p-5 sm:p-6 mb-4">
            <LabelBlock text={c.bug_domain} />
            <input
              className="input mt-3"
              type="text"
              placeholder={c.bug_domain_ph}
              value={bug.domain}
              onChange={(e) => setBug((b) => ({ ...b, domain: e.target.value }))}
            />
          </div>

          <div className="flex items-center justify-between gap-3 mt-6">
            <button className="btn-ghost text-sm" onClick={() => goto("landing")}>
              ← {c.back}
            </button>
            <button className="btn-primary px-6 py-3 rounded-xl text-base" disabled={!bugValid || submitting} onClick={submitBug}>
              {submitting ? c.submitting : `${c.submitBug} 🚀`}
            </button>
          </div>
          {error && (
            <div className="text-xs mt-2 text-right" style={{ color: "var(--brand)" }}>
              {error}
            </div>
          )}
        </section>
      </Shell>
    );
  }

  // ---------- Thanks ----------
  const isBug = thanksKind === "bug";
  return (
    <Shell compactHero>
      <section className="step-enter text-center">
        <div className="card p-8 sm:p-12">
          {!isBug && <div className="text-6xl mb-4">🌟</div>}
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: "var(--ink)" }}>
            {isBug ? c.thanksTitleBug : c.thanksTitleFb}
          </h1>
          <p
            className="text-base sm:text-lg leading-relaxed mb-6"
            style={{ color: "var(--ink-2)", whiteSpace: "pre-line" }}
          >
            {isBug ? c.thanksSubBug : c.thanksSubFb}
          </p>
          <button className="btn-primary px-6 py-3 rounded-xl text-base" onClick={reset}>
            {c.thanksBack}
          </button>
        </div>
      </section>
    </Shell>
  );
}
