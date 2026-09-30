import { Link, NavLink, useNavigate } from "react-router-dom";
import { CarFront, User, LogOut, LayoutDashboard } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./Navbar.css";

function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const getDashboardPath = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "admin":
        return "/admin/dashboard";
      case "owner":
        return "/owner/dashboard";
      case "agency":
        return "/agency/dashboard";
      default:
        return "/customer/dashboard";
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        <CarFront size={30} />
        <span>
          Rent<span className="logo-highlight">Wheels</span>
        </span>
      </Link>

      <nav className="navbar-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/vehicles">Vehicles</NavLink>
      </nav>

      <div className="navbar-actions">
        {isAuthenticated ? (
          <div className="user-nav-container">
            <Link to={getDashboardPath()} className="dashboard-nav-link">
              <LayoutDashboard size={18} />
              <span>Dashboard</span>
            </Link>
            <div className="user-profile-badge">
              <User size={16} />
              <span className="user-name">{user?.name}</span>
              <span className={`role-tag role-${user?.role}`}>{user?.role}</span>
            </div>
            <button onClick={handleLogout} className="logout-btn" title="Logout">
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        ) : (
          <>
            <Link to="/login" className="login-link">
              Login
            </Link>
            <Link to="/register" className="register-btn">
              Get Started
            </Link>
          </>
        )}
      </div>
    </header>
  );
}

export default Navbar;