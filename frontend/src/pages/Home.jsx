import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShieldCheck,
  CalendarCheck,
  CarFront,
  ArrowRight,
  LayoutDashboard,
  Building2,
  Shield,
  User,
  MapPin,
  Car,
  Calendar,
  Plus,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import { useAuth } from "../context/AuthContext";

import { GUJARAT_DISTRICTS } from "../constants/locations";

function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [selectedCity, setSelectedCity] = useState("All");
  const [selectedType, setSelectedType] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");

  const handleHeroSearch = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (selectedCity && selectedCity !== "All") params.set("location", selectedCity);
    if (selectedType && selectedType !== "All") params.set("type", selectedType);
    if (searchQuery.trim()) params.set("search", searchQuery.trim());
    navigate(`/vehicles?${params.toString()}`);
  };

  const getRoleDashboardLink = () => {
    if (!user) return "/register";
    switch (user.role) {
      case "owner":
        return "/owner/dashboard";
      case "agency":
        return "/agency/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/customer/dashboard";
    }
  };

  const getRoleDashboardLabel = () => {
    if (!user) return "List Your Vehicle";
    switch (user.role) {
      case "owner":
        return "Host Fleet Dashboard";
      case "agency":
        return "Agency Fleet Portal";
      case "admin":
        return "Admin Control Panel";
      default:
        return "My Reservations Portal";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 py-16 sm:py-20 px-4 sm:px-8 border-b border-slate-200">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-5 text-center lg:text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-200 text-indigo-700">
                  {user ? `👋 Welcome Back, ${user.name} (${user.role.toUpperCase()})` : "⭐ Trusted Car & Bike Rentals"}
                </span>

                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                  Find Your Perfect <span className="text-indigo-600">Ride in Gujarat</span>
                </h1>

                <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                  Rent cars, bikes, SUVs, and luxury vehicles from verified hosts across Vadodara, Ahmedabad, Surat, Rajkot, Nadiad, and Anand with instant confirmation.
                </p>

                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3.5 pt-1">
                  {user?.role === "agency" ? (
                    <>
                      <Link
                        to="/agency/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
                      >
                        <Building2 size={16} />
                        <span>Agency Fleet Portal</span>
                      </Link>
                      <Link
                        to="/agency/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition-all cursor-pointer text-sm"
                      >
                        <Plus size={16} />
                        <span>+ Add Fleet Vehicle</span>
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        to="/vehicles"
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5 cursor-pointer text-sm"
                      >
                        <Search size={16} />
                        <span>Browse All Fleet</span>
                      </Link>

                      <Link
                        to={getRoleDashboardLink()}
                        className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition-all cursor-pointer text-sm"
                      >
                        <span>{getRoleDashboardLabel()}</span>
                        <ArrowRight size={16} />
                      </Link>
                    </>
                  )}
                </div>
              </div>

              <div className="relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-4/3">
                  <img
                    src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop&q=80"
                    alt="Rental vehicle"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-6">
                    <div className="text-white">
                      <p className="text-xs font-semibold text-blue-300 uppercase">Live Marketplace Fleet</p>
                      <p className="text-lg font-bold">Verified Cars &amp; Bikes in 10+ Cities</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* AGENCY FLEET QUICK HUB vs CUSTOMER SEARCH WIDGET */}
            {user?.role === "agency" ? (
              <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-900/50">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 mb-2">
                      <Building2 size={13} /> Commercial Agency Partner
                    </span>
                    <h3 className="text-xl sm:text-2xl font-black text-white">
                      Manage Your Enterprise Fleet
                    </h3>
                    <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                      Commercial agencies have exclusive authorization to add new vehicles, update rental rates &amp; specifications, and manage incoming customer bookings.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <Link
                      to="/agency/dashboard"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs sm:text-sm transition shadow-md shadow-indigo-600/30 cursor-pointer"
                    >
                      <Plus size={16} />
                      <span>+ Add Fleet Vehicle</span>
                    </Link>

                    <Link
                      to="/agency/dashboard?tab=vehicles"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition backdrop-blur-xs cursor-pointer border border-white/10"
                    >
                      <Car size={16} />
                      <span>Fleet Inventory</span>
                    </Link>

                    <Link
                      to="/agency/dashboard?tab=bookings"
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm transition backdrop-blur-xs cursor-pointer border border-white/10"
                    >
                      <Calendar size={16} />
                      <span>Incoming Reservations</span>
                    </Link>
                  </div>
                </div>
              </div>
            ) : (
              /* INTERACTIVE LOCATION & VEHICLE SEARCH WIDGET (FOR CUSTOMERS & GUESTS) */
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-indigo-900/5 p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-4 font-bold text-slate-900 text-sm">
                  <MapPin size={18} className="text-indigo-600" />
                  <span>Search Vehicles by Pickup Location &amp; Category</span>
                </div>

                <form onSubmit={handleHeroSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 items-center">
                  {/* City / Location Selector */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Pickup Location / City
                    </label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-600" />
                      <select
                        value={selectedCity}
                        onChange={(e) => setSelectedCity(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                      >
                        <option value="All">All Gujarat Districts (33)</option>
                        {GUJARAT_DISTRICTS.map((district) => (
                          <option key={district} value={district}>
                            📍 {district}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Vehicle Type */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Vehicle Type
                    </label>
                    <div className="relative">
                      <Car size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <select
                        value={selectedType}
                        onChange={(e) => setSelectedType(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition cursor-pointer"
                      >
                        <option value="All">All Types (Cars &amp; Bikes)</option>
                        <option value="Car">Sedans &amp; Hatchbacks</option>
                        <option value="SUV">SUVs</option>
                        <option value="Luxury">Luxury</option>
                        <option value="Bike">Bikes &amp; Scooters</option>
                      </select>
                    </div>
                  </div>

                  {/* Keyword Search */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                      Keyword (Optional)
                    </label>
                    <div className="relative">
                      <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Creta, Activa, Thar..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      />
                    </div>
                  </div>

                  {/* Submit Search Button */}
                  <div className="self-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md shadow-indigo-500/20 transition flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Search size={16} />
                      <span>Search in {selectedCity === "All" ? "Gujarat" : selectedCity}</span>
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="py-20 px-4 sm:px-8 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Why Choose RentWheels?
            </h2>
            <p className="text-slate-600">
              Everything you need for a frictionless and dependable vehicle rental experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <CarFront size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Wide Vehicle Choices</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Explore budget hatchbacks, premium sedans, SUVs, bikes, and luxury fleets tailored for any road trip.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Verified Host Platform</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every vehicle and driving licence is reviewed by our administration team to guarantee trust and security.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                <CalendarCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Online Booking</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Select your dates, check live vehicle availability, calculate pricing, and book your ride seamlessly.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-20 px-4 sm:px-8 bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Step-by-Step Guide</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">How RentWheels Works</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-lg mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30">
                  1
                </div>
                <h3 className="text-xl font-bold">Discover & Select</h3>
                <p className="text-slate-400 text-sm">
                  Search through verified cars and bikes filtered by city, type, and daily rental budget.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-lg mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30">
                  2
                </div>
                <h3 className="text-xl font-bold">Pick Schedule & Dates</h3>
                <p className="text-slate-400 text-sm">
                  Choose your rental pickup and return dates with automatic real-time conflict checking.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-lg mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30">
                  3
                </div>
                <h3 className="text-xl font-bold">Drive & Enjoy</h3>
                <p className="text-slate-400 text-sm">
                  Receive instant confirmation, pick up the keys, and start your journey with full peace of mind.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;