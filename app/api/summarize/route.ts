import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import type { BugRow, FeedbackRow } from "@/lib/types";

const ANTHROPIC_MODEL = "claude-sonnet-5";

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY is not set on the server." },
      { status: 500 }
    );
  }

  const kind = (req.nextUrl.searchParams.get("kind") ?? "feedback") as "feedback" | "bug";

  try {
    const sql = getSql();
    let promptData: string;

    if (kind === "bug") {
      const rows = (await sql`
        select created_at, lang, issue, where_tags, domain
        from bug_reports order by created_at desc limit 200
      `) as unknown as BugRow[];
      if (rows.length === 0) {
        return NextResponse.json({ error: "No bug reports to summarize yet." }, { status: 400 });
      }
      promptData = rows
        .map(
          (r, i) =>
            `${i + 1}. [${r.created_at}] (${r.lang}, domain: ${r.domain ?? "—"}, screens: ${
              r.where_tags?.join(", ") || "—"
            })\n${r.issue}`
        )
        .join("\n\n");
    } else {
      const rows = (await sql`
        select created_at, lang, domain, overall, overall_feedback,
               ease_submit, clarity_kpi, clarity_score, change_flow, change_note
        from feedback_responses order by created_at desc limit 200
      `) as unknown as FeedbackRow[];
      if (rows.length === 0) {
        return NextResponse.json({ error: "No feedback responses to summarize yet." }, { status: 400 });
      }
      promptData = rows
        .map((r, i) => {
          const scores = [
            `overall=${r.overall}`,
            r.ease_submit != null ? `ease_submit=${r.ease_submit}` : null,
            r.clarity_kpi != null ? `clarity_kpi=${r.clarity_kpi}` : null,
            r.clarity_score != null ? `clarity_score=${r.clarity_score}` : null,
            r.change_flow != null ? `change_flow=${r.change_flow}` : null,
          ]
            .filter(Boolean)
            .join(", ");
          const notes = [r.overall_feedback, r.change_note].filter(Boolean).join(" | ");
          return `${i + 1}. [${r.domain}] scores(1-5): ${scores}${notes ? `\n   notes: ${notes}` : ""}`;
        })
        .join("\n\n");
    }

    const systemPrompt =
      kind === "bug"
        ? "You are analyzing bug reports submitted by department heads for an internal KPI dashboard tool. Summarize the recurring themes, group similar issues, note which screens are most affected, and flag anything that sounds urgent or blocking. Write in English, using short sections with headers. Be concise and factual — do not invent details not present in the data."
        : "You are analyzing user feedback submitted by department heads for an internal KPI dashboard tool. Summarize: (1) overall sentiment and score distribution, (2) top recurring themes in the open comments, (3) concrete quick-win suggestions worth prioritizing, (4) anything positive worth preserving. Write in English, using short sections with headers. Be concise and factual — do not invent details not present in the data.";

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1200,
        system: systemPrompt,
        messages: [{ role: "user", content: promptData }],
      }),
    });

    if (!resp.ok) {
      const text = await resp.text();
      console.error("Anthropic API error:", resp.status, text);
      return NextResponse.json({ error: "AI summary request failed." }, { status: 502 });
    }

    const data = await resp.json();
    const summary = (data.content ?? [])
      .filter((block: { type: string }) => block.type === "text")
      .map((block: { text: string }) => block.text)
      .join("\n");

    return NextResponse.json({ summary });
  } catch (err) {
    console.error("Summarize failed:", err);
    return NextResponse.json({ error: "Could not generate summary." }, { status: 500 });
  }
}
