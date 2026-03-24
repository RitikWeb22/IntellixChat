import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User } from "lucide-react";
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

  const validateForm = () => {
    const newErrors = {};
    if (!username.trim()) newErrors.username = "Username is required";
    else if (username.length < 3) newErrors.username = "Username must be at least 3 characters";
    else if (!/^[a-zA-Z0-9_-]+$/.test(username)) newErrors.username = "Letters, numbers, dashes, and underscores only";
    if (!email.trim()) newErrors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) newErrors.email = "Please enter a valid email";
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
      await handleRegister({ username, email, password });
      navigate("/login");
    } catch (error) {
      const msg = error.response?.data?.message || error.message || "Registration failed. Please try again.";
      setErrors({ submit: msg });
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field) => {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  if (!loadingState && user) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Subtle grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.02)_1px,transparent_1px)] bg-[size:64px_64px] pointer-events-none" />
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="relative w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex p-3 rounded-2xl bg-zinc-800/60 border border-zinc-700/50 mb-5">
            <img src={logo} alt="Intellix" className="h-10 w-auto" />
          </div>
          <h1 className="text-xl font-semibold text-zinc-100 mb-2">Create an account</h1>
          <p className="text-zinc-400 text-sm">Join Intellix and get started with AI-powered chat</p>
        </div>

        <div className="bg-zinc-900/80 backdrop-blur-xl rounded-2xl border border-zinc-700/50 shadow-2xl shadow-black/20 p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-zinc-300 mb-1.5">Username</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); clearFieldError("username"); }}
                  placeholder="johndoe"
                  className="w-full bg-zinc-800/60 border border-zinc-600/60 rounded-xl pl-11 pr-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 transition"
                  disabled={loading}
                />
              </div>
              {errors.username && <p className="text-rose-400 text-sm mt-1.5">{errors.username}</p>}
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-zinc-300 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearFieldError("email"); }}
                  placeholder="you@example.com"
                  className="w-full bg-zinc-800/60 border border-zinc-600/60 rounded-xl pl-11 pr-4 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 transition"
                  disabled={loading}
                />
              </div>
              {errors.email && <p className="text-rose-400 text-sm mt-1.5">{errors.email}</p>}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-zinc-300 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearFieldError("password"); }}
                  placeholder="••••••••"
                  className="w-full bg-zinc-800/60 border border-zinc-600/60 rounded-xl pl-11 pr-12 py-3 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-rose-500/40 focus:border-rose-500/60 transition"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition p-1"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && <p className="text-rose-400 text-sm mt-1.5">{errors.password}</p>}
            </div>

            {errors.submit && (
              <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-rose-400 text-sm">
                {errors.submit}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-semibold py-3 rounded-xl transition shadow-lg shadow-rose-500/20 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account…
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          <p className="mt-6 pt-6 border-t border-zinc-700/50 text-center text-zinc-400 text-sm">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-rose-400 hover:text-rose-300 font-medium"
            >
              Sign in
            </button>
          </p>
        </div>

        <p className="text-center text-zinc-500 text-xs mt-5">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
