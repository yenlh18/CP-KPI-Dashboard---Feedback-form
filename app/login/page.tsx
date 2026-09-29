import { signIn } from "@/auth";

function MicrosoftLogo() {
  return (
    <svg width="24" height="24" viewBox="0 0 21 21" aria-hidden="true">
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
      <div className="w-full max-w-md text-center step-enter">
        <div
          className="text-6xl font-extrabold mb-2"
          style={{ color: "var(--brand)", letterSpacing: "-0.02em", transform: "skewX(-4deg)" }}
        >
          VNG
        </div>
        <div
          className="text-sm font-semibold mb-10"
          style={{ color: "var(--brand-3)", letterSpacing: "0.08em" }}
        >
          embracing challenges
        </div>

        <div className="card p-10 sm:p-12 text-left">
          <h1 className="text-3xl font-extrabold mb-2" style={{ color: "var(--ink)" }}>
            Sign in
          </h1>
          <p className="text-base font-semibold mb-8" style={{ color: "var(--ink-2)" }}>
            Feedback - CP KPI Dashboard
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
              className="w-full px-6 py-4 rounded-xl text-base font-semibold flex items-center justify-center gap-3"
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
        </div>

        <div className="text-sm mt-6" style={{ color: "var(--ink-3)" }}>
          SSO · Microsoft Entra ID
        </div>
      </div>
    </div>
  );
}
