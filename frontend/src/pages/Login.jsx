import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Car, AlertCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);
    const res = await login(email.trim(), password);
    setLoading(false);

    if (res.success) {
      redirectAfterLogin(res.user);
    } else {
      setError(res.message);
    }
  };

  const handleDemoLogin = (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6">
      <div className="bg-white w-full max-w-md rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-lg shadow-slate-200/50">
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold text-slate-900 mb-6">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Car size={20} />
          </div>
          <span>Rent<span className="text-blue-600">Wheels</span></span>
        </Link>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Welcome Back</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">Log in to manage your bookings and fleet.</p>

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-6">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5" htmlFor="password">
              Password
            </label>
            <div className="relative flex items-center">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white transition-colors pr-10"
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

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Sign In"}
          </button>
        </form>

        {/* Quick Demo Logins */}
        <div className="mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5 text-center">
            Instant Demo Logins
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <button
              type="button"
              onClick={() => handleDemoLogin("dhruv@gmail.com", "dhruv123")}
              className="px-2.5 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-xl text-xs font-bold transition cursor-pointer text-center"
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("prince@owner.com", "prince123")}
              className="px-2.5 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 rounded-xl text-xs font-bold transition cursor-pointer text-center"
            >
              Host / Owner
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("agency@agency.com", "agency123")}
              className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold transition cursor-pointer text-center"
            >
              Agency
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("tapan@admin.com", "tapan123")}
              className="px-2.5 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-bold transition cursor-pointer text-center"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-600 space-y-2">
          <p>
            Don't have an account?{" "}
            <Link to="/register" className="font-bold text-blue-600 hover:underline">
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