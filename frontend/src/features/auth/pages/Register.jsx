import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Sparkles } from "lucide-react";
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

    if (!username.trim()) {
      newErrors.username = "Username is required";
    } else if (username.length < 3) {
      newErrors.username = "Username must be at least 3 characters";
    } else if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      newErrors.username =
        "Username can only contain letters, numbers, dashes, and underscores";
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

    try {
      await handleRegister({ username, email, password });
      navigate("/login");
    } catch (error) {
      console.error("Registration error:", error);
      setErrors({ submit: "Registration failed. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const clearFieldError = (field) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  if (!loadingState && user) {
    return <Navigate to="/" />;
  }
  return (
    <div className="min-h-screen bg-linear-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4 sm:p-6 overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 w-56 h-56 sm:w-72 sm:h-72 bg-red-600 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob"></div>
        <div className="absolute bottom-10 left-10 w-56 h-56 sm:w-72 sm:h-72 bg-red-500 rounded-full mix-blend-multiply filter blur-3xl opacity-15 animate-blob animation-delay-4s"></div>
        <div className="absolute top-1/2 left-1/2 w-56 h-56 bg-red-700 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-blob animation-delay-2s"></div>
      </div>

      {/* Main container */}
      <div className="relative w-full max-w-md">
        {/* Header section */}
        <div className="text-center mb-8 sm:mb-10">
          <div className="flex justify-center mb-4">
            <div className=" p-3 sm:p-4 rounded-2xl ">
              <img src={logo} alt="" />
            </div>
          </div>

          <p className="text-slate-400 text-sm sm:text-base">
            Join us and start your journey with Intellix - your AI assistant for
            all things!
          </p>
        </div>

        {/* Register form card */}
        <div className="bg-slate-800/40 backdrop-blur-xl rounded-3xl border border-slate-700/50 p-6 sm:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
            {/* Username input field */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-slate-300 mb-2"
              >
                Username
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-400 transition" />
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    clearFieldError("username");
                  }}
                  placeholder="john_doe"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition duration-200"
                  disabled={loading}
                />
              </div>
              {errors.username && (
                <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                  <span className="text-lg">⚠</span> {errors.username}
                </p>
              )}
            </div>

            {/* Email input field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-slate-300 mb-2"
              >
                Email address
              </label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-400 transition" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                  }}
                  placeholder="name@company.com"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-12 pr-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition duration-200"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                  <span className="text-lg">⚠</span> {errors.email}
                </p>
              )}
            </div>

            {/* Password input field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-slate-300 mb-2"
              >
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-red-400 transition" />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError("password");
                  }}
                  placeholder="••••••••"
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-lg pl-12 pr-12 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/30 transition duration-200"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-200 transition disabled:opacity-50"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-400 text-sm mt-2 flex items-center gap-1">
                  <span className="text-lg">⚠</span> {errors.password}
                </p>
              )}
            </div>

            {/* Submit error message */}
            {errors.submit && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm">
                {errors.submit}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 disabled:from-red-800/50 disabled:to-red-700/50 text-white font-bold py-3 px-4 rounded-lg transition duration-300 transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:cursor-not-allowed shadow-lg shadow-red-500/30 mt-2"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  Creating account...
                </span>
              ) : (
                "Create account"
              )}
            </button>
          </form>

          {/* Navigation to login */}
          <div className="mt-6 sm:mt-8 pt-6 sm:pt-8 border-t border-slate-700/50">
            <p className="text-slate-400 text-sm text-center">
              Already have an account?{" "}
              <button
                onClick={() => navigate("/login")}
                className="text-red-400 hover:text-red-300 font-semibold transition duration-200 hover:underline"
              >
                Sign in
              </button>
            </p>
          </div>
        </div>

        {/* Footer text */}
        <p className="text-center text-slate-500 text-xs mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>

      {/* CSS animations */}
      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          25% { transform: translate(20px, -30px) scale(1.05); }
          50% { transform: translate(-10px, 10px) scale(0.95); }
          75% { transform: translate(10px, 20px) scale(1.02); }
        }
        .animate-blob { animation: blob 8s infinite; }
        .animation-delay-2s { animation-delay: 2s; }
        .animation-delay-4s { animation-delay: 4s; }
      `}</style>
    </div>
  );
}
