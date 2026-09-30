import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, ShieldCheck, User, Calendar, AlertCircle, ArrowLeft, Star, Check } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import StatusBadge from "../components/common/StatusBadge";
import api from "../services/api";


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
          err.response?.data?.message || "Unable to load vehicle details. Please try again."
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
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center py-24">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-slate-600 font-medium">Loading vehicle details...</p>
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
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Vehicle Not Found</h1>
          <p className="text-slate-600 text-sm mb-6">{error || "The vehicle you requested does not exist or is unavailable."}</p>
          <Link
            to="/vehicles"
            className="inline-flex items-center justify-center px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors"
          >
            Browse All Vehicles
          </Link>
        </div>
      </div>
    );
  }

  const vehicleName = `${vehicle.brand} ${vehicle.model}`;
  const price = vehicle.pricePerDay ?? vehicle.price ?? 0;
  const image =
    vehicle.imageUrl ||
    vehicle.image ||
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80";
  const ownerName = vehicle.owner?.name || vehicle.owner?.agencyName || "Prince (Verified Host)";

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-8 py-8">
        <Link
          to="/vehicles"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft size={14} />
          <span>Back to Vehicles Catalog</span>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-200/90 overflow-hidden shadow-xs">
              <div className="h-80 sm:h-96 w-full bg-slate-900 relative">
                <img src={image} alt={vehicleName} className="w-full h-full object-cover" />
                <span className="absolute top-4 left-4 px-3 py-1 rounded-full text-xs font-bold uppercase bg-white/95 backdrop-blur text-slate-900 shadow-sm">
                  {vehicle.type}
                </span>
              </div>

              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                      {vehicleName}
                    </h1>
                    <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-1.5">
                      <MapPin size={16} className="text-slate-400" />
                      <span>{vehicle.city || "Gujarat"}</span>
                      <span>·</span>
                      <span>{vehicle.type}</span>
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full text-xs font-bold text-emerald-700">
                    <ShieldCheck size={16} />
                    <span>Verified Listing</span>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Specs Grid */}
                <div>
                  <h2 className="text-base font-bold text-slate-900 mb-4">Vehicle Specifications</h2>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                      <span className="block text-xs text-slate-500 font-medium">Category</span>
                      <strong className="text-sm text-slate-900 mt-0.5 block">{vehicle.type}</strong>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                      <span className="block text-xs text-slate-500 font-medium">Model Year</span>
                      <strong className="text-sm text-slate-900 mt-0.5 block">{vehicle.year || "2024"}</strong>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                      <span className="block text-xs text-slate-500 font-medium">Location</span>
                      <strong className="text-sm text-slate-900 mt-0.5 block">{vehicle.city || "Vadodara"}</strong>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/70">
                      <span className="block text-xs text-slate-500 font-medium">Availability</span>
                      <strong className={`text-sm mt-0.5 block capitalize ${vehicle.status === "available" ? "text-emerald-600" : "text-amber-600"}`}>
                        {vehicle.status}
                      </strong>
                    </div>
                  </div>
                </div>

                <hr className="border-slate-100" />

                {/* Description */}
                <div>
                  <h2 className="text-base font-bold text-slate-900 mb-2">About this vehicle</h2>
                  <p className="text-slate-600 text-sm leading-relaxed">
                    {vehicle.description ||
                      "Clean, sanitized, and serviced on schedule. Great fuel economy and optimal driving comfort for both city commutes and long road trips."}
                  </p>
                </div>

                <hr className="border-slate-100" />

                {/* Host */}
                <div>
                  <h2 className="text-base font-bold text-slate-900 mb-3">Vehicle Host / Provider</h2>
                  <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80">
                    <div className="w-11 h-11 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                      <User size={22} />
                    </div>
                    <div>
                      <strong className="text-sm text-slate-900 block">{ownerName}</strong>
                      <p className="text-xs text-slate-500">Verified Marketplace Partner · Top Rated</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Booking Card Sidebar */}
          <aside className="sticky top-20 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/90 shadow-sm space-y-6">
            <div>
              <span className="text-xs text-slate-500 uppercase font-bold tracking-wider">Rental Rate</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-3xl font-black text-blue-600">₹{price}</span>
                <span className="text-sm text-slate-500">/ day</span>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 border-y border-slate-100 py-4">
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600 shrink-0" />
                <span>Zero deposit on standard rentals</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600 shrink-0" />
                <span>Free cancellation up to 24 hours before</span>
              </div>
              <div className="flex items-center gap-2">
                <Check size={16} className="text-emerald-600 shrink-0" />
                <span>24/7 Roadside assistance included</span>
              </div>
            </div>

            <Link
              to={`/booking/${vehicle._id}`}
              className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all text-center"
            >
              Proceed to Booking
            </Link>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              Instant confirmation will be sent to your registered email address upon reservation.
            </p>
          </aside>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default VehicleDetails;