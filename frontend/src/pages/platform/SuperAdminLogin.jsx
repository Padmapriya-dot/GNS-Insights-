import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { superAdminLogin } from "../../api/platformApi";
import BrandLogo from "../../components/common/BrandLogo";
import AdminAuthShell from "../../components/platform/AdminAuthShell";

const fieldClass =
  "h-12 w-full rounded-xl border border-[#E8EEF5] bg-[#FBFCFD] py-3 pl-11 pr-4 text-sm text-slate-800 placeholder:text-slate-400 outline-none transition focus:border-[#0E2F5C]/40 focus:ring-2 focus:ring-[#0E2F5C]/15";

export default function SuperAdminLogin() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await superAdminLogin(email.trim(), password);
      navigate("/gns-admin/verify-otp", {
        replace: true,
        state: {
          challengeToken: data.challenge_token,
          maskedMobile: data.masked_mobile,
          expiresInSeconds: data.expires_in_seconds,
          resendAfterSeconds: data.resend_after_seconds,
          devOtp: data.dev_otp || null,
        },
      });
    } catch (err) {
      if (!err.response) {
        setError(
          "Cannot reach the API server. Make sure the backend is running on http://localhost:8000, then try again."
        );
      } else {
        const detail = err.response?.data?.detail;
        setError(typeof detail === "string" ? detail : "Login failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminAuthShell>
      <div className="mb-8 flex flex-col items-center text-center">
        <BrandLogo size="lg" />
        <h1 className="mt-4 text-[28px] font-bold leading-tight tracking-tight text-[#002C66]">
          GNS Admin Portal
        </h1>
        <p className="mt-1.5 text-sm text-slate-500">Super Admin sign in.</p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="admin-email" className="mb-1.5 block text-sm font-medium text-slate-700">
            Company Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
            <input
              id="admin-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your company email."
              className={fieldClass}
              required
              autoComplete="username"
            />
          </div>
        </div>

        <div>
          <label htmlFor="admin-password" className="mb-1.5 block text-sm font-medium text-slate-700">
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" strokeWidth={1.75} />
            <input
              id="admin-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password."
              className={`${fieldClass} pr-11`}
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[#0E2F5C] text-sm font-semibold text-white transition hover:bg-[#0a254a] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Verifying..." : "Continue"}
          {!loading && <ArrowRight className="h-4 w-4" strokeWidth={2.25} />}
        </button>
      </form>

      <p className="mt-7 text-center text-sm text-slate-500">
        Company users?{" "}
        <Link to="/login" className="font-semibold text-[#002C66] hover:underline">
          Sign in here
        </Link>
      </p>
    </AdminAuthShell>
  );
}
