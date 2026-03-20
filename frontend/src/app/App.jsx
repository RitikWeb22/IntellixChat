import { RouterProvider } from "react-router-dom";
import { router } from "./app.route";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useEffect } from "react";
import { useSelector } from "react-redux";
function App() {
  const auth = useAuth();
  const themeMode = useSelector((state) => state.theme.mode);

  useEffect(() => {
    auth.handleGetMe();
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle(
      "theme-light",
      themeMode === "light",
    );
    window.localStorage.setItem("intellix-theme", themeMode);
  }, [themeMode]);

  return <RouterProvider router={router} />;
}

export default App;
