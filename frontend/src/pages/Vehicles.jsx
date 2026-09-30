import { useEffect, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import VehicleCard from "../components/cards/VehicleCard";
import EmptyState from "../components/common/EmptyState";
import api from "../services/api";

function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("default");

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
      const searchText = `${brand} ${model}`.toLowerCase();

      const matchesSearch = searchText.includes(search.toLowerCase());
      const matchesType =
        type === "All" || getVehicleType(vehicle) === type;
      const matchesPrice =
        maxPrice === "" || getVehiclePrice(vehicle) <= Number(maxPrice);

      return matchesSearch && matchesType && matchesPrice;
    })
    .sort((a, b) => {
      if (sort === "price-low")
        return getVehiclePrice(a) - getVehiclePrice(b);
      if (sort === "price-high")
        return getVehiclePrice(b) - getVehiclePrice(a);
      return 0;
    });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore Available Fleet
          </h1>
          <p className="text-slate-600 mt-1 text-sm">
            Find the right ride for your travel plans across Gujarat with live availability.
          </p>
        </div>

        {/* Filters Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 mb-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
          {/* Search */}
          <div className="relative">
            <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by brand or model..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 bg-white"
            >
              <option value="All">All Vehicle Types</option>
              <option value="Car">Cars</option>
              <option value="SUV">SUVs</option>
              <option value="Luxury">Luxury</option>
              <option value="Bike">Bikes & Scooters</option>
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
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700"
            />
          </div>

          {/* Sort Option */}
          <div>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all font-medium text-slate-700 bg-white"
            >
              <option value="default">Sort: Default</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">
            {filteredVehicles.length} {filteredVehicles.length === 1 ? "Vehicle" : "Vehicles"} Found
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