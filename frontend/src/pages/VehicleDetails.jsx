import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, ShieldCheck, User, Calendar, Tag, AlertCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "./VehicleDetails.css";

function VehicleDetails() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await api.get(`/vehicles/${id}`);
        if (res.data?.success && res.data.vehicle) {
          setVehicle(res.data.vehicle);
        } else {
          setError("Vehicle not found");
        }
      } catch (err) {
        console.error("Error fetching vehicle:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load vehicle details. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchVehicle();
    }
  }, [id]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="vehicle-details-container" style={{ textAlign: "center", padding: "5rem 0" }}>
          <h2>Loading vehicle details...</h2>
        </div>
      </>
    );
  }

  if (error || !vehicle) {
    return (
      <>
        <Navbar />
        <div className="vehicle-details-container" style={{ textAlign: "center", padding: "5rem 0" }}>
          <AlertCircle size={48} color="#ef4444" style={{ margin: "0 auto 1rem" }} />
          <h1>Vehicle Not Found</h1>
          <p style={{ color: "#64748b", margin: "1rem 0 2rem" }}>{error || "The vehicle you requested does not exist or is unavailable."}</p>
          <Link to="/vehicles" className="book-now-btn" style={{ display: "inline-block", maxWidth: "200px" }}>
            Browse All Vehicles
          </Link>
        </div>
      </>
    );
  }

  const vehicleName = `${vehicle.brand} ${vehicle.model}`;
  const price = vehicle.pricePerDay ?? vehicle.price ?? 0;
  const image = vehicle.imageUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80";
  const ownerName = vehicle.owner?.name || vehicle.owner?.agencyName || "Prince (Verified Owner)";

  return (
    <>
      <Navbar />

      <div className="vehicle-details-container">
        <Link to="/vehicles" className="back-link">
          &larr; Back to Vehicles
        </Link>

        <div className="vehicle-details-layout">
          <div className="vehicle-details-main">
            <img src={image} alt={vehicleName} className="vehicle-main-image" />

            <div className="vehicle-info">
              <div className="vehicle-title-row">
                <div>
                  <h1>{vehicleName}</h1>
                  <p className="vehicle-location">
                    <MapPin size={16} style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 4 }} />
                    {vehicle.city || "Gujarat"} · {vehicle.type}
                  </p>
                </div>

                <div className="vehicle-rating">
                  <ShieldCheck size={18} color="#16a34a" style={{ display: "inline", verticalAlign: "text-bottom", marginRight: 4 }} />
                  Verified Listing
                </div>
              </div>

              <hr />

              <h2>Vehicle Specifications</h2>
              <div className="vehicle-specs">
                <div>
                  <span>Category</span>
                  <strong>{vehicle.type}</strong>
                </div>

                <div>
                  <span>Model Year</span>
                  <strong>{vehicle.year || "2023"}</strong>
                </div>

                <div>
                  <span>City / Location</span>
                  <strong>{vehicle.city || "Nadiad"}</strong>
                </div>

                <div>
                  <span>Status</span>
                  <strong style={{ color: vehicle.status === "available" ? "#16a34a" : "#dc2626" }}>
                    {vehicle.status === "available" ? "Available Now" : vehicle.status}
                  </strong>
                </div>
              </div>

              <hr />

              <h2>About this vehicle</h2>
              <p className="vehicle-description">
                {vehicle.description ||
                  "Well maintained, serviced on time, and sanitized before every booking. Fuel-efficient and comfortable for both city driving and road trips."}
              </p>

              <hr />

              <h2>Vehicle Host / Owner</h2>
              <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "1rem 0" }}>
                <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  <User size={22} />
                </div>
                <div>
                  <strong>{ownerName}</strong>
                  <p style={{ margin: 0, fontSize: 13, color: "#64748b" }}>
                    {vehicle.owner?.phone ? `Contact: ${vehicle.owner.phone}` : "Top Rated Verified Host"}
                  </p>
                </div>
              </div>

              <hr />

              <h2>Customer Reviews</h2>
              <div className="review-card">
                <strong>Dhruv (Customer)</strong>
                <p>★★★★★</p>
                <p>Great ride! The vehicle was clean, handed over promptly, and drove smoothly throughout the trip.</p>
              </div>
            </div>
          </div>

          <aside className="vehicle-booking-card">
            <h2>
              ₹{price}
              <span> / day</span>
            </h2>

            <p className="availability-text">
              Reserve now for your upcoming trip. Free cancellation up to 24h before pickup.
            </p>

            <Link to={`/booking/${vehicle._id}`} className="book-now-btn">
              Proceed to Book
            </Link>

            <p className="booking-disclaimer">
              Includes basic insurance, 24/7 roadside assistance, and instant booking confirmation.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}

export default VehicleDetails;