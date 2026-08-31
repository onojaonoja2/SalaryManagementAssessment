import { useState } from "react";
import { Link, Navigate, Outlet, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { getToken, logout as logoutApi } from "../lib/api";
import { Button } from "./ui/button";
import { ChangePasswordDialog } from "./ChangePasswordDialog";

export function ProtectedRoute() {
  const token = getToken();
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function Layout() {
  const navigate = useNavigate();
  const [pwOpen, setPwOpen] = useState(false);
  const logout = () => {
    logoutApi();
    toast.success("Logged out");
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
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPwOpen(true)}>
              Change password
            </Button>
            <Button variant="outline" size="sm" onClick={logout}>
              Log out
            </Button>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-7xl flex-1 p-4">
        <Outlet />
      </main>
      <ChangePasswordDialog open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
}
