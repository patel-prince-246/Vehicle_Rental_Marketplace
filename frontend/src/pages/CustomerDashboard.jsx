import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, AlertCircle, Car, Clock, CheckCircle } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./CustomerDashboard.css";

function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/bookings/my");
      if (res.data?.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error("Error fetching customer bookings:", err);
      setError("Unable to load your bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      setCancellingId(bookingId);
      const res = await api.patch(`/bookings/${bookingId}/cancel`);
      if (res.data?.success) {
        fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const activeCount = bookings.filter((b) => ["confirmed", "ongoing", "pending"].includes(b.status)).length;
  const completedCount = bookings.filter((b) => b.status === "completed").length;

  return (
    <>
      <Navbar />

      <div className="dashboard-container">
        <div className="dashboard-header">
          <div>
            <h1>Customer Portal</h1>
            <p className="dashboard-subtitle">
              Welcome back, <strong>{user?.name || "Dhruv"}</strong>! Manage your vehicle reservations.
            </p>
          </div>
          <Link to="/vehicles" className="primary-action-btn">
            + Book Another Vehicle
          </Link>
        </div>

        {/* Stats Row */}
        <div className="dashboard-stats-grid">
          <div className="stat-card">
            <span className="stat-label">Total Bookings</span>
            <strong className="stat-number">{bookings.length}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Active / Upcoming</span>
            <strong className="stat-number" style={{ color: "#2563eb" }}>{activeCount}</strong>
          </div>
          <div className="stat-card">
            <span className="stat-label">Completed Trips</span>
            <strong className="stat-number" style={{ color: "#16a34a" }}>{completedCount}</strong>
          </div>
        </div>

        {error && (
          <div className="dashboard-alert error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <h2>Your Reservations</h2>

        {loading ? (
          <p style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading your reservations...</p>
        ) : bookings.length === 0 ? (
          <div className="empty-dashboard-card">
            <Car size={48} color="#94a3b8" />
            <h3>No Bookings Found</h3>
            <p>You haven't reserved any vehicles yet. Explore our verified fleet and plan your next trip!</p>
            <Link to="/vehicles" className="primary-action-btn">
              Explore Available Vehicles
            </Link>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map((booking) => {
              const vehicle = booking.vehicleId || {};
              const vehicleName = vehicle.brand && vehicle.model ? `${vehicle.brand} ${vehicle.model}` : "Reserved Vehicle";

              return (
                <div key={booking._id} className="booking-card">
                  <div className="booking-card-main">
                    <img
                      src={vehicle.imageUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"}
                      alt={vehicleName}
                      className="booking-vehicle-thumb"
                    />
                    <div>
                      <div className="booking-id-tag">ID: {booking.bookingid || booking._id.slice(-6)}</div>
                      <h3>{vehicleName}</h3>
                      <p className="booking-meta">
                        <MapPin size={14} style={{ display: "inline", verticalAlign: "middle" }} /> {booking.pickupLocation || vehicle.city || "Gujarat"}
                      </p>
                      <p className="booking-dates">
                        <Calendar size={14} style={{ display: "inline", verticalAlign: "middle" }} />{" "}
                        {booking.startDate?.split("T")[0]} to {booking.endDate?.split("T")[0]}
                      </p>
                    </div>
                  </div>

                  <div className="booking-card-side">
                    <div className="booking-price">₹{booking.totalAmount}</div>
                    <span className={`status-badge status-${booking.status}`}>
                      {booking.status}
                    </span>

                    {["pending", "confirmed"].includes(booking.status) && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="cancel-booking-btn"
                      >
                        {cancellingId === booking._id ? "Cancelling..." : "Cancel Reservation"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default CustomerDashboard;
