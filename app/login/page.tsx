import Image from "next/image";
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
  AccessDenied: "Tài khoản của Anh/Chị không có quyền truy cập ứng dụng này.",
  OAuthAccountNotLinked: "Email này đã được dùng với một phương thức đăng nhập khác.",
  Configuration: "Có lỗi cấu hình đăng nhập. Vui lòng báo cho quản trị viên.",
  Verification: "Liên kết đăng nhập đã hết hạn hoặc không hợp lệ.",
};

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params.callbackUrl || "/";
  const errorMessage = params.error
    ? ERROR_MESSAGES[params.error] ?? "Đăng nhập không thành công. Vui lòng thử lại."
    : null;

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="card p-8 sm:p-10 max-w-sm w-full text-center step-enter">
        <header className="hero mb-6 -mt-2">
          <Image src="/header.jpg" alt="CP KPI Dashboard" width={1600} height={600} priority className="w-full h-auto" />
        </header>

        <h1 className="text-xl font-extrabold mb-2" style={{ color: "var(--ink)" }}>
          Đăng nhập
        </h1>
        <p className="text-sm mb-6" style={{ color: "var(--ink-2)" }}>
          Sử dụng tài khoản Office 365 (@vng.com.vn) để tiếp tục.
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
            className="btn-primary w-full px-6 py-3 rounded-xl text-base flex items-center justify-center gap-3"
          >
            <MicrosoftLogo />
            Đăng nhập với Microsoft
          </button>
        </form>
      </div>
    </div>
  );
}
