import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { trainingPayloadSchema } from "@/lib/types";
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

  const parsed = trainingPayloadSchema.safeParse(body);
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
      insert into training_feedback
        (lang, submitted_by_email, ease_submit_results, ease_edit_kpis, ease_dept_scorecard, ease_kira,
         wants_support, support_areas, support_other_detail, pain_point, user_agent)
      values
        (${p.lang}, ${session.user.email}, ${p.easeSubmitResults}, ${p.easeEditKpis}, ${p.easeDeptScorecard}, ${p.easeKira},
         ${p.wantsSupport}, ${p.supportAreas}, ${p.supportOtherDetail || null}, ${p.painPoint || null},
         ${req.headers.get("user-agent") || null})
    `;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Failed to insert training feedback:", err);
    return NextResponse.json({ error: "Could not save your response." }, { status: 500 });
  }
}
