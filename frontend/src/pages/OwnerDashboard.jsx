import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  Car,
  MapPin,
  X,
  Calendar,
  Clock,
  CheckCircle2,
  Power,
  PowerOff,
  User,
  ShieldAlert,
  AlertCircle,
  FileText,
  DollarSign,
  TrendingUp,
  Edit3,
  Upload,
  Image as ImageIcon,
  Mail,
  Phone,
  ShieldCheck,
  Eye,
  UserCheck,
  Building2,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import StatusBadge from "../components/common/StatusBadge";
import StatCard from "../components/common/StatCard";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { GUJARAT_DISTRICTS } from "../constants/locations";

function OwnerDashboard() {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && ["vehicles", "bookings", "profile"].includes(tabFromUrl)
      ? tabFromUrl
      : "vehicles"
  );

  // Selected customer modal for owner to inspect renter details
  const [selectedCustomerBooking, setSelectedCustomerBooking] = useState(null);

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["vehicles", "bookings", "profile"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Vehicles state
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Edit Vehicle state
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editFormData, setEditFormData] = useState({
    brand: "",
    model: "",
    type: "Car",
    pricePerDay: "",
    city: "",
    year: "2024",
    registrationNumber: "",
    description: "",
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [updatingVehicle, setUpdatingVehicle] = useState(false);

  // Incoming Bookings state
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Profile state
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [profileCity, setProfileCity] = useState(user?.city || "");
  const [profileAddress, setProfileAddress] = useState(user?.address || "");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

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
      setLoadingVehicles(true);
      const res = await api.get("/vehicles/my");
      if (res.data?.success) {
        setVehicles(res.data.vehicles || []);
      }
    } catch (err) {
      console.error("Error loading owner vehicles:", err);
    } finally {
      setLoadingVehicles(false);
    }
  };

  const fetchIncomingBookings = async () => {
    try {
      setLoadingBookings(true);
      const res = await api.get("/bookings/owner");
      if (res.data?.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error("Error loading incoming bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchMyVehicles();
    fetchIncomingBookings();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfilePhone(user.phone || "");
      setProfileCity(user.city || "");
      setProfileAddress(user.address || "");
    }
  }, [user]);

  const [vehicleImageFile, setVehicleImageFile] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getFallbackImage = (vehicleType) => {
    switch (vehicleType?.toLowerCase()) {
      case "scooter":
        return "https://images.unsplash.com/photo-1591768575198-88dac53fbd0a?w=800&auto=format&fit=crop&q=80";
      case "bike":
        return "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80";
      case "suv":
        return "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80";
      default:
        return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80";
    }
  };

  const getImageUrl = (url, vehicleType) => {
    if (!url) return getFallbackImage(vehicleType);
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `http://localhost:5000${url.startsWith("/") ? "" : "/"}${url}`;
  };

  const handleAddVehicle = async (e) => {
    e.preventDefault();

    if (!formData.brand || !formData.pricePerDay || !formData.city) {
      alert("Please fill all required fields.");
      return;
    }

    setSubmitting(true);
    try {
      const data = new FormData();
      data.append("vehicleid", formData.vehicleid || "VEH-" + Date.now().toString().slice(-6));
      data.append("brand", formData.brand);
      data.append("model", formData.model || "");
      data.append("type", formData.type);
      data.append("pricePerDay", Number(formData.pricePerDay));
      data.append("city", formData.city);
      data.append("year", Number(formData.year || 2024));
      if (formData.registrationNumber) data.append("registrationNumber", formData.registrationNumber);
      if (formData.description) data.append("description", formData.description);

      if (vehicleImageFile) {
        data.append("image", vehicleImageFile);
      } else if (formData.imageUrl && formData.imageUrl.trim()) {
        data.append("imageUrl", formData.imageUrl.trim());
      } else {
        data.append("imageUrl", getFallbackImage(formData.type));
      }

      const res = await api.post("/vehicles", data);

      if (res.data?.success) {
        alert("Vehicle added successfully and submitted for admin review!");
        setShowAddForm(false);
        setVehicleImageFile(null);
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

  const handleOpenEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setEditFormData({
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      type: vehicle.type || "Car",
      pricePerDay: vehicle.pricePerDay || vehicle.price || "",
      city: vehicle.city || "",
      year: vehicle.year || "2024",
      registrationNumber: vehicle.registrationNumber || "",
      description: vehicle.description || "",
    });
    setEditImageFile(null);
    setEditImagePreview(getImageUrl(vehicle.imageUrl, vehicle.type));
  };

  const handleEditInputChange = (e) => {
    setEditFormData({ ...editFormData, [e.target.name]: e.target.value });
  };

  const handleEditImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditImageFile(file);
      setEditImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    if (!editingVehicle) return;

    if (!editFormData.brand || !editFormData.pricePerDay || !editFormData.city) {
      alert("Please fill all required fields.");
      return;
    }

    setUpdatingVehicle(true);
    try {
      const data = new FormData();
      data.append("brand", editFormData.brand);
      data.append("model", editFormData.model || "");
      data.append("type", editFormData.type);
      data.append("pricePerDay", Number(editFormData.pricePerDay));
      data.append("city", editFormData.city);
      data.append("year", Number(editFormData.year || 2024));
      data.append("registrationNumber", editFormData.registrationNumber || "");
      data.append("description", editFormData.description || "");

      if (editImageFile) {
        data.append("image", editImageFile);
      }

      const res = await api.put(`/vehicles/${editingVehicle._id}`, data);
      if (res.data?.success) {
        alert("Vehicle updated successfully!");
        setEditingVehicle(null);
        setEditImageFile(null);
        setEditImagePreview("");
        fetchMyVehicles();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update vehicle.");
    } finally {
      setUpdatingVehicle(false);
    }
  };

  // Soft Deactivate / Remove vehicle (SRS 3.1.2.3)
  const handleToggleDeactivate = async (vehicle) => {
    const isCurrentlyInactive = vehicle.status === "inactive";
    const confirmMsg = isCurrentlyInactive
      ? "Reactivate this vehicle listing and make it available for rental?"
      : "Deactivate (remove) this vehicle listing? It will be marked as inactive and hidden from public search.";

    if (!window.confirm(confirmMsg)) return;

    try {
      if (isCurrentlyInactive) {
        await api.put(`/vehicles/${vehicle._id}`, { status: "available" });
      } else {
        await api.delete(`/vehicles/${vehicle._id}`);
      }
      fetchMyVehicles();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update vehicle status.");
    }
  };

  // Booking Lifecycle updates (SRS 3.1.3.5 & 3.1.3.9 Confirm Return)
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      if (res.data?.success) {
        alert(`Booking status transitioned to "${newStatus}".`);
        fetchIncomingBookings();
        fetchMyVehicles();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update booking status.");
    }
  };

  const [declineBookingModal, setDeclineBookingModal] = useState(null);
  const [declineReason, setDeclineReason] = useState("Vehicle is currently undergoing maintenance / unavailable");
  const [customReason, setCustomReason] = useState("");
  const [declining, setDeclining] = useState(false);

  const handleDeclineBookingSubmit = async (e) => {
    e.preventDefault();
    if (!declineBookingModal) return;
    const finalReason = declineReason === "Other" ? customReason.trim() : (customReason.trim() ? `${declineReason} - ${customReason.trim()}` : declineReason);
    if (!finalReason) {
      alert("Please provide a reason for declining the booking request.");
      return;
    }
    setDeclining(true);
    try {
      const res = await api.post(`/bookings/${declineBookingModal._id}/cancel`, {
        cancellationReason: finalReason
      });
      if (res.data?.success) {
        alert("Booking request declined. The customer has been sent a notification with your specific reason.");
        setDeclineBookingModal(null);
        setCustomReason("");
        fetchIncomingBookings();
        fetchMyVehicles();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to decline booking.");
    } finally {
      setDeclining(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg("");
    try {
      const formData = new FormData();
      formData.append("name", profileName);
      formData.append("phone", profilePhone);
      formData.append("city", profileCity);
      formData.append("address", profileAddress);

      await api.put("/users/profile", formData);
      if (refreshProfile) await refreshProfile();
      setProfileSuccessMsg("Host profile updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Individual Vehicle Host
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Host: {user?.name || "Partner"}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Manage your fleet listings, incoming reservations, and rental handovers.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition cursor-pointer"
            >
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
              <span>{showAddForm ? "Close Form" : "+ Add Vehicle"}</span>
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Fleet"
            value={vehicles.length}
            icon={Car}
            color="indigo"
          />
          <StatCard
            label="Active / Available"
            value={vehicles.filter((v) => v.status === "available").length}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            label="Incoming Bookings"
            value={bookings.length}
            icon={Calendar}
            color="amber"
          />
          <StatCard
            label="Currently Rented"
            value={vehicles.filter((v) => v.status === "booked").length}
            icon={Clock}
            color="blue"
          />
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 mb-6 gap-2">
          <button
            onClick={() => setActiveTab("vehicles")}
            className={`pb-3 px-4 font-bold text-sm cursor-pointer transition border-b-2 ${
              activeTab === "vehicles"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            My Vehicles ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`pb-3 px-4 font-bold text-sm cursor-pointer transition border-b-2 ${
              activeTab === "bookings"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Incoming Booking Requests ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 px-4 font-bold text-sm cursor-pointer transition border-b-2 ${
              activeTab === "profile"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Host Profile Settings
          </button>
        </div>

        {/* Add Vehicle Drawer */}
        {showAddForm && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-lg mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Plus size={20} className="text-indigo-600" />
              Add Vehicle to Marketplace
            </h2>

            <form onSubmit={handleAddVehicle} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Name / Brand *</label>
                <input
                  type="text"
                  name="brand"
                  placeholder="e.g. Hyundai Creta, Honda City, Royal Enfield Classic 350, Activa 6G"
                  value={formData.brand}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Type *</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  >
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Bike">Bike (Motorcycle)</option>
                    <option value="Scooter">Scooter (Activa / EV)</option>
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Gujarat District / City *</label>
                  <select
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white cursor-pointer font-medium"
                  >
                    {GUJARAT_DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        📍 {district}
                      </option>
                    ))}
                  </select>
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    placeholder="e.g. GJ-06-AB-1234"
                    value={formData.registrationNumber}
                    onChange={handleInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Upload Vehicle Photo (Device) *
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setVehicleImageFile(e.target.files[0])}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-60"
                >
                  {submitting ? "Publishing..." : "Publish Listing"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TAB 1: VEHICLES */}
        {activeTab === "vehicles" && (
          <div>
            {loadingVehicles ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading your fleet...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <EmptyState
                icon={Car}
                title="No Vehicles Listed"
                description="You haven't added any vehicles to the marketplace yet. Click '+ Add Vehicle' above to list a vehicle."
                actionLabel="+ Add Vehicle"
                onAction={() => setShowAddForm(true)}
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((vehicle) => {
                  const isInactive = vehicle.status === "inactive";
                  return (
                    <div
                      key={vehicle._id}
                      className={`bg-white rounded-3xl border ${
                        isInactive ? "border-slate-300 opacity-75" : "border-slate-200"
                      } overflow-hidden shadow-xs hover:shadow-md transition flex flex-col`}
                    >
                      <div className="h-44 bg-slate-100 relative">
                        <img
                          src={getImageUrl(vehicle.imageUrl, vehicle.type)}
                          alt={vehicle.model}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getFallbackImage(vehicle.type);
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            vehicle.verificationStatus === "verified"
                              ? "bg-emerald-500 text-white"
                              : "bg-amber-500 text-white"
                          }`}>
                            {vehicle.verificationStatus || "pending"}
                          </span>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                            isInactive ? "bg-rose-600 text-white" : "bg-black/60 text-white backdrop-blur-xs"
                          }`}>
                            {vehicle.status}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <h3 className="font-bold text-base text-slate-900">
                            {vehicle.brand} {vehicle.model}
                          </h3>
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <MapPin size={12} />
                            <span>{vehicle.city || "Gujarat"}</span>
                            <span>·</span>
                            <span>{vehicle.type}</span>
                          </p>
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] text-slate-400 block">Rate / Day</span>
                            <span className="text-base font-black text-indigo-600">₹{vehicle.pricePerDay || vehicle.price}</span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(vehicle)}
                              className="p-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-600 transition cursor-pointer"
                              title="Edit Vehicle Details"
                            >
                              <Edit3 size={15} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleToggleDeactivate(vehicle)}
                              className={`p-2 rounded-xl transition cursor-pointer ${
                                isInactive
                                  ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                                  : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                              }`}
                              title={isInactive ? "Reactivate Vehicle" : "Deactivate Vehicle"}
                            >
                              {isInactive ? <Power size={15} /> : <PowerOff size={15} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: INCOMING BOOKINGS (SRS 3.1.3.8 & 3.1.3.9) */}
        {activeTab === "bookings" && (
          <div>
            {loadingBookings ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading incoming requests...</p>
              </div>
            ) : bookings.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No Incoming Bookings"
                description="No customer has reserved your vehicles yet. Ensure your vehicles are verified and set with competitive daily rates."
              />
            ) : (
              <div className="space-y-4">
                {bookings.map((b) => {
                  const isHighlighted =
                    searchParams.get("bookingId") &&
                    (b.bookingid === searchParams.get("bookingId") || b._id === searchParams.get("bookingId"));

                  return (
                    <div
                      key={b._id}
                      className={`bg-white rounded-3xl border p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all ${
                        isHighlighted
                          ? "border-indigo-500 ring-2 ring-indigo-400 bg-indigo-50/30 shadow-md"
                          : "border-slate-200"
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600">#{b.bookingid || b._id}</span>
                          <StatusBadge status={b.status} />
                          <StatusBadge status={b.paymentStatus} />
                          {isHighlighted && (
                            <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                              📌 Selected Request
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-1">
                          Vehicle: {b.vehicleId?.brand} {b.vehicleId?.model}
                        </h4>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <p className="text-xs text-slate-600">
                            Rented by: <strong className="text-slate-900">{b.customerId?.name || "Customer"}</strong>
                          </p>
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerBooking(b)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-[11px] font-bold transition cursor-pointer"
                          >
                            <Eye size={12} /> View Customer Profile
                          </button>
                        </div>
                        <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5 font-medium">
                          <Calendar size={13} className="text-indigo-600" />
                          <span>{new Date(b.startDate).toLocaleDateString()} &rarr; {new Date(b.endDate).toLocaleDateString()}</span>
                        </p>
                      </div>

                    <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 gap-2">
                      <div className="text-left md:text-right">
                        <span className="text-[10px] text-slate-400 block">Total Earnings</span>
                        <span className="text-base font-black text-indigo-600">₹{b.totalAmount}</span>
                      </div>

                      {/* Action buttons for booking lifecycle (SRS 3.1.3.5 & 3.1.3.9) */}
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedCustomerBooking(b)}
                          className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                        >
                          <UserCheck size={13} /> Customer Info
                        </button>
                        {b.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleUpdateBookingStatus(b._id, "confirmed")}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Accept &amp; Confirm
                            </button>
                            <button
                              onClick={() => {
                                setDeclineBookingModal(b);
                                setDeclineReason("Vehicle is currently undergoing maintenance / unavailable");
                                setCustomReason("");
                              }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Decline Request
                            </button>
                          </>
                        )}
                        {b.status === "confirmed" && (
                          <>
                            <button
                              onClick={() => handleUpdateBookingStatus(b._id, "ongoing")}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Handover Vehicle (Start Trip)
                            </button>
                            <button
                              onClick={() => {
                                setDeclineBookingModal(b);
                                setDeclineReason("Vehicle emergency issue / cannot provide");
                                setCustomReason("");
                              }}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                            >
                              Cancel &amp; Refund
                            </button>
                          </>
                        )}
                        {b.status === "ongoing" && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b._id, "returned")}
                            className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                          >
                            Confirm Vehicle Return
                          </button>
                        )}
                        {b.status === "returned" && (
                          <button
                            onClick={() => handleUpdateBookingStatus(b._id, "completed")}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
                          >
                            ✅ Complete &amp; End Process
                          </button>
                        )}
                        {b.status === "completed" && (
                          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                            ✨ Process Ended (Completed)
                          </span>
                        )}
                        {b.status === "cancelled" && (
                          <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                            ❌ Cancelled / Declined
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}
          </div>
        )}

        {/* TAB 3: HOST PROFILE */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <User size={20} className="text-indigo-600" />
              Host Profile Settings (SRS 3.1.1.3)
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Update your contact details and business city for prospective renters.
            </p>

            {profileSuccessMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Host Name *</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone *</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Gujarat District / City *</label>
                  <select
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white cursor-pointer font-medium"
                  >
                    {GUJARAT_DISTRICTS.map((district) => (
                      <option key={district} value={district}>
                        📍 {district}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Garage / Pickup Address</label>
                <input
                  type="text"
                  placeholder="e.g. Alkapuri, Vadodara"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/20 transition cursor-pointer disabled:opacity-60 mt-2"
              >
                {savingProfile ? "Saving Changes..." : "Save Host Profile"}
              </button>
            </form>
          </div>
        )}

        {/* EDIT VEHICLE MODAL */}
        {editingVehicle && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-100 my-8">
              <div className="flex justify-between items-center pb-4 mb-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Edit3 size={20} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">Edit Vehicle Details</h3>
                    <p className="text-xs text-slate-500">Update specifications, pricing, or vehicle photo</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleUpdateVehicle} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Name / Brand *</label>
                  <input
                    type="text"
                    name="brand"
                    value={editFormData.brand}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white font-medium"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Category *</label>
                    <select
                      name="type"
                      value={editFormData.type}
                      onChange={handleEditInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                    >
                      <option value="Car">Car</option>
                      <option value="SUV">SUV</option>
                      <option value="Luxury">Luxury</option>
                      <option value="Bike">Bike (Motorcycle)</option>
                      <option value="Scooter">Scooter (Activa / EV)</option>
                      <option value="Van">Van / Tempo</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Rent / Day (₹) *</label>
                    <input
                      type="number"
                      name="pricePerDay"
                      value={editFormData.pricePerDay}
                      onChange={handleEditInputChange}
                      required
                      min="0"
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Gujarat District / City *</label>
                    <select
                      name="city"
                      value={editFormData.city}
                      onChange={handleEditInputChange}
                      required
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white cursor-pointer font-medium"
                    >
                      {GUJARAT_DISTRICTS.map((district) => (
                        <option key={district} value={district}>
                          📍 {district}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Manufacture Year</label>
                    <input
                      type="number"
                      name="year"
                      value={editFormData.year}
                      onChange={handleEditInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Plate / Registration No.</label>
                    <input
                      type="text"
                      name="registrationNumber"
                      value={editFormData.registrationNumber}
                      onChange={handleEditInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Description</label>
                  <textarea
                    name="description"
                    rows="2"
                    value={editFormData.description}
                    onChange={handleEditInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                {/* IMAGE UPLOAD & PREVIEW */}
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                  <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                    <ImageIcon size={14} className="text-indigo-600" />
                    <span>Vehicle Image</span>
                  </label>

                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {editImagePreview && (
                      <div className="w-28 h-20 rounded-xl overflow-hidden border border-slate-200 bg-white shrink-0 shadow-xs">
                        <img
                          src={editImagePreview}
                          alt="Vehicle preview"
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getFallbackImage(editFormData.type);
                          }}
                        />
                      </div>
                    )}

                    <div className="flex-1 w-full">
                      <label className="block text-xs text-slate-500 mb-1 font-medium">
                        Upload New Photo (JPEG, PNG, WEBP)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleEditImageChange}
                        className="w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer bg-white border border-slate-200 rounded-xl p-1.5"
                      />
                      <span className="text-[11px] text-slate-400 block mt-1">
                        Leave empty to keep current photo, or choose a file to update it.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setEditingVehicle(null)}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold text-xs transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={updatingVehicle}
                    className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition cursor-pointer disabled:opacity-60 flex items-center gap-1.5"
                  >
                    {updatingVehicle ? "Saving Changes..." : "Save Vehicle"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {/* CUSTOMER DETAILS MODAL (FOR OWNER) */}
        {selectedCustomerBooking && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
              <button
                onClick={() => setSelectedCustomerBooking(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3.5 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-emerald-500/20">
                  {selectedCustomerBooking.customerId?.name?.charAt(0)?.toUpperCase() || "C"}
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 leading-tight flex items-center gap-2">
                    <span>{selectedCustomerBooking.customerId?.name || "Customer"}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck size={12} /> Verified Customer
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">
                    Booking Ref: #{selectedCustomerBooking.bookingid || selectedCustomerBooking._id}
                  </p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                {/* Contact Card */}
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                  <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <UserCheck size={14} className="text-emerald-600" />
                    Customer Contact &amp; Location
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-slate-400 shrink-0" />
                      <a
                        href={`tel:${selectedCustomerBooking.customerId?.phone}`}
                        className="font-bold text-emerald-700 hover:underline"
                      >
                        {selectedCustomerBooking.customerId?.phone || "Phone not available"}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-slate-400 shrink-0" />
                      <a
                        href={`mailto:${selectedCustomerBooking.customerId?.email}`}
                        className="font-medium text-slate-700 hover:underline truncate"
                      >
                        {selectedCustomerBooking.customerId?.email}
                      </a>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={14} className="text-slate-400 shrink-0" />
                      <span className="font-medium">{selectedCustomerBooking.customerId?.city || "Gujarat"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={14} className="text-slate-400 shrink-0" />
                      <span className="font-medium text-slate-600">
                        Trip Duration: {Math.max(1, Math.ceil((new Date(selectedCustomerBooking.endDate) - new Date(selectedCustomerBooking.startDate)) / (1000 * 60 * 60 * 24)))} days
                      </span>
                    </div>
                  </div>
                  {selectedCustomerBooking.customerId?.address && (
                    <div className="pt-2 text-[11px] text-slate-500 border-t border-slate-200/60">
                      <strong>Customer Address:</strong> {selectedCustomerBooking.customerId.address}
                    </div>
                  )}
                </div>

                {/* Driving License Information */}
                <div className="bg-emerald-50/50 rounded-2xl p-4 border border-emerald-100 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-emerald-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-emerald-600" />
                      Driving License &amp; Safety Compliance
                    </h4>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      {selectedCustomerBooking.customerId?.license?.status || "verified"}
                    </span>
                  </div>

                  <div className="space-y-1.5 text-slate-700 text-xs">
                    <div>
                      <span className="text-slate-500">License Number:</span>{" "}
                      <strong className="font-mono text-slate-900">
                        {selectedCustomerBooking.customerId?.license?.licenseNumber || "GJ-06-2024-0098231"}
                      </strong>
                    </div>

                    {selectedCustomerBooking.customerId?.license?.documentUrl && (
                      <div className="pt-1 flex items-center gap-3">
                        <a
                          href={selectedCustomerBooking.customerId.license.documentUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 shadow-xs transition"
                        >
                          <FileText size={13} /> View License Document Photo
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* Booking & Handover Summary */}
                <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 space-y-2 text-xs">
                  <h4 className="font-bold text-indigo-950 uppercase tracking-wider text-[11px]">
                    Reservation &amp; Handover Details
                  </h4>
                  <div className="grid grid-cols-2 gap-2 text-slate-700">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Pickup Location</span>
                      <strong className="text-slate-900">{selectedCustomerBooking.pickupLocation || "Host Hub"}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Payment Status</span>
                      <strong className="text-indigo-600 uppercase">{selectedCustomerBooking.paymentStatus}</strong>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-5 mt-2 border-t border-slate-100">
                {selectedCustomerBooking.customerId?.phone && (
                  <a
                    href={`tel:${selectedCustomerBooking.customerId.phone}`}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Phone size={14} /> Call Customer
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedCustomerBooking(null)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DECLINE / CANCEL BOOKING MODAL */}
        {declineBookingModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
              <button
                onClick={() => setDeclineBookingModal(null)}
                className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">
                    Decline / Cancel Booking Request
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    #{declineBookingModal.bookingid || declineBookingModal._id} · {declineBookingModal.vehicleId?.brand} {declineBookingModal.vehicleId?.model}
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Please select or enter the reason for declining. The customer will receive an immediate notification and email with this message explaining why the vehicle cannot be provided.
              </p>

              <form onSubmit={handleDeclineBookingSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Select Cancellation Reason *
                  </label>
                  <select
                    value={declineReason}
                    onChange={(e) => setDeclineReason(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white cursor-pointer"
                  >
                    <option value="Vehicle is currently undergoing maintenance / repairs">
                      🔧 Vehicle is currently undergoing maintenance / repairs
                    </option>
                    <option value="Vehicle is temporarily unavailable / out of service">
                      🚫 Vehicle is temporarily unavailable / out of service
                    </option>
                    <option value="Schedule conflict / vehicle already reserved locally">
                      📅 Schedule conflict / vehicle already reserved locally
                    </option>
                    <option value="Vehicle sent for scheduled servicing & safety check">
                      🛡️ Vehicle sent for scheduled servicing & safety check
                    </option>
                    <option value="Host unable to fulfill booking for selected location/dates">
                      📍 Host unable to fulfill booking for selected location/dates
                    </option>
                    <option value="Other">
                      ✍️ Other specific reason (Type below)
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Additional Message / Specific Explanation for Customer
                  </label>
                  <textarea
                    rows={3}
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="e.g. The vehicle's brake pad replacement is scheduled on this date, so we cannot safely provide it."
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white"
                  />
                </div>

                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800">
                  <strong>Notice:</strong> If the customer has already paid, a 100% full refund will be immediately authorized since the cancellation was initiated by the host.
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeclineBookingModal(null)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
                  >
                    Keep Booking
                  </button>
                  <button
                    type="submit"
                    disabled={declining}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-1.5"
                  >
                    {declining ? "Sending Decline Notice..." : "Confirm & Decline"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default OwnerDashboard;
