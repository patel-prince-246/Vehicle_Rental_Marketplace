
import { Link } from "react-router-dom";
import { Search, ShieldCheck, CalendarCheck, CarFront } from "lucide-react";
import Navbar from "../components/Navbar";
import "./Home.css";

function Home() {
  return (
    <>
      <Navbar />

      <main>
        <section className="hero">
          <div className="hero-content">
            <span className="hero-tag">YOUR JOURNEY STARTS HERE</span>

            <h1>
              Find Your Perfect
              <span> Ride Today</span>
            </h1>

            <p>
              Rent cars, bikes, and scooters from trusted owners
              and rental agencies. Your next journey starts here.
            </p>

            <div className="hero-buttons">
              <Link to="/vehicles" className="primary-btn">
                <Search size={19} />
                Explore Vehicles
              </Link>

              <Link to="/register" className="secondary-btn">
                List Your Vehicle
              </Link>
            </div>
          </div>

          <div className="hero-image">
            <img src="/src/assets/hero.png" alt="Rental vehicle" />
          </div>
        </section>

        <section className="features">
          <h2>Why Choose RentWheels?</h2>
          <p className="features-subtitle">
            Everything you need for a smooth rental experience.
          </p>

          <div className="feature-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <CarFront size={28} />
              </div>
              <h3>Wide Vehicle Choices</h3>
              <p>
                Explore cars, bikes, and scooters to suit your journey.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <ShieldCheck size={28} />
              </div>
              <h3>Trusted Rentals</h3>
              <p>
                Find vehicles listed by owners and rental agencies.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <CalendarCheck size={28} />
              </div>
              <h3>Easy Booking</h3>
              <p>
                Choose your dates and submit your booking online.
              </p>
            </div>
          </div>
        </section>

        <section className="how-it-works" id="how-it-works">
          <h2>How It Works</h2>
          <div className="steps">
            <div><strong>1</strong><h3>Find a vehicle</h3><p>Browse available vehicles.</p></div>
            <div><strong>2</strong><h3>Choose your dates</h3><p>Select your rental period.</p></div>
            <div><strong>3</strong><h3>Book your ride</h3><p>Submit your booking request.</p></div>
          </div>
        </section>
      </main>

      <footer className="footer">
        <p>© {new Date().getFullYear()} RentWheels. All rights reserved.</p>
      </footer>
    </>
  );
}

export default Home;