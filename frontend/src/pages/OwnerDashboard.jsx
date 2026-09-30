import { useState, useEffect } from "react";
import { Plus, Trash2, Car, CheckCircle, AlertCircle, MapPin, Tag } from "lucide-react";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import "./OwnerDashboard.css";

function OwnerDashboard() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    vehicleid: "",
    brand: "",
    model: "",
    type: "Car",
    pricePerDay: "",
    city: "Vadodara",
    year: "2024",
    registrationNumber: "",
    imageUrl: "",
    description: "",
  });

  const fetchMyVehicles = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/vehicles/my");
      if (res.data?.success) {
        setVehicles(res.data.vehicles || []);
      }
    } catch (err) {
      console.error("Error loading owner vehicles:", err);
      setError("Unable to load your vehicles.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyVehicles();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.brand || !formData.model || !formData.pricePerDay || !formData.city) {
      alert("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        vehicleid: formData.vehicleid || "VEH-" + Date.now().toString().slice(-6),
        pricePerDay: Number(formData.pricePerDay),
        year: Number(formData.year || 2024),
        imageUrl:
          formData.imageUrl.trim() ||
          "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
      };

      const res = await api.post("/vehicles", payload);
      if (res.data?.success) {
        alert("Vehicle added successfully!");
        setShowAddForm(false);
        setFormData({
          vehicleid: "",
          brand: "",
          model: "",
          type: "Car",
          pricePerDay: "",
          city: "Vadodara",
          year: "2024",
          registrationNumber: "",
          imageUrl: "",
          description: "",
        });
        fetchMyVehicles();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add vehicle.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm("Are you sure you want to delete this vehicle listing?")) return;

    try {
      const res = await api.delete(`/vehicles/${vehicleId}`);
      if (res.data?.success) {
        fetchMyVehicles();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete vehicle.");
    }
  };

  return (
    <>
      <Navbar />

      <div className="owner-dashboard-container">
        <div className="owner-header">
          <div>
            <h1>Owner Management Portal</h1>
            <p className="owner-subtitle">
              Host: <strong>{user?.name || "Prince"}</strong> · Manage your vehicle fleet & rental listings.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="add-vehicle-btn"
          >
            <Plus size={18} />
            <span>{showAddForm ? "Close Form" : "List New Vehicle"}</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="owner-stats-grid">
          <div className="owner-stat-card">
            <span>Total Listed Vehicles</span>
            <strong>{vehicles.length}</strong>
          </div>
          <div className="owner-stat-card">
            <span>Available for Rent</span>
            <strong style={{ color: "#16a34a" }}>
              {vehicles.filter((v) => v.status === "available").length}
            </strong>
          </div>
          <div className="owner-stat-card">
            <span>Verified Status</span>
            <strong style={{ color: "#2563eb" }}>
              {vehicles.filter((v) => v.verificationStatus === "verified").length} / {vehicles.length}
            </strong>
          </div>
        </div>

        {/* Add Vehicle Drawer/Form */}
        {showAddForm && (
          <div className="add-vehicle-card">
            <h2>Add New Vehicle to Marketplace</h2>
            <form onSubmit={handleAddVehicle}>
              <div className="form-grid-2">
                <div>
                  <label>Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    placeholder="e.g. Hyundai"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label>Model *</label>
                  <input
                    type="text"
                    name="model"
                    placeholder="e.g. Verna"
                    value={formData.model}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-3">
                <div>
                  <label>Vehicle Type *</label>
                  <select name="type" value={formData.type} onChange={handleInputChange}>
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="SUV">SUV</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label>Rent Per Day (₹) *</label>
                  <input
                    type="number"
                    name="pricePerDay"
                    placeholder="e.g. 1500"
                    value={formData.pricePerDay}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                <div>
                  <label>City / Location *</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="e.g. Vadodara"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-grid-2">
                <div>
                  <label>Year of Manufacture</label>
                  <input
                    type="number"
                    name="year"
                    placeholder="2024"
                    value={formData.year}
                    onChange={handleInputChange}
                  />
                </div>

                <div>
                  <label>Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    placeholder="e.g. GJ06AB1234"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                  />
                </div>
              </div>

              <div>
                <label>Photo Image URL (Optional - default image will be used if blank)</label>
                <input
                  type="url"
                  name="imageUrl"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                />
              </div>

              <div>
                <label>Description</label>
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Comfortable, sanitized, and well-maintained..."
                  value={formData.description}
                  onChange={handleInputChange}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button type="submit" className="save-vehicle-btn" disabled={submitting}>
                  {submitting ? "Publishing..." : "Publish Vehicle Listing"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="cancel-form-btn"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <h2>My Vehicle Listings</h2>

        {loading ? (
          <p style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>Loading listings...</p>
        ) : vehicles.length === 0 ? (
          <div className="empty-listings-card">
            <Car size={48} color="#94a3b8" />
            <h3>No Vehicles Listed Yet</h3>
            <p>Click "List New Vehicle" above to add your first car or bike to the marketplace!</p>
          </div>
        ) : (
          <div className="owner-vehicles-grid">
            {vehicles.map((v) => (
              <div key={v._id} className="owner-vehicle-card">
                <img
                  src={v.imageUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"}
                  alt={`${v.brand} ${v.model}`}
                  className="owner-vehicle-img"
                />

                <div className="owner-vehicle-body">
                  <div className="owner-vehicle-header">
                    <h3>{v.brand} {v.model}</h3>
                    <span className="owner-vehicle-price">₹{v.pricePerDay ?? v.price}/day</span>
                  </div>

                  <p className="owner-vehicle-location">
                    <MapPin size={14} style={{ display: "inline" }} /> {v.city || "Gujarat"} · {v.type}
                  </p>

                  <div className="owner-badges-row">
                    <span className={`status-pill ${v.status}`}>{v.status}</span>
                    <span className={`verify-pill ${v.verificationStatus}`}>{v.verificationStatus}</span>
                  </div>

                  <div className="owner-card-footer">
                    <button onClick={() => handleDelete(v._id)} className="delete-btn">
                      <Trash2 size={16} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default OwnerDashboard;
