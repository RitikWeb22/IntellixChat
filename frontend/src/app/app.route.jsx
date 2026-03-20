import { createBrowserRouter, Navigate } from "react-router-dom";
import Login from "../features/auth/pages/Login";
import Register from "../features/auth/pages/Register";
import Dashboard from "../features/chat/pages/Dashboard";
import Protected, {
  PublicOnly,
  ResolveByAuth,
} from "../features/auth/components/Protected";

export const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Protected>
        <Dashboard />
      </Protected>
    ),
  },
  {
    path: "/login",
    element: (
      <PublicOnly>
        <Login />
      </PublicOnly>
    ),
  },
  {
    path: "/register",
    element: (
      <PublicOnly>
        <Register />
      </PublicOnly>
    ),
  },
  {
    path: "/dashboard",
    element: <Navigate to="/" replace />,
  },
  {
    path: "*",
    element: <ResolveByAuth />,
  },
]);
