import { useState, useEffect } from "react";
import { Plus, Trash2, Car, MapPin, X } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import StatusBadge from "../components/common/StatusBadge";
import StatCard from "../components/common/StatCard";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";


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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-10">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-600">Owner Management Portal</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
              Host: {user?.name || "Prince"}
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">Manage your vehicle listings, daily rates, and status.</p>
          </div>

          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
          >
            {showAddForm ? <X size={16} /> : <Plus size={16} />}
            <span>{showAddForm ? "Close Form" : "List New Vehicle"}</span>
          </button>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Total Listed Vehicles</span>
            <strong className="text-3xl font-extrabold text-slate-900 block mt-1">{vehicles.length}</strong>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Available for Rent</span>
            <strong className="text-3xl font-extrabold text-emerald-600 block mt-1">
              {vehicles.filter((v) => v.status === "available").length}
            </strong>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500">Verified Listings</span>
            <strong className="text-3xl font-extrabold text-blue-600 block mt-1">
              {vehicles.filter((v) => v.verificationStatus === "verified").length} / {vehicles.length}
            </strong>
          </div>
        </div>

        {/* Add Vehicle Drawer */}
        {showAddForm && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-md mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add Vehicle to Marketplace</h2>

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    placeholder="e.g. Hyundai"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Model *</label>
                  <input
                    type="text"
                    name="model"
                    placeholder="e.g. Verna"
                    value={formData.model}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  >
                    <option value="Car">Car</option>
                    <option value="Bike">Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="SUV">SUV</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Rent Per Day (₹) *</label>
                  <input
                    type="number"
                    name="pricePerDay"
                    placeholder="e.g. 1500"
                    value={formData.pricePerDay}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">City / Location *</label>
                  <input
                    type="text"
                    name="city"
                    placeholder="e.g. Vadodara"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Year of Manufacture</label>
                  <input
                    type="number"
                    name="year"
                    placeholder="2024"
                    value={formData.year}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    placeholder="e.g. GJ06AB1234"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Photo Image URL (Optional)</label>
                <input
                  type="url"
                  name="imageUrl"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={handleInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-60"
                >
                  {submitting ? "Publishing..." : "Publish Vehicle"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition-all cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <h2 className="text-xl font-bold text-slate-900 mb-4">My Vehicle Listings</h2>

        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 text-sm">Loading your vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-slate-300 p-8">
            <Car size={48} className="text-slate-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-1">No Vehicles Listed Yet</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">
              Click "List New Vehicle" above to add your first car or bike to the marketplace!
            </p>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-6 py-2.5 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700"
            >
              List Vehicle Now
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((v) => (
              <div
                key={v._id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col"
              >
                <img
                  src={v.imageUrl || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"}
                  alt={`${v.brand} ${v.model}`}
                  className="w-full h-44 object-cover"
                />

                <div className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-baseline mb-1">
                    <h3 className="font-bold text-slate-900">{v.brand} {v.model}</h3>
                    <span className="font-bold text-blue-600">₹{v.pricePerDay ?? v.price}/day</span>
                  </div>

                  <p className="text-xs text-slate-500 flex items-center gap-1 mb-4">
                    <MapPin size={13} className="text-slate-400" />
                    <span>{v.city || "Gujarat"} · {v.type}</span>
                  </p>

                  <div className="flex gap-2 mb-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
                      {v.status}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                      {v.verificationStatus}
                    </span>
                  </div>

                  <div className="mt-auto pt-3 border-t border-slate-100 flex justify-end">
                    <button
                      onClick={() => handleDelete(v._id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                    >
                      <Trash2 size={14} />
                      <span>Remove</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default OwnerDashboard;

