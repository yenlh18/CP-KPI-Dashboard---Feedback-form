import { NextRequest, NextResponse } from "next/server";

// Protects /admin and the admin-only API routes with HTTP Basic Auth.
// Username can be anything; password must match ADMIN_PASSWORD.
export function middleware(req: NextRequest) {
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    return new NextResponse(
      "ADMIN_PASSWORD is not set. Add it in your Vercel project's Environment Variables.",
      { status: 500 }
    );
  }

  const auth = req.headers.get("authorization");
  if (auth) {
    const [scheme, encoded] = auth.split(" ");
    if (scheme === "Basic" && encoded) {
      const decoded = Buffer.from(encoded, "base64").toString("utf8");
      const idx = decoded.indexOf(":");
      const suppliedPassword = idx === -1 ? decoded : decoded.slice(idx + 1);
      if (suppliedPassword === password) {
        return NextResponse.next();
      }
    }
  }

  return new NextResponse("Authentication required.", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="CP KPI Dashboard Admin"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/summarize/:path*"],
};
