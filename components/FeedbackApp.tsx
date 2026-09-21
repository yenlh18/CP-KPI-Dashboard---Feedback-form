"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import { copy, type Lang } from "@/lib/copy";

const MAX_SCREENSHOT_BYTES = 10 * 1024 * 1024;
const MAX_SCREENSHOTS = 5;
const ALLOWED_SCREENSHOT_TYPES = ["image/png", "image/jpeg"];

interface Screenshot {
  url: string;
  name: string;
}

type View = "landing" | "feedback" | "bug" | "thanks";
type ThanksKind = "feedback" | "bug";

interface FeedbackFormState {
  dept: string;
  overall: number | null;
  overallFeedback: string;
  startClarity: number | null;
  clarityKpi: number | null;
  clarityScore: number | null;
  changeFlow: number | null;
  supportClarity: number | null;
  timeSaved: number | null;
  changeNote: string;
}

interface BugFormState {
  issue: string;
  whereTags: string[];
  domain: string;
  screenshots: Screenshot[];
}

const FEEDBACK_STEPS = 2;
const LANG_STORAGE_KEY = "cpkpi_fb_lang";

const emptyFeedback: FeedbackFormState = {
  dept: "",
  overall: null,
  overallFeedback: "",
  startClarity: null,
  clarityKpi: null,
  clarityScore: null,
  changeFlow: null,
  supportClarity: null,
  timeSaved: null,
  changeNote: "",
};

const emptyBug: BugFormState = {
  issue: "",
  whereTags: [],
  domain: "",
  screenshots: [],
};

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

function Shell({
  children,
  compactHero = false,
  lang,
  setLangState,
  badge,
}: {
  children: React.ReactNode;
  compactHero?: boolean;
  lang: Lang;
  setLangState: (l: Lang) => void;
  badge: string;
}) {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-4 sm:pt-6 pb-16">
      <div className="flex items-center justify-between mb-4">
        <span className="badge">✨ {badge}</span>
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

export default function FeedbackApp() {
  const [lang, setLangState] = useState<Lang>("vi");
  const [view, setView] = useState<View>("landing");
  const [step, setStep] = useState(0);
  const [thanksKind, setThanksKind] = useState<ThanksKind>("feedback");
  const [feedback, setFeedback] = useState<FeedbackFormState>(emptyFeedback);
  const [bug, setBug] = useState<BugFormState>(emptyBug);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [screenshotUploading, setScreenshotUploading] = useState(false);
  const [screenshotError, setScreenshotError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    setScreenshotError(null);
    setScreenshotUploading(false);
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
          startClarity: feedback.startClarity,
          clarityKpi: feedback.clarityKpi,
          clarityScore: feedback.clarityScore,
          changeFlow: feedback.changeFlow,
          supportClarity: feedback.supportClarity,
          timeSaved: feedback.timeSaved,
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
          screenshotUrls: bug.screenshots.map((s) => s.url),
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

  async function handleScreenshotSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (files.length === 0) return;

    setScreenshotError(null);

    const remainingSlots = MAX_SCREENSHOTS - bug.screenshots.length;
    if (remainingSlots <= 0) {
      setScreenshotError(c.bug_screenshot_limit(MAX_SCREENSHOTS));
      return;
    }

    setScreenshotUploading(true);
    try {
      for (const file of files.slice(0, remainingSlots)) {
        if (!ALLOWED_SCREENSHOT_TYPES.includes(file.type)) {
          setScreenshotError(c.bug_screenshot_badtype);
          continue;
        }
        if (file.size > MAX_SCREENSHOT_BYTES) {
          setScreenshotError(c.bug_screenshot_toolarge);
          continue;
        }
        try {
          const blob = await upload(file.name, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
          });
          setBug((b) => ({ ...b, screenshots: [...b.screenshots, { url: blob.url, name: file.name }] }));
        } catch (err) {
          console.error(err);
          setScreenshotError(c.bug_screenshot_error);
        }
      }
      if (files.length > remainingSlots) {
        setScreenshotError(c.bug_screenshot_limit(MAX_SCREENSHOTS));
      }
    } finally {
      setScreenshotUploading(false);
    }
  }

  function removeScreenshot(index: number) {
    setBug((b) => ({ ...b, screenshots: b.screenshots.filter((_, i) => i !== index) }));
    setScreenshotError(null);
  }

  // ---------- Landing ----------
  if (view === "landing") {
    return (
      <Shell lang={lang} setLangState={setLangState} badge={c.badge}>
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
      <Shell compactHero lang={lang} setLangState={setLangState} badge={c.badge}>
        <section className="step-enter" key={`s${step}`}>
          <div className="mb-6">
            <div className="flex items-center justify-between text-xs mb-2" style={{ color: "var(--ink-3)" }}>
              <span className="section-tag">
                <span className="dot" />
                {step === 0 ? "A" : "B"}
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
                  {c.tabALabel}
                </h2>
                <p className="text-sm sm:text-base" style={{ color: "var(--ink-2)" }}>
                  {c.tabASub}
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
                  options={c.scaleEase}
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
                  {c.tabBLabel}
                </h2>
                <p className="text-sm sm:text-base" style={{ color: "var(--ink-2)" }}>
                  {c.tabBSub}
                </p>
              </div>

              <div className="card p-5 sm:p-6 mb-4">
                <LabelBlock text={c.q_start_clarity} optionalLabel={c.optional} />
                <EmojiScale
                  value={feedback.startClarity}
                  onChange={(v) => setFeedback((f) => ({ ...f, startClarity: v }))}
                  options={c.scaleStartClarity}
                />
                <div className="divider mt-5" />
                <div className="mt-5">
                  <LabelBlock text={c.q_clarity_kpi} optionalLabel={c.optional} />
                </div>
                <EmojiScale
                  value={feedback.clarityKpi}
                  onChange={(v) => setFeedback((f) => ({ ...f, clarityKpi: v }))}
                  options={c.scaleEase}
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
                <div className="divider mt-5" />
                <div className="mt-5">
                  <LabelBlock text={c.q_change_flow} optionalLabel={c.optional} />
                </div>
                <EmojiScale
                  value={feedback.changeFlow}
                  onChange={(v) => setFeedback((f) => ({ ...f, changeFlow: v }))}
                  options={c.scaleEase}
                />
                <div className="divider mt-5" />
                <div className="mt-5">
                  <LabelBlock text={c.q_support_clarity} optionalLabel={c.optional} />
                </div>
                <EmojiScale
                  value={feedback.supportClarity}
                  onChange={(v) => setFeedback((f) => ({ ...f, supportClarity: v }))}
                  options={c.scaleEase}
                />
                <div className="divider mt-5" />
                <div className="mt-5">
                  <LabelBlock text={c.q_time_saved} optionalLabel={c.optional} />
                </div>
                <EmojiScale
                  value={feedback.timeSaved}
                  onChange={(v) => setFeedback((f) => ({ ...f, timeSaved: v }))}
                  options={c.scaleHelpful}
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
      <Shell compactHero lang={lang} setLangState={setLangState} badge={c.badge}>
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
            <LabelBlock text={c.bug_screenshot} optionalLabel={c.bug_screenshot_optional} />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg"
              multiple
              className="hidden"
              onChange={handleScreenshotSelect}
            />
            <div className="mt-3 flex flex-wrap gap-3">
              {bug.screenshots.map((s, idx) => (
                <div key={s.url} className="relative">
                  <img
                    src={s.url}
                    alt={s.name}
                    className="h-16 w-16 rounded-lg object-cover border"
                    style={{ borderColor: "var(--line-2)" }}
                  />
                  <button
                    type="button"
                    onClick={() => removeScreenshot(idx)}
                    aria-label={c.bug_screenshot_remove}
                    className="absolute -top-2 -right-2 flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold"
                    style={{ background: "var(--brand)", color: "#fff" }}
                  >
                    ×
                  </button>
                </div>
              ))}
              {bug.screenshots.length < MAX_SCREENSHOTS && (
                <div
                  className="file-drop-tile"
                  role="button"
                  tabIndex={0}
                  onClick={() => !screenshotUploading && fileInputRef.current?.click()}
                >
                  <span className="text-xl">{screenshotUploading ? "⏳" : "+"}</span>
                </div>
              )}
            </div>
            <div className="text-xs mt-2" style={{ color: "var(--ink-3)" }}>
              {screenshotUploading ? c.bug_screenshot_uploading : c.bug_screenshot_hint(MAX_SCREENSHOTS)}
            </div>
            {screenshotError && (
              <div className="text-xs mt-2" style={{ color: "var(--brand)" }}>
                {screenshotError}
              </div>
            )}
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
            <button className="btn-primary px-6 py-3 rounded-xl text-base" disabled={!bugValid || submitting || screenshotUploading} onClick={submitBug}>
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
    <Shell compactHero lang={lang} setLangState={setLangState} badge={c.badge}>
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
