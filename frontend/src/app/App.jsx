import { RouterProvider } from "react-router-dom";
import { router } from "./app.route";
import { useAuth } from "../features/auth/hooks/useAuth";
import { useEffect } from "react";
function App() {
  const auth = useAuth();
  useEffect(() => {
    auth.handleGetMe();
  }, []);
  return <RouterProvider router={router} />;
}

export default App;
