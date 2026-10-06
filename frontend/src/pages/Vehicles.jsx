import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Search,
  SlidersHorizontal,
  Calendar,
  AlertTriangle,
  ShieldCheck,
  LayoutDashboard,
  MapPin,
  X,
  Car,
  Plus,
  Building2,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import VehicleCard from "../components/cards/VehicleCard";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";
import { GUJARAT_DISTRICTS } from "../constants/locations";

function Vehicles() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [vehicles, setVehicles] = useState([]);
  const [availableLocations, setAvailableLocations] = useState(GUJARAT_DISTRICTS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [location, setLocation] = useState(searchParams.get("location") || searchParams.get("city") || "All");
  const [type, setType] = useState(searchParams.get("type") || "All");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("default");

  // Sync URL search params
  useEffect(() => {
    const locParam = searchParams.get("location") || searchParams.get("city");
    if (locParam) setLocation(locParam);

    const typeParam = searchParams.get("type");
    if (typeParam) setType(typeParam);

    const qParam = searchParams.get("search");
    if (qParam) setSearch(qParam);
  }, [searchParams]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await api.get("/vehicles/locations");
        if (res.data?.success && Array.isArray(res.data.locations)) {
          setAvailableLocations(res.data.locations);
        }
      } catch (err) {
        console.warn("Could not fetch dynamic locations, using defaults:", err);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await api.get("/vehicles");
        const data = response.data;
        const vehicleList = Array.isArray(data)
          ? data
          : data.vehicles || data.data || [];

        setVehicles(vehicleList);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError(
          err.response?.data?.message || "Unable to load vehicles. Please try again."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const getVehicleType = (vehicle) =>
    vehicle.type || vehicle.vehicleType || "Other";

  const getVehiclePrice = (vehicle) =>
    Number(vehicle.pricePerDay ?? vehicle.rentPerDay ?? vehicle.price ?? 0);

  const filteredVehicles = vehicles
    .filter((vehicle) => {
      const brand = vehicle.brand || "";
      const model = vehicle.model || vehicle.name || "";
      const vehicleCity = vehicle.city || "";
      const vehicleType = getVehicleType(vehicle);
      const combinedSearchText = `${brand} ${model} ${vehicleCity} ${vehicleType}`.toLowerCase();

      const matchesSearch =
        !search.trim() ||
        combinedSearchText.includes(search.trim().toLowerCase());

      const matchesLocation =
        location === "All" ||
        vehicleCity.toLowerCase().includes(location.toLowerCase());

      const matchesType =
        type === "All" || vehicleType.toLowerCase() === type.toLowerCase();

      const matchesPrice =
        maxPrice === "" || getVehiclePrice(vehicle) <= Number(maxPrice);

      return matchesSearch && matchesLocation && matchesType && matchesPrice;
    })
    .sort((a, b) => {
      if (sort === "price-low")
        return getVehiclePrice(a) - getVehiclePrice(b);
      if (sort === "price-high")
        return getVehiclePrice(b) - getVehiclePrice(a);
      return 0;
    });

  const clearAllFilters = () => {
    setSearch("");
    setLocation("All");
    setType("All");
    setMaxPrice("");
    setSort("default");
    setSearchParams({});
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Title */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Explore Available Fleet
            </h1>
            <p className="text-slate-600 mt-1 text-sm">
              Find the right ride for your travel plans across Gujarat with live availability.
            </p>
          </div>

          {user?.role === "customer" && (
            <Link
              to="/customer/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 text-xs font-bold transition shadow-xs self-start md:self-auto"
            >
              <LayoutDashboard size={16} className="text-indigo-400" />
              Open Customer Dashboard
            </Link>
          )}

          {user?.role === "agency" && (
            <Link
              to="/agency/dashboard"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-xs self-start md:self-auto"
            >
              <Building2 size={16} />
              Open Agency Dashboard
            </Link>
          )}
        </div>

        {/* Agency Partner Management Banner */}
        {user?.role === "agency" && (
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 mb-8 shadow-md border border-indigo-900/50 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                  <Building2 size={12} /> Authorized Agency Portal
                </span>
              </div>
              <h3 className="text-lg font-bold">
                Logged in as: <span className="text-indigo-300">{user?.name || "Agency Partner"}</span>
              </h3>
              <p className="text-slate-300 text-xs mt-0.5">
                Only registered agencies can add new fleet vehicles, update rates/specifications, and remove listings.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                to="/agency/dashboard"
                className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition shadow-xs"
              >
                <Plus size={15} /> + Add Fleet Vehicle
              </Link>
              <Link
                to="/agency/dashboard?tab=vehicles"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition backdrop-blur-xs"
              >
                <Car size={15} /> Edit &amp; Remove Fleet
              </Link>
              <Link
                to="/agency/dashboard?tab=bookings"
                className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition backdrop-blur-xs"
              >
                <Calendar size={15} /> Reservations
              </Link>
            </div>
          </div>
        )}

        {/* Customer Dashboard 3 Shortcut Buttons */}
        {user?.role === "customer" && (
          <div className="bg-white border border-indigo-100/80 rounded-2xl p-3.5 mb-8 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-700 text-xs font-bold uppercase tracking-wider">
              <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
              Customer Dashboard:
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              <Link
                to="/customer/dashboard?tab=bookings"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 rounded-xl text-xs font-bold text-slate-700 hover:text-indigo-700 transition"
              >
                <Calendar size={14} className="text-indigo-600" />
                1. My Reservations
              </Link>
              <Link
                to="/customer/dashboard?tab=disputes"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-300 rounded-xl text-xs font-bold text-slate-700 hover:text-rose-700 transition"
              >
                <AlertTriangle size={14} className="text-rose-600" />
                2. Disputes &amp; Claims
              </Link>
              <Link
                to="/customer/dashboard?tab=profile"
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl text-xs font-bold text-slate-700 hover:text-emerald-700 transition"
              >
                <ShieldCheck size={14} className="text-emerald-600" />
                3. Profile &amp; License Settings
              </Link>
            </div>
          </div>
        )}

        {/* Filters Bar */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs p-5 mb-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 items-center">
            {/* Search Input */}
            <div className="relative">
              <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search brand, model, or city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
              />
            </div>

            {/* Location / City Filter */}
            <div className="relative">
              <MapPin size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
              <select
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setSearchParams((prev) => {
                    const next = new URLSearchParams(prev);
                    if (e.target.value === "All") next.delete("location");
                    else next.set("location", e.target.value);
                    return next;
                  });
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-800 bg-white"
              >
                <option value="All">📍 All Gujarat Locations</option>
                {availableLocations.map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc}
                  </option>
                ))}
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 bg-white"
              >
                <option value="All">All Vehicle Types</option>
                <option value="Car">Cars</option>
                <option value="SUV">SUVs</option>
                <option value="Luxury">Luxury</option>
                <option value="Bike">Bikes &amp; Scooters</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Max Price */}
            <div>
              <input
                type="number"
                placeholder="Max Price (₹/day)"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
              />
            </div>

            {/* Sort Option */}
            <div>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 bg-white"
              >
                <option value="default">Sort: Default</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
              </select>
            </div>
          </div>

          {/* Quick Location Filter Chips */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] mr-1 flex items-center gap-1">
                <MapPin size={12} className="text-indigo-600" /> Popular Cities:
              </span>
              <button
                type="button"
                onClick={() => setLocation("All")}
                className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                  location === "All"
                    ? "bg-indigo-600 text-white shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                All Cities
              </button>
              {availableLocations.slice(0, 6).map((city) => (
                <button
                  key={city}
                  type="button"
                  onClick={() => setLocation(city)}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                    location.toLowerCase() === city.toLowerCase()
                      ? "bg-indigo-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {(search || location !== "All" || type !== "All" || maxPrice) && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs border border-rose-200 transition cursor-pointer ml-auto"
              >
                <X size={13} /> Clear Filters
              </button>
            )}
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <span>
              {filteredVehicles.length} {filteredVehicles.length === 1 ? "Vehicle" : "Vehicles"} Found
            </span>
            {location !== "All" && (
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold px-2.5 py-0.5 rounded-full">
                in {location}
              </span>
            )}
          </h2>
        </div>

        {/* Content States */}
        {loading ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-slate-500 font-medium">Loading available fleet...</p>
          </div>
        ) : error ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-red-200 p-6">
            <h3 className="text-lg font-bold text-red-600 mb-2">Unable to Load Vehicles</h3>
            <p className="text-slate-600 text-sm mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-slate-900 text-white text-sm font-semibold rounded-lg hover:bg-slate-800"
            >
              Retry
            </button>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <EmptyState
            icon={SlidersHorizontal}
            title="No Matching Vehicles Found"
            description="Try clearing your search query or adjusting your price filters to see more results."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle._id || vehicle.id || vehicle.vehicleid} vehicle={vehicle} />
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default Vehicles;