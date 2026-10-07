import { useState, useEffect } from "react";
import { Navigate, useNavigate, useLocation, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, CheckCircle2, ArrowRight } from "lucide-react";
import logo from "../../../assets/logo.svg";
import { useAuth } from "../hooks/useAuth";
import { useSelector } from "react-redux";
import { resendVerificationEmail } from "../services/auth.api";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [verifiedNotice, setVerifiedNotice] = useState(false);
  const [registrationNotice, setRegistrationNotice] = useState(null);

  const user = useSelector((state) => state.auth.user);
  const loadingState = useSelector((state) => state.auth.loading);

  const { handleLogin } = useAuth();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("verified") === "true") {
      setVerifiedNotice(true);
    }
    if (location.state?.registeredEmail) {
      setEmail(location.state.registeredEmail);
      setRegistrationNotice(
        `Registration complete! We sent a verification email to ${location.state.registeredEmail}. Please check your inbox or spam folder.`
      );
    }
  }, [location]);

  const validateForm = () => {
    const newErrors = {};
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Please enter a valid email address";
    if (!password) newErrors.password = "Password is required";
    else if (password.length < 6) newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});
    try {
      await handleLogin({ email: email.trim(), password });
      navigate("/");
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || data?.errors?.[0]?.msg || error.message || "Login failed. Please check your credentials.";
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) {
      setErrors({ submit: "Please enter your email above first." });
      return;
    }
    setResending(true);
    setErrors({});
    try {
      await resendVerificationEmail({ email: email.trim() });
      setResendSuccess(true);
    } catch (err) {
      setErrors({ submit: err.response?.data?.message || "Failed to resend verification email." });
    } finally {
      setResending(false);
    }
  };

  const clearFieldError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (!loadingState && user) return <Navigate to="/" replace />;

  const isVerifyError = errors.submit?.toLowerCase().includes("verify");

  return (
    <div className="min-h-screen bg-[#090d16] flex items-center justify-center p-4 sm:p-6 relative overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.015)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.015)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />
      {/* Ambient neon orb */}
      <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[650px] h-[450px] bg-rose-500/15 blur-[140px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-[420px] z-10">
        <div className="text-center mb-7">
          <div className="inline-flex p-3 rounded-2xl bg-zinc-900 border border-zinc-700/60 shadow-xl shadow-rose-950/20 mb-4">
            <img src={logo} alt="Intellix" className="h-9 w-auto" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Welcome to Intellix</h1>
          <p className="text-zinc-400 text-xs mt-1">Sign in to your intelligent AI workspace</p>
        </div>

        {/* Verified Notice Alert */}
        {verifiedNotice && (
          <div className="mb-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-3.5 text-emerald-400 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
            <span>Email verified successfully! You can now log in below.</span>
          </div>
        )}

        {/* Registration Info Notice Alert */}
        {registrationNotice && (
          <div className="mb-4 rounded-xl bg-rose-500/10 border border-rose-500/30 p-3.5 text-rose-300 text-xs flex items-start gap-2.5">
            <CheckCircle2 size={16} className="shrink-0 text-rose-400 mt-0.5" />
            <span>{registrationNotice}</span>
          </div>
        )}

        <div className="bg-zinc-900/90 backdrop-blur-2xl rounded-2xl border border-zinc-800/80 shadow-2xl shadow-black/50 p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  placeholder="you@example.com"
                  className="w-full bg-zinc-950/70 border border-zinc-700/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="text-rose-400 text-xs mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  placeholder="••••••••"
                  className="w-full bg-zinc-950/70 border border-zinc-700/60 rounded-xl pl-10 pr-11 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition p-1 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-rose-400 text-xs mt-1.5">{errors.password}</p>}
            </div>

            {errors.submit && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-rose-400 text-xs flex flex-col gap-1.5 animate-in fade-in">
                <span>{errors.submit}</span>
                {isVerifyError && (
                  <button
                    type="button"
                    onClick={handleResendVerification}
                    disabled={resending}
                    className="text-left text-rose-300 hover:text-white font-semibold underline underline-offset-2 transition cursor-pointer"
                  >
                    {resending ? "Sending link…" : resendSuccess ? "Verification link sent! Check your inbox." : "Click here to resend verification link"}
                  </button>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 py-3 text-xs font-bold text-white shadow-lg shadow-rose-950/40 hover:brightness-110 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Signing In...</span>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-zinc-400">
            Don't have an account?{" "}
            <Link to="/register" className="text-rose-400 hover:text-rose-300 font-semibold transition">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
