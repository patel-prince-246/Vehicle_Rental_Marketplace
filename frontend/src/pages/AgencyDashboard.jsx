import { useState, useEffect } from "react";
import { Plus, Trash2, Car, ShieldCheck, MapPin, Building2 } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import StatusBadge from "../components/common/StatusBadge";
import StatCard from "../components/common/StatCard";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";


function AgencyDashboard() {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [agencyProfile, setAgencyProfile] = useState(null);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      setError("");

      const [vehRes, profRes] = await Promise.allSettled([
        api.get("/vehicles/my"),
        api.get("/agencies/profile"),
      ]);

      if (vehRes.status === "fulfilled" && vehRes.value.data?.success) {
        setVehicles(vehRes.value.data.vehicles || []);
      }

      if (profRes.status === "fulfilled" && profRes.value.data?.success) {
        setAgencyProfile(profRes.value.data.agency);
      }
    } catch (err) {
      console.error("Error loading agency dashboard data:", err);
      setError("Unable to load agency data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
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
        vehicleid: formData.vehicleid || "AGC-VEH-" + Date.now().toString().slice(-6),
        pricePerDay: Number(formData.pricePerDay),
        year: Number(formData.year || 2024),
        imageUrl:
          formData.imageUrl.trim() ||
          "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80",
      };

      const res = await api.post("/vehicles", payload);
      if (res.data?.success) {
        alert("Vehicle added to your agency fleet!");
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
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add vehicle.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (vehicleId) => {
    if (!window.confirm("Are you sure you want to remove this vehicle from your fleet?")) return;

    try {
      const res = await api.delete(`/vehicles/${vehicleId}`);
      if (res.data?.success) {
        fetchData();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove vehicle.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "available":
      case "verified":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "booked":
      case "pending":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Agency Fleet Portal</h1>
            <p className="text-slate-500 mt-1">
              Commercial Partner: <strong className="text-slate-700">{agencyProfile?.agencyName || user?.name || "Agency"}</strong> · Manage enterprise vehicle inventory.
            </p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium px-4 py-2.5 rounded-xl transition shadow-sm"
          >
            <Plus size={18} />
            <span>{showAddForm ? "Close Form" : "Add Fleet Vehicle"}</span>
          </button>
        </div>

        {/* Agency Info Banner */}
        {agencyProfile && (
          <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4 sm:p-6 mb-8 flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2 text-slate-700">
              <Building2 size={18} className="text-indigo-600" />
              <span><strong>Agency:</strong> {agencyProfile.agencyName}</span>
            </div>
            {agencyProfile.address && (
              <div className="flex items-center gap-2 text-slate-700">
                <MapPin size={18} className="text-indigo-600" />
                <span><strong>Location:</strong> {agencyProfile.address}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-700">
              <ShieldCheck size={18} className="text-indigo-600" />
              <span>
                <strong>Status:</strong>{" "}
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(agencyProfile.verificationStatus || 'verified')}`}>
                  {agencyProfile.verificationStatus || 'verified'}
                </span>
              </span>
            </div>
          </div>
        )}

        {/* Quick Fleet Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Fleet Size</span>
            <strong className="text-2xl sm:text-3xl font-bold text-slate-900 mt-2">{vehicles.length}</strong>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available for Booking</span>
            <strong className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">
              {vehicles.filter((v) => v.status === "available").length}
            </strong>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Currently Rented</span>
            <strong className="text-2xl sm:text-3xl font-bold text-amber-500 mt-2">
              {vehicles.filter((v) => v.status === "booked").length}
            </strong>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Verified Listings</span>
            <strong className="text-2xl sm:text-3xl font-bold text-indigo-600 mt-2">
              {vehicles.filter((v) => v.verificationStatus === "verified").length} / {vehicles.length}
            </strong>
          </div>
        </div>

        {/* Add Vehicle Drawer/Form */}
        {showAddForm && (
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Add Fleet Vehicle</h2>
            <form onSubmit={handleAddVehicle} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    placeholder="e.g. Toyota"
                    value={formData.brand}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Model *</label>
                  <input
                    type="text"
                    name="model"
                    placeholder="e.g. Innova Crysta"
                    value={formData.model}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition bg-white"
                  >
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Bike">Bike</option>
                    <option value="Van">Van / Tempo</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rent Per Day (₹) *</label>
                  <input
                    type="number"
                    name="pricePerDay"
                    placeholder="e.g. 3500"
                    value={formData.pricePerDay}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">City / Location *</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="e.g. Ahmedabad"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Year of Manufacture</label>
                  <input
                    type="number"
                    name="year"
                    placeholder="2024"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    placeholder="e.g. GJ01XX5678"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Photo Image URL (Optional)</label>
                <input
                  type="url"
                  name="imageUrl"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Vehicle Specifications & Terms</label>
                <textarea
                  name="description"
                  rows="3"
                  placeholder="Commercial vehicle, full insurance included, GPS enabled..."
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium px-6 py-2.5 rounded-xl transition shadow-sm"
                >
                  {submitting ? "Adding..." : "Add to Fleet"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-5 py-2.5 rounded-xl transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-900 mb-6">Agency Fleet Inventory</h2>

        {loading ? (
          <p className="text-center py-12 text-slate-500">Loading fleet...</p>
        ) : vehicles.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3 my-6">
            <Car size={48} className="text-slate-400" />
            <h3 className="text-lg font-semibold text-slate-800">No Fleet Vehicles Added Yet</h3>
            <p className="text-sm">Add commercial vehicles to start accepting customer reservations.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <div key={v._id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
                <img
                  src={v.imageUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"}
                  alt={`${v.brand} ${v.model}`}
                  className="w-full h-48 object-cover"
                />

                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{v.brand} {v.model}</h3>
                      <span className="text-indigo-600 font-bold text-lg whitespace-nowrap">₹{v.pricePerDay ?? v.price}/day</span>
                    </div>

                    <p className="text-sm text-slate-500 mb-4 flex items-center gap-1">
                      <MapPin size={14} className="text-slate-400 shrink-0" /> {v.city || "Gujarat"} · {v.type}
                    </p>

                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(v.status)}`}>
                        {v.status}
                      </span>
                      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(v.verificationStatus)}`}>
                        {v.verificationStatus}
                      </span>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleDelete(v._id)}
                      className="inline-flex items-center gap-1.5 text-sm text-rose-600 hover:text-rose-700 font-medium px-3 py-1.5 rounded-lg hover:bg-rose-50 transition"
                    >
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

      <Footer />
    </div>
  );
}

export default AgencyDashboard;


