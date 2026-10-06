import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Car,
  AlertCircle,
  ArrowLeft,
  User,
  Building2,
  Shield,
  LayoutDashboard,
  Smartphone,
  Mail,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("customer");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterLogin = (user) => {
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }

    if (user.role === "admin") {
      navigate("/admin/dashboard");
    } else if (user.role === "owner") {
      navigate("/owner/dashboard");
    } else if (user.role === "agency") {
      navigate("/agency/dashboard");
    } else {
      navigate("/customer/dashboard");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!identifier.trim() || !password) {
      setError("Please enter your email or mobile number, and password.");
      return;
    }

    setLoading(true);
    const res = await login(identifier.trim(), password, role);
    setLoading(false);

    if (res.success) {
      redirectAfterLogin(res.user);
    } else {
      setError(res.message);
    }
  };

  const handleDemoLogin = (demoRole, demoIdentifier, demoPassword) => {
    setRole(demoRole);
    setIdentifier(demoIdentifier);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200/90 p-7 sm:p-9 shadow-lg shadow-slate-200/50">
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold text-slate-900 mb-5">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
            <Car size={20} />
          </div>
          <span>Drive<span className="text-indigo-600">Hub</span></span>
        </Link>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-5">
          Log in with your email or mobile number and select your role.
        </p>

        {error && (
          <div className="flex items-center gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-5 animate-in fade-in duration-200">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ROLE SELECTOR ITEM */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Select Your Role *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200/80">
              {[
                { id: "customer", label: "Customer", icon: User },
                { id: "agency", label: "Agency", icon: Building2 },
                { id: "owner", label: "Owner", icon: LayoutDashboard },
                { id: "admin", label: "Admin", icon: Shield },
              ].map((item) => {
                const isSelected = role === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setRole(item.id)}
                    className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-xs font-bold transition cursor-pointer ${isSelected
                        ? "bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                      }`}
                  >
                    <Icon size={14} className="mb-0.5" />
                    <span className="text-[11px]">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 1st ITEM: EMAIL OR MOBILE NUMBER */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="identifier">
              Email Address or Mobile Number *
            </label>
            <div className="relative">
              <input
                id="identifier"
                type="text"
                placeholder="e.g. name@example.com or 9876543210"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                {identifier.includes("@") ? <Mail size={16} /> : <Smartphone size={16} />}
              </div>
            </div>
          </div>

          {/* 2nd ITEM: PASSWORD */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="password">
              Password *
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white transition pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? "Logging in..." : `Sign In as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-6 pt-5 border-t border-slate-100">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
            Instant 1-Click Demo Logins
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("customer", "dhruv@gmail.com", "dhruv123")}
              className={`px-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-center border ${role === "customer"
                  ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                  : "bg-indigo-50 hover:bg-indigo-100 border-indigo-200 text-indigo-700"
                }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("agency", "agency@agency.com", "agency123")}
              className={`px-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-center border ${role === "agency"
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                  : "bg-emerald-50 hover:bg-emerald-100 border-emerald-200 text-emerald-700"
                }`}
            >
              Agency
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("owner", "prince@owner.com", "prince123")}
              className={`px-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-center border ${role === "owner"
                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                  : "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700"
                }`}
            >
              Owner
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("admin", "tapan@admin.com", "tapan123")}
              className={`px-2 py-2 rounded-xl text-xs font-bold transition cursor-pointer text-center border ${role === "admin"
                  ? "bg-rose-600 text-white border-rose-600 shadow-xs"
                  : "bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700"
                }`}
            >
              Admin
            </button>
          </div>
        </div>

        <div className="mt-5 text-center text-xs text-slate-600 space-y-2">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="font-bold text-indigo-600 hover:underline">
              Register here
            </Link>
          </p>
          <p>
            <Link to="/" className="text-slate-400 hover:text-slate-600 inline-flex items-center gap-1">
              <ArrowLeft size={12} />
              <span>Back to Home</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;