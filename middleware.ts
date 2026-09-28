import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Protects /admin and the admin-only API routes with Microsoft Entra ID SSO.
export default auth((req) => {
  if (req.auth) return NextResponse.next();

  const isApi = req.nextUrl.pathname.startsWith("/api/");
  if (isApi) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
  signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
  return NextResponse.redirect(signInUrl);
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/summarize/:path*"],
};
