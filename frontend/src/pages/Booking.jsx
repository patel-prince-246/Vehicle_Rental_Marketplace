import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Calendar, MapPin, CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./Booking.css";

function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successBooking, setSuccessBooking] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [returnLocation, setReturnLocation] = useState("");

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/vehicles/${id}`);
        if (res.data?.success && res.data.vehicle) {
          setVehicle(res.data.vehicle);
          setPickupLocation(res.data.vehicle.city || "Nadiad");
          setReturnLocation(res.data.vehicle.city || "Nadiad");
        } else {
          setError("Vehicle not found");
        }
      } catch (err) {
        console.error("Error loading vehicle for booking:", err);
        setError("Could not load vehicle details.");
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
        <div className="booking-container" style={{ textAlign: "center", padding: "4rem 0" }}>
          <h2>Loading booking details...</h2>
        </div>
      </>
    );
  }

  if (error || !vehicle) {
    return (
      <>
        <Navbar />
        <div className="booking-container" style={{ textAlign: "center", padding: "4rem 0" }}>
          <h2>{error || "Vehicle not found"}</h2>
          <Link to="/vehicles" style={{ color: "#2563eb", marginTop: "1rem", display: "inline-block" }}>
            Back to vehicle catalog
          </Link>
        </div>
      </>
    );
  }

  const pricePerDay = vehicle.pricePerDay ?? vehicle.price ?? 0;
  const days =
    startDate && endDate
      ? Math.max(
          1,
          Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
        )
      : 0;

  const total = days * pricePerDay;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/booking/${id}` } });
      return;
    }

    if (user?.role !== "customer") {
      setError("Only customers can book vehicles. Please log in with a customer account (e.g., Dhruv).");
      return;
    }

    if (!startDate || !endDate || !pickupLocation.trim()) {
      setError("Please fill in all rental fields.");
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      setError("Return date must be after pickup date.");
      return;
    }

    setSubmitting(true);

    try {
      const bookingPayload = {
        bookingid: "BK-" + Date.now().toString().slice(-6),
        vehicleId: vehicle._id,
        startDate,
        endDate,
        pickupLocation: pickupLocation.trim(),
        returnLocation: (returnLocation || pickupLocation).trim(),
      };

      const res = await api.post("/bookings", bookingPayload);

      if (res.data?.success) {
        setSuccessBooking(res.data.booking);
      } else {
        setError(res.data?.message || "Booking failed.");
      }
    } catch (err) {
      console.error("Booking error:", err);
      setError(err.response?.data?.message || err.message || "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (successBooking) {
    return (
      <>
        <Navbar />
        <div className="booking-container" style={{ maxWidth: 600, textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", padding: "2.5rem 1.5rem", borderRadius: 16 }}>
            <CheckCircle2 size={64} color="#16a34a" style={{ margin: "0 auto 1rem" }} />
            <h1 style={{ color: "#166534", margin: "0 0 0.5rem" }}>Booking Confirmed!</h1>
            <p style={{ color: "#4b5563", fontSize: 16 }}>
              Your reservation for <strong>{vehicle.brand} {vehicle.model}</strong> has been created successfully.
            </p>

            <div style={{ background: "#ffffff", padding: "1.2rem", borderRadius: 10, margin: "1.5rem 0", textAlign: "left", fontSize: 14 }}>
              <p><strong>Booking ID:</strong> {successBooking.bookingid}</p>
              <p><strong>Duration:</strong> {startDate} to {endDate} ({days} days)</p>
              <p><strong>Pickup City:</strong> {pickupLocation}</p>
              <p><strong>Total Amount:</strong> ₹{total}</p>
              <p><strong>Status:</strong> <span style={{ textTransform: "capitalize", color: "#2563eb", fontWeight: "bold" }}>{successBooking.status}</span></p>
            </div>

            <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
              <Link to="/customer/dashboard" className="book-btn" style={{ textDecoration: "none", display: "inline-block", padding: "12px 24px" }}>
                View in Dashboard
              </Link>
              <Link to="/vehicles" style={{ textDecoration: "none", color: "#475569", background: "#e2e8f0", padding: "12px 24px", borderRadius: 8, fontWeight: 600 }}>
                Browse More
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="booking-container">
        <Link to={`/vehicles/${vehicle._id}`} className="back-link">
          <ArrowLeft size={16} style={{ display: "inline", verticalAlign: "middle", marginRight: 4 }} />
          Back to Vehicle Details
        </Link>

        <h1>Book Your Vehicle</h1>

        {error && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", padding: "12px 16px", borderRadius: 8, margin: "1rem 0" }}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <div className="booking-layout">
          <div className="booking-form-card">
            <h2>Rental Reservation</h2>

            {!isAuthenticated && (
              <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", padding: "10px 14px", borderRadius: 8, marginBottom: "1rem", fontSize: 14, color: "#1e40af" }}>
                ℹ️ You will need to log in as a customer (e.g. <strong>dhruv@gmail.com</strong>) to confirm this booking.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                <div>
                  <label>Pickup Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label>Return Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label>Pickup Location *</label>
                <input
                  type="text"
                  placeholder="e.g. Nadiad Bus Stand / Railway Station"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  required
                />
              </div>

              <div>
                <label>Return Location</label>
                <input
                  type="text"
                  placeholder="e.g. Same as pickup"
                  value={returnLocation}
                  onChange={(e) => setReturnLocation(e.target.value)}
                />
              </div>

              <button type="submit" className="book-btn" disabled={submitting}>
                {submitting ? "Processing Reservation..." : `Confirm Booking • ₹${total}`}
              </button>
            </form>
          </div>

          <aside className="booking-summary-card">
            <h2>Booking Summary</h2>

            <img
              src={vehicle.imageUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"}
              alt={`${vehicle.brand} ${vehicle.model}`}
              className="summary-image"
            />

            <h3>{vehicle.brand} {vehicle.model}</h3>
            <p className="summary-type">{vehicle.type} · {vehicle.city || "Gujarat"}</p>

            <hr />

            <div className="summary-row">
              <span>Daily Rate</span>
              <strong>₹{pricePerDay}</strong>
            </div>

            <div className="summary-row">
              <span>Total Duration</span>
              <strong>{days} {days === 1 ? "day" : "days"}</strong>
            </div>

            <div className="summary-row">
              <span>Taxes & Service</span>
              <strong style={{ color: "#16a34a" }}>Included (FREE)</strong>
            </div>

            <hr />

            <div className="summary-row total-row">
              <span>Estimated Total</span>
              <span>₹{total}</span>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

export default Booking;
