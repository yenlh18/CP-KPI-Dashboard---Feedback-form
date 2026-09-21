import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import type { BugRow, FeedbackRow, TrainingFeedbackRow } from "@/lib/types";

function fmtDateForCsv(iso: string): string {
  return new Date(iso).toLocaleString("sv-SE", { timeZone: "Asia/Ho_Chi_Minh" });
}

function withGmt7Dates<T extends { created_at: string }>(rows: T[]): Record<string, unknown>[] {
  return rows.map((row) => ({ ...row, created_at: fmtDateForCsv(row.created_at) }));
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return "";
  const s = Array.isArray(value) ? value.join("; ") : String(value);
  if (/[",\n]/.test(s)) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => csvEscape(row[h])).join(","));
  }
  return lines.join("\n");
}

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get("kind") ?? "feedback";

  try {
    const sql = getSql();
    if (kind === "bug") {
      const rows = (await sql`
        select id, created_at, lang, issue, where_tags, domain, screenshot_urls
        from bug_reports order by created_at desc
      `) as unknown as BugRow[];
      const csv = toCsv(withGmt7Dates(rows));
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="bug_reports.csv"`,
        },
      });
    }

    if (kind === "training") {
      const rows = (await sql`
        select id, created_at, lang, domain, ease_submit_results, ease_edit_kpis, ease_dept_scorecard, ease_kira,
               wants_support, support_areas, support_other_detail, pain_point
        from training_feedback order by created_at desc
      `) as unknown as TrainingFeedbackRow[];
      const csv = toCsv(withGmt7Dates(rows));
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="training_feedback.csv"`,
        },
      });
    }

    const rows = (await sql`
      select id, created_at, lang, domain, overall, overall_feedback,
             start_clarity, clarity_kpi, clarity_score, change_flow, support_clarity, time_saved, change_note
      from feedback_responses order by created_at desc
    `) as unknown as FeedbackRow[];
    const csv = toCsv(withGmt7Dates(rows));
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="feedback_responses.csv"`,
      },
    });
  } catch (err) {
    console.error("Export failed:", err);
    return NextResponse.json({ error: "Export failed." }, { status: 500 });
  }
}
