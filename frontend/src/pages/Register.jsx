import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Car, AlertCircle, CheckCircle, ArrowLeft } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function Register() {
  const [role, setRole] = useState("customer");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    city: "Vadodara",
    // Agency specific fields
    agencyName: "",
    ownerName: "",
    address: "",
    registrationNumber: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.city) {
      setError("Please fill in all required fields.");
      return;
    }

    const payload = {
      ...formData,
      role,
      userid: "USR-" + Date.now().toString().slice(-6),
    };

    if (role === "owner") {
      payload.ownerid = "OWN-" + Date.now().toString().slice(-4);
    }

    if (role === "agency") {
      payload.agencyid = "AGC-" + Date.now().toString().slice(-4);
      if (!formData.agencyName || !formData.address) {
        setError("Agency Name and Address are required for rental agencies.");
        return;
      }
      payload.ownerName = formData.name;
    }

    setLoading(true);
    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      setSuccess("Account registered successfully! Redirecting to login...");
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } else {
      setError(res.message);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4 sm:p-6 py-12">
      <div className="bg-white w-full max-w-lg rounded-3xl border border-slate-200/90 p-8 sm:p-10 shadow-lg shadow-slate-200/50">
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-2 text-xl font-bold text-slate-900 mb-6">
          <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
            <Car size={20} />
          </div>
          <span>Rent<span className="text-blue-600">Wheels</span></span>
        </Link>

        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create an Account</h1>
        <p className="text-sm text-slate-500 mt-1 mb-6">Join as a Customer, Vehicle Host, or Agency.</p>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-6 text-xs font-bold">
          <button
            type="button"
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              role === "customer"
                ? "bg-white text-blue-600 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setRole("customer")}
          >
            Customer
          </button>
          <button
            type="button"
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              role === "owner"
                ? "bg-white text-amber-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setRole("owner")}
          >
            Vehicle Owner
          </button>
          <button
            type="button"
            className={`py-2 rounded-lg transition-all cursor-pointer ${
              role === "agency"
                ? "bg-white text-purple-700 shadow-xs"
                : "text-slate-600 hover:text-slate-900"
            }`}
            onClick={() => setRole("agency")}
          >
            Agency
          </button>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-6">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 px-3.5 py-2.5 rounded-xl text-xs font-medium mb-6">
            <CheckCircle size={16} className="shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number *</label>
              <input
                type="tel"
                name="phone"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">Password *</label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">City *</label>
              <input
                type="text"
                name="city"
                placeholder="e.g. Vadodara"
                value={formData.city}
                onChange={handleChange}
                required
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
              />
            </div>
          </div>

          {/* Agency Specific */}
          {role === "agency" && (
            <div className="space-y-4 pt-2 border-t border-slate-100">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Agency / Company Name *</label>
                <input
                  type="text"
                  name="agencyName"
                  placeholder="e.g. Gujarat Enterprise Rentals"
                  value={formData.agencyName}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Office Address *</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Full office location"
                  value={formData.address}
                  onChange={handleChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60 mt-2"
          >
            {loading ? "Creating Account..." : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-slate-600 space-y-2">
          <p>
            Already have an account?{" "}
            <Link to="/login" className="font-bold text-blue-600 hover:underline">
              Sign in here
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

export default Register;
