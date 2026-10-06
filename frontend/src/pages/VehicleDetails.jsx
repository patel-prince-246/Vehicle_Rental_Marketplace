import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { MapPin, ShieldCheck, User, Calendar, AlertCircle, ArrowLeft, Star, Check, Building2, Edit3, Car } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import StatusBadge from "../components/common/StatusBadge";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";


function VehicleDetails() {
  const { user } = useAuth();
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingReviews, setLoadingReviews] = useState(true);
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

    const fetchReviews = async () => {
      try {
        setLoadingReviews(true);
        const res = await api.get(`/reviews/vehicle/${id}`);
        if (res.data?.success && res.data.reviews) {
          setReviews(res.data.reviews);
        }
      } catch (err) {
        console.warn("Could not load reviews for vehicle:", err.message);
      } finally {
        setLoadingReviews(false);
      }
    };

    if (id) {
      fetchVehicle();
      fetchReviews();
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

  // Calculate rating stats
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0) / totalReviews).toFixed(1)
    : (vehicle.averageRating ? Number(vehicle.averageRating).toFixed(1) : "5.0");

  const ratingCounts = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  reviews.forEach((r) => {
    const star = Math.round(r.rating || 5);
    if (ratingCounts[star] !== undefined) ratingCounts[star]++;
  });
  
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

  const image = getImageUrl(vehicle.imageUrl || vehicle.image, vehicle.type);
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
                <img
                  src={image}
                  alt={vehicleName}
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = getFallbackImage(vehicle.type);
                  }}
                  className="w-full h-full object-cover"
                />
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
                    <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={15} className="text-slate-400" />
                        <span>{vehicle.city || "Gujarat"}</span>
                      </span>
                      <span>·</span>
                      <span>{vehicle.type}</span>
                      <span>·</span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs">
                        <Star size={13} className="fill-amber-400 text-amber-400" />
                        <span>{avgRating}</span>
                        <span className="text-slate-400 font-normal">({totalReviews} reviews)</span>
                      </span>
                    </div>
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

                <hr className="border-slate-100" />

                {/* CUSTOMER REVIEWS & RATINGS SECTION */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                        <span>Customer Reviews &amp; Ratings</span>
                        <span className="text-xs font-bold px-2.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-full">
                          {totalReviews} Verified {totalReviews === 1 ? "Review" : "Reviews"}
                        </span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Authentic feedback from verified customers who completed trips with this vehicle.
                      </p>
                    </div>

                    <div className="hidden sm:flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-2xl border border-amber-200/80">
                      <Star size={20} className="fill-amber-400 text-amber-400" />
                      <div>
                        <span className="text-lg font-black text-slate-900">{avgRating}</span>
                        <span className="text-xs text-slate-500 font-medium"> / 5.0</span>
                      </div>
                    </div>
                  </div>

                  {/* Summary Breakdown Card */}
                  {totalReviews > 0 && (
                    <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
                      <div className="text-center sm:text-left sm:border-r border-slate-200 sm:pr-4">
                        <div className="flex items-center justify-center sm:justify-start gap-1.5 text-3xl font-black text-slate-900">
                          <span>{avgRating}</span>
                          <Star size={24} className="fill-amber-400 text-amber-400" />
                        </div>
                        <div className="flex items-center justify-center sm:justify-start gap-1 mt-1 text-amber-400">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              size={14}
                              className={s <= Math.round(Number(avgRating)) ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                            />
                          ))}
                        </div>
                        <p className="text-[11px] text-slate-500 font-medium mt-1">Based on {totalReviews} renter reviews</p>
                      </div>

                      {/* Stars Bar breakdown */}
                      <div className="sm:col-span-2 space-y-1.5 text-xs">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = ratingCounts[star] || 0;
                          const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : 0;
                          return (
                            <div key={star} className="flex items-center gap-2">
                              <span className="w-6 font-bold text-slate-600 shrink-0 text-right">{star}★</span>
                              <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
                                <div
                                  className="bg-amber-400 h-full rounded-full transition-all duration-500"
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-10 text-[11px] text-slate-400 text-right shrink-0">{count} ({pct}%)</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  {loadingReviews ? (
                    <div className="py-12 text-center">
                      <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <p className="text-xs text-slate-500">Loading reviews...</p>
                    </div>
                  ) : reviews.length === 0 ? (
                    <div className="bg-slate-50 rounded-2xl p-8 text-center border border-slate-200/80">
                      <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-500 flex items-center justify-center mx-auto mb-3">
                        <Star size={24} />
                      </div>
                      <h3 className="font-bold text-sm text-slate-800">No Customer Reviews Yet</h3>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                        This vehicle is ready for booking! Complete your trip to be the first customer to leave a verified review.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {reviews.map((rev) => {
                        const custName = rev.customerId?.name || "Verified Customer";
                        const custInitial = custName.charAt(0).toUpperCase();
                        const revDate = rev.createdAt
                          ? new Date(rev.createdAt).toLocaleDateString(undefined, {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })
                          : "Recent Trip";

                        return (
                          <div
                            key={rev._id}
                            className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-slate-300 transition"
                          >
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                                  {custInitial}
                                </div>
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-sm text-slate-900">{custName}</h4>
                                    <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                      <Check size={11} /> Verified Renter
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-slate-400 mt-0.5">
                                    {rev.customerId?.city ? `📍 ${rev.customerId.city} · ` : ""}
                                    Reviewed on {revDate}
                                  </p>
                                </div>
                              </div>

                              {/* Star Rating Badge */}
                              <div className="flex items-center gap-1 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 shrink-0">
                                <Star size={13} className="fill-amber-400 text-amber-400" />
                                <span className="text-xs font-black text-amber-900">{rev.rating}.0</span>
                              </div>
                            </div>

                            {/* Comment */}
                            <p className="text-xs text-slate-700 leading-relaxed font-normal bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                              "{rev.comment || "Great vehicle in pristine condition. Host was very professional and accommodating throughout the entire rental experience!"}"
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

            {user?.role === "agency" ? (
              <Link
                to="/agency/dashboard?tab=vehicles"
                className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 transition-all text-center gap-2"
              >
                <Building2 size={18} /> Manage Fleet in Agency Portal
              </Link>
            ) : user?.role === "owner" ? (
              <Link
                to="/owner/dashboard?tab=vehicles"
                className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-500/25 transition-all text-center gap-2"
              >
                <Car size={18} /> Manage Fleet in Host Portal
              </Link>
            ) : (
              <Link
                to={`/booking/${vehicle._id}`}
                className="w-full inline-flex items-center justify-center py-3.5 px-6 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-500/25 transition-all text-center"
              >
                Proceed to Booking
              </Link>
            )}

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