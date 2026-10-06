import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Calendar,
  MapPin,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  FileText,
  UploadCloud,
  HelpCircle,
  Info,
  Clock,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, refreshProfile } = useAuth();

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successBooking, setSuccessBooking] = useState(null);

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [returnLocation, setReturnLocation] = useState("");

  // License upload inline modal state
  const [showLicenseModal, setShowLicenseModal] = useState(false);
  const [licenseNumber, setLicenseNumber] = useState("");
  const [licenseFile, setLicenseFile] = useState(null);
  const [uploadingLicense, setUploadingLicense] = useState(false);
  const [licenseMessage, setLicenseMessage] = useState("");

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/vehicles/${id}`);
        if (res.data?.success && res.data.vehicle) {
          setVehicle(res.data.vehicle);
          setPickupLocation(res.data.vehicle.city || "Vadodara");
          setReturnLocation(res.data.vehicle.city || "Vadodara");
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

  const pricePerDay = vehicle?.pricePerDay ?? vehicle?.price ?? 0;
  const days =
    startDate && endDate
      ? Math.max(
          1,
          Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24))
        )
      : 0;

  const total = days * pricePerDay;

  const isLicenseVerified = user?.license?.status === "verified";
  const isLicenseUploaded = user?.license?.status === "uploaded";
  const isLicenseRejected = user?.license?.status === "rejected";
  const isLicenseMissing = !user?.license || user?.license?.status === "not_uploaded";

  const handleUploadLicense = async (e) => {
    e.preventDefault();
    if (!licenseNumber && !licenseFile) {
      setLicenseMessage("Please enter your license number or upload a document photo.");
      return;
    }
    setUploadingLicense(true);
    setLicenseMessage("");
    try {
      const formData = new FormData();
      if (licenseNumber) formData.append("licenseNumber", licenseNumber);
      if (licenseFile) formData.append("file", licenseFile);

      await api.post("/users/license", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (refreshProfile) {
        await refreshProfile();
      }
      setShowLicenseModal(false);
      setLicenseMessage("");
      alert("License uploaded successfully! Once verified by the administrator, you can confirm this booking.");
    } catch (uErr) {
      console.error("License upload error:", uErr);
      setLicenseMessage(uErr.response?.data?.message || "Failed to upload license.");
    } finally {
      setUploadingLicense(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!isAuthenticated) {
      navigate("/login", { state: { from: `/booking/${id}` } });
      return;
    }

    if (user?.role !== "customer") {
      setError("Only customers can book vehicles. Please log in with a customer account.");
      return;
    }

    if (isLicenseMissing) {
      setShowLicenseModal(true);
      return;
    }

    if (isLicenseRejected) {
      setError("Your driving license was rejected. Please re-upload a valid license document.");
      setShowLicenseModal(true);
      return;
    }

    if (isLicenseUploaded && !isLicenseVerified) {
      setError("Your driving license is currently awaiting admin verification. Booking will unlock once approved.");
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
      if (err.response?.data?.requiresLicense) {
        setShowLicenseModal(true);
      }
      setError(err.response?.data?.message || err.message || "Failed to create booking.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Loading reservation form...</p>
        </div>
      </div>
    );
  }

  if (error && !vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto text-center py-20 px-4">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{error || "Vehicle not found"}</h2>
          <Link to="/vehicles" className="text-indigo-600 hover:underline font-semibold text-sm">
            &larr; Back to vehicle catalog
          </Link>
        </div>
      </div>
    );
  }

  if (successBooking) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12">
          <div className="bg-white border border-indigo-200 rounded-3xl p-8 sm:p-10 shadow-lg shadow-indigo-500/5 text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 mb-1">
              Booking Request Sent to Host!
            </h1>
            <p className="text-slate-600 text-sm">
              Your request for <strong>{vehicle.brand} {vehicle.model}</strong> has been transmitted. The host has been notified to review and confirm.
            </p>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 my-4 text-left text-xs text-amber-900 flex items-start gap-2.5">
              <Clock size={18} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong>Next Step: Host Approval & Payment</strong>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Once the host confirms your dates, you will receive an instant notification to complete your payment (via UPI, Card, Net Banking, or Cash on Handover).
                </p>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 my-5 text-left space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking Reference</span>
                <span className="font-mono font-bold text-indigo-600">{successBooking.bookingid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rental Dates</span>
                <span className="font-semibold text-slate-900">{startDate} to {endDate} ({days} {days === 1 ? "day" : "days"})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pickup Location</span>
                <span className="font-semibold text-slate-900">{pickupLocation}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                <span className="font-bold text-slate-900">Total Price Due Upon Approval</span>
                <span className="font-black text-indigo-600">₹{total}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/customer/dashboard?tab=bookings"
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-sm hover:opacity-95 shadow-md shadow-indigo-500/20 transition-all"
              >
                Go to My Reservations
              </Link>
              <Link
                to="/vehicles"
                className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Browse More Fleet
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-8 py-8">
        <Link
          to={`/vehicles/${vehicle._id}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700 mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          <span>Back to Vehicle Details</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-6">
          Complete Your Rental Booking
        </h1>

        {/* License verification gate banners */}
        {isAuthenticated && isLicenseMissing && (
          <div className="flex items-start justify-between gap-4 bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl text-xs sm:text-sm mb-6 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-950">Driving License Upload Required (SRS 3.1.3.6)</p>
                <p className="text-amber-800 text-xs mt-0.5">
                  Before confirming your booking, you must upload a valid driving license for administrative verification.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLicenseModal(true)}
              className="shrink-0 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Upload License Now
            </button>
          </div>
        )}

        {isAuthenticated && isLicenseUploaded && !isLicenseVerified && (
          <div className="flex items-start justify-between gap-4 bg-blue-50 border border-blue-200 text-blue-900 p-4 rounded-2xl text-xs sm:text-sm mb-6 shadow-xs">
            <div className="flex items-start gap-3">
              <Clock size={20} className="text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-950">License Verification Pending</p>
                <p className="text-blue-800 text-xs mt-0.5">
                  Your driving license has been submitted and is currently awaiting administrator review in the Admin Dashboard. Booking will unlock once approved.
                </p>
              </div>
            </div>
            <span className="shrink-0 px-3 py-1.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-xl border border-blue-200">
              Pending Admin Approval
            </span>
          </div>
        )}

        {isAuthenticated && isLicenseRejected && (
          <div className="flex items-start justify-between gap-4 bg-rose-50 border border-rose-200 text-rose-900 p-4 rounded-2xl text-xs sm:text-sm mb-6 shadow-xs">
            <div className="flex items-start gap-3">
              <AlertCircle size={20} className="text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-rose-950">Driving License Rejected</p>
                <p className="text-rose-800 text-xs mt-0.5">
                  Your submitted driving license was rejected by the administrator. Please re-upload a clear and valid document.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLicenseModal(true)}
              className="shrink-0 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              Re-upload License
            </button>
          </div>
        )}

        {isAuthenticated && isLicenseVerified && (
          <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-2xl text-xs sm:text-sm mb-6 shadow-xs">
            <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-emerald-950">Driving License Verified ✓</span>
              <span className="text-emerald-800 text-xs block mt-0.5">
                Your driving license has been verified by the administrator. You are authorized to book vehicles.
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-2xl text-sm mb-6">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Reservation Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" />
              Reservation Details
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Pickup Date *</label>
                  <input
                    type="date"
                    value={startDate}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Return Date *</label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate || new Date().toISOString().split("T")[0]}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin size={14} className="text-slate-500" />
                  Pickup Location *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Airport, Railway Station, or City Center"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Return Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Same as pickup"
                  value={returnLocation}
                  onChange={(e) => setReturnLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              {/* Two-Stage Approval & Payment Notice */}
              <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-4 text-xs text-indigo-950 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-indigo-900">
                  <ShieldCheck size={16} className="text-indigo-600" />
                  <span>Two-Stage Booking & Payment Flow</span>
                </div>
                <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                  1. <strong>Submit Request:</strong> Your booking details will be sent directly to the host for verification.
                </p>
                <p className="text-slate-600 text-[11px] sm:text-xs leading-relaxed">
                  2. <strong>Pay After Host Approves:</strong> When the host confirms your dates, you will receive an instant notification to pay (UPI, Card, Net Banking, or Cash on Pickup) in your Customer Dashboard.
                </p>
              </div>

              {/* Tiered Cancellation Policy Info Box (SRS 3.1.3.4 & 3.1.4.2) */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs text-slate-800 space-y-1.5">
                <div className="flex items-center gap-1.5 font-bold text-slate-900">
                  <Info size={16} className="text-indigo-600" />
                  <span>Cancellation & Tiered Refund Policy</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-slate-600 text-[11px]">
                  <li><strong>&gt; 24 hrs before trip start:</strong> 100% Full Refund</li>
                  <li><strong>12 to 24 hrs before trip start:</strong> 50% Partial Refund</li>
                  <li><strong>&lt; 12 hrs before trip start:</strong> No refund applicable</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-lg shadow-indigo-500/20 transition-all cursor-pointer disabled:opacity-60 mt-4"
              >
                {submitting ? "Sending Request to Host..." : `Send Booking Request to Host • ₹${total}`}
              </button>
            </form>
          </div>

          {/* Summary Sidebar */}
          <aside className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Summary</h2>

            <div className="rounded-2xl overflow-hidden h-36 bg-slate-100 relative">
              <img
                src={vehicle.imageUrl || vehicle.image || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
                {vehicle.type}
              </div>
            </div>

            <div>
              <h3 className="font-bold text-slate-900">{vehicle.brand} {vehicle.model}</h3>
              <p className="text-xs text-slate-500">{vehicle.city || "Gujarat"}</p>
            </div>

            <div className="border-t border-slate-100 pt-3 space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Daily Rate</span>
                <span className="font-semibold text-slate-900">₹{pricePerDay}</span>
              </div>
              <div className="flex justify-between">
                <span>Rental Duration</span>
                <span className="font-semibold text-slate-900">{days} {days === 1 ? "day" : "days"}</span>
              </div>
              <div className="flex justify-between">
                <span>Insurance & Taxes</span>
                <span className="font-bold text-emerald-600">Included</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-700">Total Price</span>
              <span className="text-2xl font-black text-indigo-600">₹{total}</span>
            </div>
          </aside>
        </div>
      </main>

      {/* License Upload Modal */}
      {showLicenseModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-xl font-black text-slate-900 mb-2 flex items-center gap-2">
              <UploadCloud size={24} className="text-indigo-600" />
              Upload Driving License
            </h3>
            <p className="text-xs text-slate-600 mb-5">
              As per safety regulations and project requirements, you must provide your driving license before booking a vehicle.
            </p>

            {licenseMessage && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs mb-4">
                {licenseMessage}
              </div>
            )}

            <form onSubmit={handleUploadLicense} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  License Number *
                </label>
                <input
                  type="text"
                  placeholder="e.g. GJ-06-20230012345"
                  value={licenseNumber}
                  onChange={(e) => setLicenseNumber(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Upload Document Photo / PDF
                </label>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setLicenseFile(e.target.files[0])}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLicenseModal(false)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadingLicense}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition-colors disabled:opacity-60"
                >
                  {uploadingLicense ? "Uploading..." : "Save & Proceed"}
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

export default Booking;
