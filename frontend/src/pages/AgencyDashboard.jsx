import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Trash2,
  Car,
  ShieldCheck,
  MapPin,
  Building2,
  Edit3,
  Calendar,
  Clock,
  CheckCircle2,
  PowerOff,
  Power,
  User,
  Eye,
  UserCheck,
  Mail,
  Phone,
  X,
  Upload,
  FileText,
  AlertCircle,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import StatusBadge from "../components/common/StatusBadge";
import StatCard from "../components/common/StatCard";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { GUJARAT_DISTRICTS } from "../constants/locations";

function AgencyDashboard() {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && ["vehicles", "bookings", "profile"].includes(tabFromUrl)
      ? tabFromUrl
      : "vehicles"
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["vehicles", "bookings", "profile"].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Fleet state
  const [vehicles, setVehicles] = useState([]);
  const [agencyProfile, setAgencyProfile] = useState(null);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Add Vehicle Form State
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
  const [addImageFile, setAddImageFile] = useState(null);

  // Edit Vehicle Modal State
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [editFormData, setEditFormData] = useState({
    brand: "",
    model: "",
    type: "Car",
    pricePerDay: "",
    city: "",
    year: "2024",
    registrationNumber: "",
    imageUrl: "",
    description: "",
  });
  const [editImageFile, setEditImageFile] = useState(null);
  const [editImagePreview, setEditImagePreview] = useState("");
  const [submittingEdit, setSubmittingEdit] = useState(false);

  // Incoming Bookings State
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [selectedCustomerBooking, setSelectedCustomerBooking] = useState(null);

  // Profile Edit State
  const [profileName, setProfileName] = useState("");
  const [profilePhone, setProfilePhone] = useState("");
  const [profileCity, setProfileCity] = useState("");
  const [profileAddress, setProfileAddress] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

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

  const fetchFleetAndProfile = async () => {
    try {
      setLoadingVehicles(true);
      const [vehRes, profRes] = await Promise.allSettled([
        api.get("/vehicles/my"),
        api.get("/agencies/profile"),
      ]);

      if (vehRes.status === "fulfilled" && vehRes.value.data?.success) {
        setVehicles(vehRes.value.data.vehicles || []);
      }

      if (profRes.status === "fulfilled" && profRes.value.data?.success) {
        const agency = profRes.value.data.agency;
        setAgencyProfile(agency);
        if (agency) {
          setProfileName(agency.agencyName || user?.name || "");
          setProfilePhone(agency.phone || user?.phone || "");
          setProfileCity(agency.city || user?.city || "");
          setProfileAddress(agency.address || user?.address || "");
        }
      }
    } catch (err) {
      console.error("Error loading agency fleet data:", err);
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
      console.error("Error loading agency bookings:", err);
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    fetchFleetAndProfile();
    fetchIncomingBookings();
  }, []);

  // Handle Add Form Input
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // CREATE VEHICLE (Agency Only)
  const handleAddVehicle = async (e) => {
    e.preventDefault();

    if (!formData.brand || !formData.pricePerDay || !formData.city) {
      alert("Please fill all required fields.");
      return;
    }

    setSubmittingAdd(true);
    try {
      const data = new FormData();
      data.append("vehicleid", formData.vehicleid || "AGC-" + Date.now().toString().slice(-6));
      data.append("brand", formData.brand);
      data.append("model", formData.model || "");
      data.append("type", formData.type);
      data.append("pricePerDay", Number(formData.pricePerDay));
      data.append("city", formData.city);
      data.append("year", Number(formData.year || 2024));
      if (formData.registrationNumber) data.append("registrationNumber", formData.registrationNumber);
      if (formData.description) data.append("description", formData.description);

      if (addImageFile) {
        data.append("image", addImageFile);
      } else if (formData.imageUrl && formData.imageUrl.trim()) {
        data.append("imageUrl", formData.imageUrl.trim());
      } else {
        data.append("imageUrl", getFallbackImage(formData.type));
      }

      const res = await api.post("/vehicles", data);
      if (res.data?.success) {
        alert("Vehicle successfully added to your Agency fleet!");
        setShowAddForm(false);
        setAddImageFile(null);
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
        fetchFleetAndProfile();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to add vehicle.");
    } finally {
      setSubmittingAdd(false);
    }
  };

  // OPEN EDIT VEHICLE MODAL (Agency Only)
  const handleOpenEditModal = (vehicle) => {
    setEditingVehicle(vehicle);
    setEditFormData({
      brand: vehicle.brand || "",
      model: vehicle.model || "",
      type: vehicle.type || "Car",
      pricePerDay: vehicle.pricePerDay ?? vehicle.price ?? "",
      city: vehicle.city || "",
      year: vehicle.year || "2024",
      registrationNumber: vehicle.registrationNumber || "",
      imageUrl: vehicle.imageUrl || "",
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

  // UPDATE VEHICLE (Agency Only)
  const handleUpdateVehicle = async (e) => {
    e.preventDefault();
    if (!editingVehicle) return;

    if (!editFormData.brand || !editFormData.pricePerDay || !editFormData.city) {
      alert("Please fill all required fields.");
      return;
    }

    setSubmittingEdit(true);
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
      } else if (editFormData.imageUrl) {
        data.append("imageUrl", editFormData.imageUrl);
      }

      const res = await api.put(`/vehicles/${editingVehicle._id}`, data);
      if (res.data?.success) {
        alert("Vehicle updated successfully!");
        setEditingVehicle(null);
        setEditImageFile(null);
        setEditImagePreview("");
        fetchFleetAndProfile();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update vehicle.");
    } finally {
      setSubmittingEdit(false);
    }
  };

  // REMOVE / DEACTIVATE VEHICLE (Agency Only)
  const handleDeleteVehicle = async (vehicle) => {
    const isInactive = vehicle.status === "inactive";
    const confirmMsg = isInactive
      ? `Reactivate ${vehicle.brand} ${vehicle.model} and make it available for rental?`
      : `Are you sure you want to remove/deactivate ${vehicle.brand} ${vehicle.model}? It will be hidden from customer search.`;

    if (!window.confirm(confirmMsg)) return;

    try {
      if (isInactive) {
        await api.put(`/vehicles/${vehicle._id}`, { status: "available" });
      } else {
        await api.delete(`/vehicles/${vehicle._id}`);
      }
      fetchFleetAndProfile();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove vehicle.");
    }
  };

  // Booking Lifecycle updates
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await api.put(`/bookings/${bookingId}/status`, { status: newStatus });
      if (res.data?.success) {
        alert(`Booking status transitioned to "${newStatus}".`);
        fetchIncomingBookings();
        fetchFleetAndProfile();
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
        fetchFleetAndProfile();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to decline booking.");
    } finally {
      setDeclining(false);
    }
  };

  // Save Agency Profile
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
      setProfileSuccessMsg("Agency profile updated successfully!");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "available":
      case "verified":
      case "confirmed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "booked":
      case "pending":
      case "ongoing":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected":
      case "cancelled":
      case "inactive":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "returned":
      case "completed":
        return "bg-blue-50 text-blue-700 border-blue-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full border border-indigo-200 flex items-center gap-1">
                <Building2 size={13} /> Commercial Agency Fleet Portal
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">
              Agency: {agencyProfile?.agencyName || user?.name || "Enterprise Partner"}
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Authorized portal: Add, edit, remove fleet vehicles and manage customer reservations.
            </p>
          </div>

          {activeTab === "vehicles" && (
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-500/20 transition cursor-pointer"
            >
              {showAddForm ? <X size={16} /> : <Plus size={16} />}
              <span>{showAddForm ? "Close Form" : "+ Add Fleet Vehicle"}</span>
            </button>
          )}
        </div>

        {/* Agency Info Banner */}
        {agencyProfile && (
          <div className="bg-indigo-50/70 border border-indigo-100 rounded-3xl p-4 sm:p-6 mb-8 flex flex-wrap gap-6 items-center">
            <div className="flex items-center gap-2 text-slate-700 text-xs sm:text-sm">
              <Building2 size={18} className="text-indigo-600" />
              <span>
                <strong>Agency:</strong> {agencyProfile.agencyName}
              </span>
            </div>
            {agencyProfile.city && (
              <div className="flex items-center gap-2 text-slate-700 text-xs sm:text-sm">
                <MapPin size={18} className="text-indigo-600" />
                <span>
                  <strong>HQ / City:</strong> {agencyProfile.city}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-slate-700 text-xs sm:text-sm">
              <ShieldCheck size={18} className="text-indigo-600" />
              <span>
                <strong>License:</strong> {agencyProfile.registrationNumber || "Commercial Verified"}
              </span>
            </div>
          </div>
        )}

        {/* Quick Fleet Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard
            label="Total Fleet Size"
            value={vehicles.length}
            icon={Car}
            color="indigo"
          />
          <StatCard
            label="Available for Booking"
            value={vehicles.filter((v) => v.status === "available").length}
            icon={CheckCircle2}
            color="emerald"
          />
          <StatCard
            label="Incoming Reservations"
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
            Fleet Inventory ({vehicles.length})
          </button>
          <button
            onClick={() => setActiveTab("bookings")}
            className={`pb-3 px-4 font-bold text-sm cursor-pointer transition border-b-2 ${
              activeTab === "bookings"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Incoming Reservations ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab("profile")}
            className={`pb-3 px-4 font-bold text-sm cursor-pointer transition border-b-2 ${
              activeTab === "profile"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            Agency Profile &amp; Settings
          </button>
        </div>

        {/* ===================== TAB 1: FLEET VEHICLES ===================== */}
        {activeTab === "vehicles" && (
          <div>
            {/* ADD VEHICLE DRAWER / FORM */}
            {showAddForm && (
              <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-lg mb-8">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Plus size={20} className="text-indigo-600" />
                    Add Vehicle to Agency Fleet
                  </h2>
                  <button
                    onClick={() => setShowAddForm(false)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                <form onSubmit={handleAddVehicle} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Name / Brand *</label>
                    <input
                      type="text"
                      name="brand"
                      placeholder="e.g. Toyota Innova Crysta, Hyundai Creta, Honda City, Royal Enfield"
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
                        <option value="Bike">Bike</option>
                        <option value="Scooter">Scooter</option>
                        <option value="Van">Van / Commercial</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Daily Rental Rate (₹) *</label>
                      <input
                        type="number"
                        name="pricePerDay"
                        placeholder="e.g. 3500"
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
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">Manufacturing Year</label>
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
                        placeholder="e.g. GJ-01-AB-1234"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Upload Vehicle Photo (Device)
                      </label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setAddImageFile(e.target.files[0])}
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Or Image URL (Web Link)
                      </label>
                      <input
                        type="url"
                        name="imageUrl"
                        placeholder="https://images.unsplash.com/..."
                        value={formData.imageUrl}
                        onChange={handleInputChange}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Specifications &amp; Terms</label>
                    <textarea
                      name="description"
                      rows="3"
                      placeholder="Commercial vehicle, insurance included, clean interior, 24x7 roadside assistance..."
                      value={formData.description}
                      onChange={handleInputChange}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-6 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submittingAdd}
                      className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-60 cursor-pointer"
                    >
                      {submittingAdd ? "Adding to Fleet..." : "Add Vehicle to Fleet"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* FLEET GRID */}
            {loadingVehicles ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading agency fleet inventory...</p>
              </div>
            ) : vehicles.length === 0 ? (
              <EmptyState
                icon={Car}
                title="No Fleet Vehicles Added Yet"
                description="Your agency has not added any commercial vehicles yet. Click '+ Add Fleet Vehicle' above to list vehicles for customer booking."
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {vehicles.map((v) => {
                  const isInactive = v.status === "inactive";
                  return (
                    <div
                      key={v._id}
                      className={`bg-white rounded-3xl border ${
                        isInactive ? "border-slate-300 opacity-75" : "border-slate-200"
                      } overflow-hidden shadow-xs hover:shadow-md transition flex flex-col`}
                    >
                      <div className="h-44 bg-slate-100 relative">
                        <img
                          src={getImageUrl(v.imageUrl, v.type)}
                          alt={`${v.brand} ${v.model}`}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getFallbackImage(v.type);
                          }}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 right-3 flex gap-1.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              v.verificationStatus === "verified"
                                ? "bg-emerald-500 text-white"
                                : "bg-amber-500 text-white"
                            }`}
                          >
                            {v.verificationStatus || "pending"}
                          </span>
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              isInactive ? "bg-rose-600 text-white" : "bg-black/60 text-white backdrop-blur-xs"
                            }`}
                          >
                            {v.status}
                          </span>
                        </div>
                      </div>

                      <div className="p-5 flex-1 flex flex-col justify-between">
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h3 className="font-bold text-base text-slate-900">
                              {v.brand} {v.model}
                            </h3>
                            <span className="text-base font-black text-indigo-600 whitespace-nowrap">
                              ₹{v.pricePerDay ?? v.price}/day
                            </span>
                          </div>

                          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                            <MapPin size={13} className="text-slate-400 shrink-0" />
                            <span>{v.city || "Gujarat"}</span>
                            <span>·</span>
                            <span>{v.type}</span>
                            {v.year && <span>· {v.year}</span>}
                          </p>

                          {v.registrationNumber && (
                            <p className="text-[11px] font-mono text-slate-500 bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-md inline-block mb-3">
                              Reg: {v.registrationNumber}
                            </p>
                          )}
                        </div>

                        {/* Agency Action Buttons: Edit & Remove */}
                        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[10px] text-slate-400">
                            ID: #{v.vehicleid || v._id.slice(-6)}
                          </span>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenEditModal(v)}
                              title="Edit Vehicle Details"
                              className="px-3 py-1.5 rounded-xl text-xs font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition flex items-center gap-1 cursor-pointer"
                            >
                              <Edit3 size={13} />
                              <span>Edit</span>
                            </button>

                            <button
                              onClick={() => handleDeleteVehicle(v)}
                              title={isInactive ? "Reactivate Vehicle" : "Remove / Deactivate Vehicle"}
                              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                                isInactive
                                  ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                                  : "bg-rose-50 text-rose-700 hover:bg-rose-100"
                              }`}
                            >
                              {isInactive ? <Power size={13} /> : <Trash2 size={13} />}
                              <span>{isInactive ? "Reactivate" : "Remove"}</span>
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

        {/* ===================== TAB 2: INCOMING RESERVATIONS ===================== */}
        {activeTab === "bookings" && (
          <div>
            {loadingBookings ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading incoming reservations...</p>
              </div>
            ) : bookings.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title="No Incoming Bookings"
                description="No customer has reserved your fleet vehicles yet. Make sure your listings are active and verified."
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
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-[11px] font-bold transition cursor-pointer"
                          >
                            <Eye size={12} /> View Customer Profile
                          </button>
                        </div>

                        <p className="text-xs text-slate-600 mt-1.5 flex items-center gap-1.5 font-medium">
                          <Calendar size={13} className="text-indigo-600" />
                          <span>
                            {new Date(b.startDate).toLocaleDateString()} &rarr; {new Date(b.endDate).toLocaleDateString()}
                          </span>
                        </p>
                      </div>

                      <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 gap-2">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] text-slate-400 block">Total Revenue</span>
                          <span className="text-base font-black text-indigo-600">₹{b.totalAmount}</span>
                        </div>

                        {/* Action buttons for booking lifecycle */}
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => setSelectedCustomerBooking(b)}
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1"
                          >
                            <UserCheck size={13} /> Customer Details
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
                              Confirm Return
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

        {/* ===================== TAB 3: AGENCY PROFILE ===================== */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-2xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <Building2 size={20} className="text-indigo-600" />
              Commercial Agency Settings
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Update your corporate rental company identity, direct contacts, and regional operating address.
            </p>

            {profileSuccessMsg && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600" />
                {profileSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Agency / Company Name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Business Phone</label>
                  <input
                    type="tel"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Operating Gujarat District / HQ *</label>
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
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Commercial Office Address</label>
                <textarea
                  rows="3"
                  value={profileAddress}
                  onChange={(e) => setProfileAddress(e.target.value)}
                  placeholder="e.g. 402, Enterprise Hub, Near Express Highway..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {savingProfile ? "Saving..." : "Save Agency Profile"}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>

      {/* ===================== EDIT VEHICLE MODAL ===================== */}
      {editingVehicle && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-2xl w-full p-6 sm:p-8 my-8 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Edit3 size={20} className="text-indigo-600" />
                Edit Fleet Vehicle ({editingVehicle.brand} {editingVehicle.model})
              </h2>
              <button
                onClick={() => setEditingVehicle(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X size={18} />
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Type *</label>
                  <select
                    name="type"
                    value={editFormData.type}
                    onChange={handleEditInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  >
                    <option value="Car">Car</option>
                    <option value="SUV">SUV</option>
                    <option value="Luxury">Luxury</option>
                    <option value="Bike">Bike</option>
                    <option value="Scooter">Scooter</option>
                    <option value="Van">Van / Commercial</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Rent Per Day (₹) *</label>
                  <input
                    type="number"
                    name="pricePerDay"
                    value={editFormData.pricePerDay}
                    onChange={handleEditInputChange}
                    required
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
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Year of Manufacture</label>
                  <input
                    type="number"
                    name="year"
                    value={editFormData.year}
                    onChange={handleEditInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Registration Number</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={editFormData.registrationNumber}
                    onChange={handleEditInputChange}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Photo Preview & Upload */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Photo</label>
                {editImagePreview && (
                  <div className="mb-2 h-32 w-full rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img
                      src={editImagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleEditImageChange}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Vehicle Specifications &amp; Terms</label>
                <textarea
                  name="description"
                  rows="3"
                  value={editFormData.description}
                  onChange={handleEditInputChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingVehicle(null)}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingEdit}
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-60 cursor-pointer"
                >
                  {submittingEdit ? "Saving Changes..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================== CUSTOMER DETAIL MODAL ===================== */}
      {selectedCustomerBooking && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 relative animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setSelectedCustomerBooking(null)}
              className="absolute top-5 right-5 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <User size={24} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  {selectedCustomerBooking.customerId?.name || "Customer Profile"}
                </h3>
                <span className="text-[11px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                  Reservation #{selectedCustomerBooking.bookingid || selectedCustomerBooking._id}
                </span>
              </div>
            </div>

            <div className="space-y-3.5 py-4 text-xs">
              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                <Mail size={16} className="text-indigo-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Email Address</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCustomerBooking.customerId?.email || "Not Provided"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                <Phone size={16} className="text-indigo-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Phone Number</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCustomerBooking.customerId?.phone || "Not Provided"}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                <MapPin size={16} className="text-indigo-600 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">City / Location</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCustomerBooking.customerId?.city || "Gujarat"}
                  </span>
                </div>
              </div>

              {selectedCustomerBooking.customerId?.address && (
                <div className="flex items-center gap-3 p-2.5 bg-slate-50 rounded-xl">
                  <Building2 size={16} className="text-indigo-600 shrink-0" />
                  <div>
                    <span className="text-slate-400 block text-[10px]">Home / Delivery Address</span>
                    <span className="font-semibold text-slate-800">
                      {selectedCustomerBooking.customerId.address}
                    </span>
                  </div>
                </div>
              )}

              {/* Reserved Vehicle Details */}
              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl">
                <span className="text-[10px] font-bold uppercase text-indigo-700 block mb-1">
                  Reserved Fleet Vehicle
                </span>
                <p className="font-bold text-slate-900 text-sm">
                  {selectedCustomerBooking.vehicleId?.brand} {selectedCustomerBooking.vehicleId?.model}
                </p>
                <div className="flex justify-between text-slate-600 text-[11px] mt-1">
                  <span>
                    Dates: {new Date(selectedCustomerBooking.startDate).toLocaleDateString()} &rarr;{" "}
                    {new Date(selectedCustomerBooking.endDate).toLocaleDateString()}
                  </span>
                  <span className="font-bold text-indigo-700">₹{selectedCustomerBooking.totalAmount}</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCustomerBooking(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl cursor-pointer"
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
                  Decline / Cancel Fleet Reservation
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  #{declineBookingModal.bookingid || declineBookingModal._id} · {declineBookingModal.vehicleId?.brand} {declineBookingModal.vehicleId?.model}
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Please select or enter the reason for declining. The customer will receive an immediate notification and email with this message explaining why the agency cannot provide the vehicle.
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
                    🔧 Fleet vehicle is currently undergoing maintenance / repairs
                  </option>
                  <option value="Vehicle is temporarily unavailable / out of service">
                    🚫 Vehicle is temporarily unavailable / out of service
                  </option>
                  <option value="Schedule conflict / vehicle already reserved by enterprise client">
                    📅 Schedule conflict / vehicle already reserved by enterprise client
                  </option>
                  <option value="Vehicle sent for scheduled servicing & safety inspection">
                    🛡️ Vehicle sent for scheduled servicing & safety inspection
                  </option>
                  <option value="Agency unable to fulfill booking for selected location/dates">
                    📍 Agency unable to fulfill booking for selected location/dates
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
                  placeholder="e.g. This vehicle was flagged for unexpected brake maintenance today, so we are unable to dispatch it."
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-rose-500 focus:bg-white"
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-800">
                <strong>Notice:</strong> If the customer has already paid, a 100% full refund will be immediately processed since the cancellation was initiated by the agency.
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

      <Footer />
    </div>
  );
}

export default AgencyDashboard;
