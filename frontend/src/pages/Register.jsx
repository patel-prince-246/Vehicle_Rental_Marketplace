import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Car, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Register.css";

function Register() {
  const [role, setRole] = useState("customer");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    city: "Nadiad",
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
    <div className="register-page">
      <div className="register-card">
        <Link to="/" className="register-brand">
          <Car size={30} />
          <span>RentWheels</span>
        </Link>

        <h1>Create Account</h1>
        <p className="register-subtitle">Join as a Customer, Vehicle Owner, or Agency</p>

        {/* Role Selector Tabs */}
        <div className="role-selector">
          <button
            type="button"
            className={`role-tab ${role === "customer" ? "active" : ""}`}
            onClick={() => setRole("customer")}
          >
            Customer
          </button>
          <button
            type="button"
            className={`role-tab ${role === "owner" ? "active" : ""}`}
            onClick={() => setRole("owner")}
          >
            Vehicle Owner
          </button>
          <button
            type="button"
            className={`role-tab ${role === "agency" ? "active" : ""}`}
            onClick={() => setRole("agency")}
          >
            Rental Agency
          </button>
        </div>

        {error && (
          <div className="register-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="register-alert success">
            <CheckCircle size={18} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              name="name"
              placeholder="e.g. John Doe"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Email Address *</label>
              <input
                type="email"
                name="email"
                placeholder="name@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                name="phone"
                placeholder="e.g. 9876543210"
                value={formData.phone}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Password *</label>
              <div className="password-input">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>City *</label>
              <input
                type="text"
                name="city"
                placeholder="e.g. Nadiad"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Agency specific fields */}
          {role === "agency" && (
            <div className="agency-fields">
              <div className="form-group">
                <label>Agency Name *</label>
                <input
                  type="text"
                  name="agencyName"
                  placeholder="e.g. Express Car Rentals"
                  value={formData.agencyName}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Office Address *</label>
                <input
                  type="text"
                  name="address"
                  placeholder="Full office address"
                  value={formData.address}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Registration Number (Optional)</label>
                <input
                  type="text"
                  name="registrationNumber"
                  placeholder="e.g. REG-12345"
                  value={formData.registrationNumber}
                  onChange={handleChange}
                />
              </div>
            </div>
          )}

          <button type="submit" className="register-submit-btn" disabled={loading}>
            {loading ? "Registering..." : `Register as ${role.charAt(0).toUpperCase() + role.slice(1)}`}
          </button>
        </form>

        <p className="login-redirect-link">
          Already have an account? <Link to="/login">Sign in here</Link>
        </p>

        <Link to="/" className="back-home-link">
          Back to Home
        </Link>
      </div>
    </div>
  );
}

export default Register;
