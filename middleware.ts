import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Any @vng.com.vn account can sign in via SSO; only emails in this list may
// actually view /admin's contents.
const ADMIN_ALLOWED_EMAILS = (process.env.ADMIN_ALLOWED_EMAILS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

function isAdminPath(pathname: string) {
  return (
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/") ||
    pathname === "/api/summarize" ||
    pathname.startsWith("/api/summarize/")
  );
}

// The whole app requires Microsoft Entra ID SSO; /admin additionally
// requires the signed-in email to be on ADMIN_ALLOWED_EMAILS.
export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isApi = pathname.startsWith("/api/");

  if (!req.auth) {
    if (isApi) {
      return NextResponse.json({ error: "Authentication required." }, { status: 401 });
    }
    const signInUrl = new URL("/api/auth/signin", req.nextUrl.origin);
    signInUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  if (isAdminPath(pathname)) {
    const email = req.auth.user?.email?.toLowerCase();
    const isAllowed = !!email && ADMIN_ALLOWED_EMAILS.includes(email);
    if (!isAllowed) {
      const message = "Your account is signed in but not authorized to view this page.";
      return isApi
        ? NextResponse.json({ error: message }, { status: 403 })
        : new NextResponse(message, { status: 403 });
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/",
    "/admin/:path*",
    "/api/admin/:path*",
    "/api/summarize/:path*",
    "/api/feedback",
    "/api/bug",
    "/api/training-feedback",
    "/api/upload",
  ],
};
