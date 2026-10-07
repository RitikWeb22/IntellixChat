import { useState } from "react";
import { Navigate, useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, ArrowRight, Check } from "lucide-react";
import logo from "../../../assets/logo.svg";
import { useSelector } from "react-redux";
import { useAuth } from "../hooks/useAuth";

export default function Register() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const user = useSelector((state) => state.auth.user);
  const loadingState = useSelector((state) => state.auth.loading);

  const { handleRegister } = useAuth();

  const getPasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length >= 6) score += 1;
    if (pass.length >= 8) score += 1;
    if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass) || /[^A-Za-z0-9]/.test(pass)) score += 1;
    return score;
  };

  const strength = getPasswordStrength(password);

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      newErrors.username = "Letters, numbers, underscores, and hyphens only";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setLoading(true);
    setErrors({});
    try {
      await handleRegister({
        username: username.trim(),
        email: email.trim(),
        password,
      });
      navigate("/login", { state: { registeredEmail: email.trim() } });
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || data?.errors?.[0]?.msg || error.message || "Registration failed. Please try again.";
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (!loadingState && user) return <Navigate to="/" replace />;

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
          <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
          <p className="text-zinc-400 text-xs mt-1">Get started with Intellix AI Workspace</p>
        </div>

        <div className="bg-zinc-900/90 backdrop-blur-2xl rounded-2xl border border-zinc-800/80 shadow-2xl shadow-black/50 p-6 sm:p-7">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-zinc-300 mb-1.5 uppercase tracking-wider">
                Username
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearFieldError("username");
                  }}
                  placeholder="johndoe"
                  className="w-full bg-zinc-950/70 border border-zinc-700/60 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 transition"
                  disabled={loading}
                />
              </div>
              {errors.username && <p className="text-rose-400 text-xs mt-1.5">{errors.username}</p>}
            </div>

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

              {/* Password strength meter */}
              {password && (
                <div className="mt-2 space-y-1">
                  <div className="flex gap-1 h-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`flex-1 rounded-full transition-all duration-300 ${
                          strength >= level
                            ? strength <= 2
                              ? "bg-amber-400"
                              : "bg-emerald-400"
                            : "bg-zinc-800"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-400">
                    {strength <= 1 && "Weak password"}
                    {strength === 2 && "Fair password"}
                    {strength === 3 && "Good password"}
                    {strength >= 4 && "Strong password"}
                  </p>
                </div>
              )}

              {errors.password && <p className="text-rose-400 text-xs mt-1.5">{errors.password}</p>}
            </div>

            {errors.submit && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/30 p-3 text-rose-400 text-xs animate-in fade-in">
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 to-rose-500 py-3 text-xs font-bold text-white shadow-lg shadow-rose-950/40 hover:brightness-110 active:scale-98 transition disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <span>Creating Account...</span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>

          <div className="mt-5 text-center text-xs text-zinc-400">
            Already have an account?{" "}
            <Link to="/login" className="text-rose-400 hover:text-rose-300 font-semibold transition">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
