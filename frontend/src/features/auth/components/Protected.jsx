import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";
import logo from "../../../assets/logo.svg";

const LoadingScreen = () => {
  return (
    <div className="min-h-screen bg-[#090d16] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute w-[450px] h-[450px] bg-rose-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-zinc-900 border border-zinc-700/60 shadow-xl shadow-rose-950/20 mb-5">
          <img src={logo} alt="Intellix" className="h-9 w-auto animate-pulse" />
          <div className="absolute inset-0 rounded-2xl border-2 border-rose-500/30 animate-ping pointer-events-none" />
        </div>

        <h2 className="text-xl font-semibold tracking-tight text-white mb-2">
          Intellix
        </h2>
        <p className="text-xs text-zinc-400 tracking-wide uppercase font-medium">
          Loading workspace...
        </p>

        <div className="mt-6 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: "0ms" }} />
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: "150ms" }} />
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-bounce" style={{ animationDelay: "300ms" }} />
        </div>
      </div>
    </div>
  );
};

const Protected = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  if (loading) {
    return <LoadingScreen />;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const PublicOnly = ({ children }) => {
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  if (loading) {
    return <LoadingScreen />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export const ResolveByAuth = () => {
  const user = useSelector((state) => state.auth.user);
  const loading = useSelector((state) => state.auth.loading);

  if (loading) {
    return <LoadingScreen />;
  }

  return <Navigate to={user ? "/" : "/login"} replace />;
};

export default Protected;
