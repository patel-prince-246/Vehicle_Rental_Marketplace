import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Car, AlertCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

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
    // If there was an intended destination, redirect there
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
      navigate("/vehicles");
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
    <div className="login-page">
      <div className="login-card">
        <Link to="/" className="login-brand">
          <Car size={30} />
          <span>RentWheels</span>
        </Link>

        <h1>Welcome Back</h1>
        <p className="login-subtitle">Login to continue to your account</p>

        {error && (
          <div className="login-error-alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <label htmlFor="password">Password</label>
          <div className="password-input">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="demo-accounts-box">
          <p className="demo-title">Quick Demo Login:</p>
          <div className="demo-buttons">
            <button
              type="button"
              onClick={() => handleDemoLogin("tapan@admin.com", "tapan123")}
              className="demo-badge-btn admin"
            >
              Admin: Tapan
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("prince@owner.com", "prince123")}
              className="demo-badge-btn owner"
            >
              Owner: Prince
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin("dhruv@gmail.com", "dhruv123")}
              className="demo-badge-btn customer"
            >
              Customer: Dhruv
            </button>
          </div>
        </div>

        <p className="register-link">
          Don't have an account? <Link to="/register">Register</Link>
        </p>

        <Link to="/" className="back-home">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default Login;