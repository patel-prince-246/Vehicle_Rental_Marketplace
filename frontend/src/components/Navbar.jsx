
import { Link, NavLink } from "react-router-dom";
import { CarFront } from "lucide-react";
import "./Navbar.css";

function Navbar() {
  return (
    <header className="navbar">
      <Link to="/" className="navbar-logo">
        <CarFront size={30} />
        <span>Rent<span className="logo-highlight">Wheels</span></span>
      </Link>

      <nav className="navbar-links">
        <NavLink to="/">Home</NavLink>
        <NavLink to="/vehicles">Vehicles</NavLink>
        <a href="#how-it-works">How It Works</a>
      </nav>

      <div className="navbar-actions">
        <Link to="/login" className="login-link">Login</Link>
        <Link to="/register" className="register-btn">
          Get Started
        </Link>
      </div>
    </header>
  );
}

export default Navbar;