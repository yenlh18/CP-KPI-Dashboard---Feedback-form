import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { bugPayloadSchema } from "@/lib/types";

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = bugPayloadSchema.safeParse(body);
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
      insert into bug_reports
        (lang, issue, where_tags, domain, screenshot_url, user_agent)
      values
        (${p.lang}, ${p.issue}, ${p.whereTags}, ${p.domain || null}, ${p.screenshotUrl || null}, ${req.headers.get("user-agent") || null})
    `;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Failed to insert bug report:", err);
    return NextResponse.json({ error: "Could not save your report." }, { status: 500 });
  }
}
