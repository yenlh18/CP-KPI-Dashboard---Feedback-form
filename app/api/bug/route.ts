import { NextRequest, NextResponse } from "next/server";
import { getSql } from "@/lib/db";
import { bugPayloadSchema } from "@/lib/types";
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
        (lang, issue, where_tags, submitted_by_email, screenshot_urls, user_agent)
      values
        (${p.lang}, ${p.issue}, ${p.whereTags}, ${session.user.email}, ${p.screenshotUrls}, ${req.headers.get("user-agent") || null})
    `;
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Failed to insert bug report:", err);
    return NextResponse.json({ error: "Could not save your report." }, { status: 500 });
  }
}
