import { signIn } from "@/auth";

function MicrosoftLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

const ERROR_MESSAGES: Record<string, string> = {
  AccessDenied: "Your account is not authorized to access this app.",
  OAuthAccountNotLinked: "This email is already used with a different sign-in method.",
  Configuration: "There's a sign-in configuration issue. Please contact the administrator.",
  Verification: "This sign-in link has expired or is invalid.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";
  const errorMessage = params.error
    ? ERROR_MESSAGES[params.error] ?? "Sign-in failed. Please try again."
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm text-center step-enter">
        <div
          className="text-4xl font-extrabold mb-1"
          style={{ color: "var(--brand)", letterSpacing: "-0.02em", transform: "skewX(-4deg)" }}
        >
          VNG
        </div>
        <div
          className="text-xs font-semibold mb-8"
          style={{ color: "var(--brand-3)", letterSpacing: "0.08em" }}
        >
          embracing challenges
        </div>

        <div className="card p-8 sm:p-10 text-left">
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: "var(--ink)" }}>
            Sign in
          </h1>
          <p className="text-sm font-semibold mb-6" style={{ color: "var(--ink-2)" }}>
            Feedback/Bug reporting - CP KPI Dashboard
          </p>

          {errorMessage && (
            <div
              className="text-sm mb-4 rounded-xl p-3"
              style={{ background: "var(--card-2)", color: "var(--brand)", border: "1px solid var(--line-2)" }}
            >
              {errorMessage}
            </div>
          )}

          <form
            action={async () => {
              "use server";
              await signIn("microsoft-entra-id", { redirectTo: callbackUrl });
            }}
          >
            <button
              type="submit"
              className="w-full px-5 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-3"
              style={{
                background: "var(--card)",
                border: "1px solid var(--line-2)",
                color: "var(--ink)",
              }}
            >
              <MicrosoftLogo />
              Sign in with VNG account
            </button>
          </form>

          <p className="text-xs mt-4" style={{ color: "var(--ink-3)" }}>
            Use your Microsoft account (@vng.com.vn). Only accounts registered
            in the directory can sign in.
          </p>
        </div>

        <div className="text-xs mt-6" style={{ color: "var(--ink-3)" }}>
          SSO · Microsoft Entra ID
        </div>
      </div>
    </div>
  );
}
