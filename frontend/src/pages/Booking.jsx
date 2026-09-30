import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Calendar, MapPin, CheckCircle2, AlertCircle, ArrowLeft, Clock, ShieldCheck } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";


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

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Loading reservation form...</p>
        </div>
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 max-w-md mx-auto text-center py-20 px-4">
          <AlertCircle size={48} className="text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">{error || "Vehicle not found"}</h2>
          <Link to="/vehicles" className="text-blue-600 hover:underline font-semibold text-sm">
            &larr; Back to vehicle catalog
          </Link>
        </div>
      </div>
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
      setError("Only customers can book vehicles. Please log in with a customer account.");
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
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-xl mx-auto w-full px-4 py-12">
          <div className="bg-white border border-emerald-200 rounded-3xl p-8 sm:p-10 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={36} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Booking Confirmed!</h1>
            <p className="text-slate-600 text-sm">
              Your reservation for <strong>{vehicle.brand} {vehicle.model}</strong> has been received.
            </p>

            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 my-6 text-left space-y-2.5 text-xs sm:text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">Booking ID</span>
                <span className="font-mono font-bold text-slate-900">{successBooking.bookingid}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Rental Period</span>
                <span className="font-semibold text-slate-900">{startDate} to {endDate} ({days} days)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Pickup Location</span>
                <span className="font-semibold text-slate-900">{pickupLocation}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-base">
                <span className="font-bold text-slate-900">Total Price</span>
                <span className="font-black text-blue-600">₹{total}</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/customer/dashboard"
                className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
              >
                View in Dashboard
              </Link>
              <Link
                to="/vehicles"
                className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors"
              >
                Browse More Vehicles
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
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={14} />
          <span>Back to Vehicle Details</span>
        </Link>

        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-6">
          Complete Your Rental Booking
        </h1>

        {error && (
          <div className="flex items-center gap-3 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-6">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Reservation Form */}
          <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Reservation Details</h2>

            {!isAuthenticated && (
              <div className="bg-blue-50 border border-blue-200 text-blue-800 p-3.5 rounded-xl text-xs leading-relaxed mb-5">
                ℹ️ Please log in with a customer account to finalize this booking.
              </div>
            )}

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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
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
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pickup Location *</label>
                <input
                  type="text"
                  placeholder="e.g. Airport, Railway Station, or City Center"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Return Location (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Same as pickup"
                  value={returnLocation}
                  onChange={(e) => setReturnLocation(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer disabled:opacity-60 mt-4"
              >
                {submitting ? "Confirming Reservation..." : `Confirm Booking • ₹${total}`}
              </button>
            </form>
          </div>

          {/* Summary Sidebar */}
          <aside className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-bold text-slate-900">Summary</h2>

            <div className="rounded-xl overflow-hidden h-36 bg-slate-100">
              <img
                src={vehicle.imageUrl || vehicle.image || "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80"}
                alt={`${vehicle.brand} ${vehicle.model}`}
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <h3 className="font-bold text-slate-900">{vehicle.brand} {vehicle.model}</h3>
              <p className="text-xs text-slate-500">{vehicle.type} · {vehicle.city || "Gujarat"}</p>
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
                <span className="font-bold text-emerald-600">Included (Free)</span>
              </div>
            </div>

            <div className="border-t border-slate-100 pt-3 flex justify-between items-baseline">
              <span className="text-xs font-bold text-slate-700">Total Price</span>
              <span className="text-2xl font-black text-blue-600">₹{total}</span>
            </div>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default Booking;

