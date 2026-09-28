import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { feedbackPayloadSchema } from "@/lib/types";
import { auth } from "@/auth";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = feedbackPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const p = parsed.data;

  try {
    const sql = getSql();
    await sql`
      insert into feedback_responses
        (lang, submitted_by_email, overall, overall_feedback, start_clarity, clarity_kpi, clarity_score, change_flow, support_clarity, time_saved, change_note, user_agent)
      values
        (${p.lang}, ${session.user.email}, ${p.overall}, ${p.overallFeedback || null},
         ${p.startClarity ?? null}, ${p.clarityKpi ?? null}, ${p.clarityScore ?? null}, ${p.changeFlow ?? null},
         ${p.supportClarity ?? null}, ${p.timeSaved ?? null},
         ${p.changeNote || null}, ${req.headers.get("user-agent") || null})
    `;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Failed to insert feedback response:", err);
    return NextResponse.json({ error: "Could not save your response." }, { status: 500 });
  }
}
