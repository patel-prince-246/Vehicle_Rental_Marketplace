import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  Car,
  AlertCircle,
  CheckCircle,
  ArrowLeft,
  Mail,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { GUJARAT_DISTRICTS } from "../constants/locations";
import api from "../services/api";

function Register() {
  const [role, setRole] = useState("customer");
  const [step, setStep] = useState("form"); // "form" | "otp"
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

  const [otp, setOtp] = useState("");
  const [timer, setTimer] = useState(60);
  const [resending, setResending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const { register } = useAuth();
  const navigate = useNavigate();

  // 60-second countdown timer for resending OTP
  useEffect(() => {
    let interval = null;
    if (step === "otp" && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // STEP 1: SEND EMAIL OTP
  const handleInitiateRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.name || !formData.email || !formData.phone || !formData.password || !formData.city) {
      setError("Please fill in all required fields.");
      return;
    }

    if (role === "agency" && (!formData.agencyName || !formData.address)) {
      setError("Agency Name and Address are required for rental agencies.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/users/send-registration-otp", {
        email: formData.email.trim(),
        name: formData.name.trim(),
      });

      if (res.data?.success) {
        setStep("otp");
        setTimer(60);
        setSuccess(`Verification code dispatched to ${formData.email}. Please check your inbox or spam folder.`);
      } else {
        setError(res.data?.message || "Failed to send verification code.");
      }
    } catch (err) {
      console.error("OTP send error:", err);
      setError(err.response?.data?.message || "Failed to send verification code. Please check your network.");
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP
  const handleResendOtp = async () => {
    if (timer > 0 || resending) return;
    setResending(true);
    setError("");
    try {
      const res = await api.post("/users/send-registration-otp", {
        email: formData.email.trim(),
        name: formData.name.trim(),
      });

      if (res.data?.success) {
        setTimer(60);
        setSuccess(`A fresh verification code was sent to ${formData.email}!`);
      } else {
        setError(res.data?.message || "Failed to resend code.");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to resend code.");
    } finally {
      setResending(false);
    }
  };

  // STEP 2: VERIFY OTP AND FINALIZE REGISTRATION
  const handleVerifyOtpAndRegister = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!otp || otp.trim().length !== 6) {
      setError("Please enter the complete 6-digit verification code.");
      return;
    }

    const payload = {
      ...formData,
      email: formData.email.toLowerCase().trim(),
      role,
      otp: otp.trim(),
      verificationChannel: "email",
      userid: "USR-" + Date.now().toString().slice(-6),
    };

    if (role === "owner") {
      payload.ownerid = "OWN-" + Date.now().toString().slice(-4);
    }

    if (role === "agency") {
      payload.agencyid = "AGC-" + Date.now().toString().slice(-4);
      payload.ownerName = formData.name;
    }

    setLoading(true);
    const res = await register(payload);
    setLoading(false);

    if (res.success) {
      setSuccess("Account verified and registered successfully! Redirecting to login...");
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

        {step === "form" ? (
          <>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create an Account</h1>
            <p className="text-sm text-slate-500 mt-1 mb-6">Join as a Customer, Vehicle Host, or Agency.</p>

            {/* Role Selector Tabs */}
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-xl mb-5 text-xs font-bold">
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

            <form onSubmit={handleInitiateRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  name="name"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white"
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
                    className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Verification OTP will be sent here</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="10-digit mobile"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Password *</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">City / District *</label>
                <select
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="w-full text-xs py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600 focus:bg-white"
                >
                  {GUJARAT_DISTRICTS.map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>

              {/* AGENCY SPECIFIC FIELDS */}
              {role === "agency" && (
                <div className="p-4 bg-purple-50/60 border border-purple-100 rounded-2xl space-y-4">
                  <div className="text-xs font-bold text-purple-900 border-b border-purple-200/60 pb-2">
                    Rental Agency Registration Details
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Agency Name *</label>
                    <input
                      type="text"
                      name="agencyName"
                      placeholder="e.g. Royal Travels & Rentals"
                      value={formData.agencyName}
                      onChange={handleChange}
                      required
                      className="w-full text-xs py-2.5 px-3 bg-white border border-purple-200 rounded-xl focus:outline-none focus:border-purple-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Office / Garage Address *</label>
                    <textarea
                      name="address"
                      placeholder="Full physical office address..."
                      value={formData.address}
                      onChange={handleChange}
                      required
                      rows={2}
                      className="w-full text-xs py-2.5 px-3 bg-white border border-purple-200 rounded-xl focus:outline-none focus:border-purple-600 resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Business Registration / GSTIN (Optional)
                    </label>
                    <input
                      type="text"
                      name="registrationNumber"
                      placeholder="e.g. 24AAAAA0000A1Z5"
                      value={formData.registrationNumber}
                      onChange={handleChange}
                      className="w-full text-xs py-2.5 px-3 bg-white border border-purple-200 rounded-xl focus:outline-none focus:border-purple-600"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60 mt-4 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Sending Verification Email...</span>
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    <span>Send Verification OTP &amp; Continue</span>
                  </>
                )}
              </button>
            </form>
          </>
        ) : (
          /* STEP 2: VERIFICATION SCREEN (EMAIL OTP) */
          <div>
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-100">
              <KeyRound size={28} />
            </div>

            <h2 className="text-2xl font-black text-slate-900 tracking-tight text-center">
              Verify Your Email Address
            </h2>
            <p className="text-xs text-slate-500 mt-1 mb-3 text-center">
              We have dispatched a 6-digit verification code to:
            </p>
            <div className="text-center mb-5">
              <span className="font-bold text-slate-900 bg-slate-100 px-3.5 py-1.5 rounded-full text-xs border border-slate-200 font-mono">
                {formData.email}
              </span>
            </div>

            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3.5 py-2.5 rounded-xl text-xs mb-5">
              <CheckCircle size={16} className="shrink-0 text-blue-600" />
              <span>Real email sent via Gmail. Please check your Inbox (or Spam folder).</span>
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

            <form onSubmit={handleVerifyOtpAndRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 text-center">
                  Enter 6-Digit Verification Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  placeholder="• • • • • •"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  autoFocus
                  required
                  className="w-full text-center text-2xl font-black font-mono tracking-widest py-3 px-4 bg-slate-50 border-2 border-slate-300 rounded-2xl focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 px-1 pt-1">
                <span>Didn't receive email?</span>
                {timer > 0 ? (
                  <span className="font-semibold text-slate-400">
                    Resend in {timer}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={resending}
                    className="font-bold text-blue-600 hover:text-blue-700 cursor-pointer disabled:opacity-50"
                  >
                    {resending ? "Sending..." : "Resend Code"}
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60 mt-4 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw size={16} className="animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <span>Verify &amp; Complete Registration</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setStep("form");
                  setOtp("");
                  setError("");
                  setSuccess("");
                }}
                className="w-full py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Change Email / Back to Form</span>
              </button>
            </form>
          </div>
        )}

        <div className="border-t border-slate-100 mt-6 pt-5 text-center text-xs text-slate-500">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-blue-600 hover:text-blue-700">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
