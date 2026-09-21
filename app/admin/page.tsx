import { getSql } from "@/lib/db";
import type { BugRow, FeedbackRow } from "@/lib/types";
import AdminSummarize from "@/components/AdminSummarize";
import { copy } from "@/lib/copy";

const q = copy.vi;

export const dynamic = "force-dynamic";

async function getData() {
  const sql = getSql();
  const feedback = (await sql`
    select id, created_at, lang, domain, overall, overall_feedback,
           ease_submit, clarity_kpi, clarity_score, change_flow, change_note
    from feedback_responses order by created_at desc limit 100
  `) as unknown as FeedbackRow[];
  const bugs = (await sql`
    select id, created_at, lang, issue, where_tags, domain, screenshot_urls
    from bug_reports order by created_at desc limit 100
  `) as unknown as BugRow[];
  return { feedback, bugs };
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function Score({ v }: { v: number | null }) {
  if (v == null) return <span className="text-neutral-400">—</span>;
  return <span className="font-semibold">{v}/5</span>;
}

export default async function AdminPage() {
  let feedback: FeedbackRow[] = [];
  let bugs: BugRow[] = [];
  let dbError: string | null = null;

  try {
    const data = await getData();
    feedback = data.feedback;
    bugs = data.bugs;
  } catch (err) {
    dbError = err instanceof Error ? err.message : "Failed to load data.";
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-extrabold text-neutral-900">CP KPI Dashboard — Admin</h1>
      <p className="mt-1 text-sm text-neutral-500">
        {feedback.length} feedback response(s) · {bugs.length} bug report(s) shown (latest 100 each).
      </p>

      {dbError && (
        <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Could not load data: {dbError}. Make sure DATABASE_URL is set and{" "}
          <code>db/schema.sql</code> has been applied.
        </div>
      )}

      {/* Feedback responses */}
      <section className="mt-10">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-neutral-900">Feedback responses</h2>
          <a
            href="/api/admin/export?kind=feedback"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            ⬇ Export CSV
          </a>
        </div>
        <AdminSummarize kind="feedback" />

        <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2 min-w-[140px]">{q.q_dept}</th>
                <th className="px-3 py-2 min-w-[220px]">{q.q_overall}</th>
                <th className="px-3 py-2 min-w-[220px]">{q.q_ease_submit}</th>
                <th className="px-3 py-2 min-w-[220px]">{q.q_clarity_kpi}</th>
                <th className="px-3 py-2 min-w-[220px]">{q.q_clarity_score}</th>
                <th className="px-3 py-2 min-w-[220px]">{q.q_change_flow}</th>
                <th className="px-3 py-2 min-w-[360px]">{q.q_overall_feedback}</th>
                <th className="px-3 py-2 min-w-[360px]">{q.q_change_note}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {feedback.map((r) => (
                <tr key={r.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-neutral-500">{fmtDate(r.created_at)}</td>
                  <td className="px-3 py-2 font-medium text-neutral-900">{r.domain}</td>
                  <td className="px-3 py-2">
                    <Score v={r.overall} />
                  </td>
                  <td className="px-3 py-2">
                    <Score v={r.ease_submit} />
                  </td>
                  <td className="px-3 py-2">
                    <Score v={r.clarity_kpi} />
                  </td>
                  <td className="px-3 py-2">
                    <Score v={r.clarity_score} />
                  </td>
                  <td className="px-3 py-2">
                    <Score v={r.change_flow} />
                  </td>
                  <td className="max-w-md px-3 py-2 text-neutral-600">
                    {r.overall_feedback || <span className="text-neutral-400">—</span>}
                  </td>
                  <td className="max-w-md px-3 py-2 text-neutral-600">
                    {r.change_note || <span className="text-neutral-400">—</span>}
                  </td>
                </tr>
              ))}
              {feedback.length === 0 && !dbError && (
                <tr>
                  <td colSpan={9} className="px-3 py-6 text-center text-neutral-400">
                    No feedback yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Bug reports */}
      <section className="mt-12">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-neutral-900">Bug reports</h2>
          <a
            href="/api/admin/export?kind=bug"
            className="rounded-lg border border-neutral-300 px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
          >
            ⬇ Export CSV
          </a>
        </div>
        <AdminSummarize kind="bug" />

        <div className="mt-4 overflow-x-auto rounded-lg border border-neutral-200">
          <table className="min-w-full divide-y divide-neutral-200 text-sm">
            <thead className="bg-neutral-50 text-left text-xs font-semibold uppercase tracking-wide text-neutral-500">
              <tr>
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2 min-w-[140px]">{q.bug_domain}</th>
                <th className="px-3 py-2 min-w-[220px]">{q.bug_where}</th>
                <th className="px-3 py-2 min-w-[220px]">{q.bug_issue}</th>
                <th className="px-3 py-2">{q.bug_screenshot}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {bugs.map((b) => (
                <tr key={b.id}>
                  <td className="whitespace-nowrap px-3 py-2 text-neutral-500">{fmtDate(b.created_at)}</td>
                  <td className="px-3 py-2 font-medium text-neutral-900">{b.domain || "—"}</td>
                  <td className="px-3 py-2 text-neutral-600">{b.where_tags?.join(", ") || "—"}</td>
                  <td className="max-w-md px-3 py-2 text-neutral-600">{b.issue}</td>
                  <td className="px-3 py-2">
                    {b.screenshot_urls?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {b.screenshot_urls.map((url) => (
                          <a key={url} href={url} target="_blank" rel="noopener noreferrer">
                            <img
                              src={url}
                              alt="screenshot"
                              className="h-12 w-12 rounded-md object-cover border border-neutral-200"
                            />
                          </a>
                        ))}
                      </div>
                    ) : (
                      <span className="text-neutral-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
              {bugs.length === 0 && !dbError && (
                <tr>
                  <td colSpan={5} className="px-3 py-6 text-center text-neutral-400">
                    No bug reports yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
