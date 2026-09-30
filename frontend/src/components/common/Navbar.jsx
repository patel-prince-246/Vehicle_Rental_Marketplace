import { Link, useNavigate } from "react-router-dom";
import { Car, User, LogOut, LayoutDashboard, Shield, Building2 } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDashboardPath = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "owner":
        return "/owner/dashboard";
      case "agency":
        return "/agency/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/customer/dashboard";
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition">
              <Car size={22} />
            </div>
            <span className="text-xl font-bold bg-linear-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent">
              DriveHub
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
              Home
            </Link>
            <Link to="/vehicles" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
              Explore Fleet
            </Link>
            {user && (
              <Link to={getDashboardPath()} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                <Link
                  to={getDashboardPath()}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider transition"
                >
                  {user.role === "admin" && <Shield size={14} className="text-indigo-600" />}
                  {user.role === "agency" && <Building2 size={14} className="text-indigo-600" />}
                  {user.role === "owner" && <LayoutDashboard size={14} className="text-indigo-600" />}
                  {user.role === "customer" && <User size={14} className="text-indigo-600" />}
                  <span>{user.name} ({user.role})</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition"
                  title="Logout"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
