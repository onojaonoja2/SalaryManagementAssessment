import { Link, Navigate, Outlet, useNavigate } from "react-router-dom";
import { getToken, logout as logoutApi } from "../lib/api";
import { Button } from "./ui/button";

export function ProtectedRoute() {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function Layout() {
  const navigate = useNavigate();
  const logout = () => {
    logoutApi();
    navigate("/login", { replace: true });
  };
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex h-14 w-full max-w-7xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <span className="font-semibold">ACME Salary Manager</span>
            <nav className="flex gap-4 text-sm">
              <Link to="/" className="hover:text-primary">Dashboard</Link>
              <Link to="/employees" className="hover:text-primary">Employees</Link>
              <Link to="/reports" className="hover:text-primary">Reports</Link>
            </nav>
          </div>
          <Button variant="outline" size="sm" onClick={logout}>
            Log out
          </Button>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-4">
        <Outlet />
      </main>
    </div>
  );
}
