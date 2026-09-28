import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Any @vng.com.vn account can sign in via SSO; only emails in this list may
// actually view /admin's contents.
const ADMIN_ALLOWED_EMAILS = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

// Protects /admin and the admin-only API routes with Microsoft Entra ID SSO.
export default auth((req) => {
  const isApi = req.nextUrl.pathname.startsWith("/api/");

  if (!req.auth) {
    if (isApi) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(signInUrl);
  }

  const email = req.auth.user?.email?.toLowerCase();
  const isAllowed = !!email && ADMIN_ALLOWED_EMAILS.includes(email);
  if (!isAllowed) {
    const message = "Your account is signed in but not authorized to view this page.";
    if (isApi) {
      return NextResponse.json({ error: message }, { status: 403 });
    }
    return new NextResponse(message, { status: 403 });
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*", "/api/summarize/:path*"],
};
