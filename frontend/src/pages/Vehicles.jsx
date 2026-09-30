
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import Navbar from "../components/Navbar";
import api from "../services/api";
import "./Vehicles.css";

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

        // Support common API response formats.
        const data = response.data;
        const vehicleList = Array.isArray(data)
          ? data
          : data.vehicles || data.data || [];

        setVehicles(vehicleList);
      } catch (err) {
        console.error("Error fetching vehicles:", err);
        setError(
          err.response?.data?.message ||
            "Unable to load vehicles. Please try again."
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

  const getVehicleImage = (vehicle) => {
    if (Array.isArray(vehicle.images) && vehicle.images.length > 0) {
      return vehicle.images[0];
    }

    return (
      vehicle.image ||
      vehicle.images?.[0]?.url ||
      "https://placehold.co/600x350?text=Vehicle"
    );
  };

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
      if (sort === "low") {
        return getVehiclePrice(a) - getVehiclePrice(b);
      }

      if (sort === "high") {
        return getVehiclePrice(b) - getVehiclePrice(a);
      }

      return 0;
    });

  return (
    <>
      <Navbar />

      <main className="vehicles-page">
        <section className="vehicles-heading">
          <span className="page-label">EXPLORE OUR VEHICLES</span>
          <h1>Find Your Perfect Ride</h1>
          <p>Search and compare vehicles available for rent.</p>
        </section>

        <section className="vehicle-filters">
          <div className="search-box">
            <Search size={20} />
            <input
              type="text"
              placeholder="Search by brand or model"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
          >
            <option value="All">All vehicle types</option>
            <option value="Car">Cars</option>
            <option value="Bike">Bikes</option>
            <option value="Scooter">Scooters</option>
            <option value="SUV">SUVs</option>
            <option value="Other">Other</option>
          </select>

          <input
            type="number"
            min="0"
            placeholder="Max price per day"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
          />

          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="default">Sort by: Default</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </section>

        <div className="results-heading">
          <h2>Available Vehicles</h2>
          <span>{filteredVehicles.length} vehicles found</span>
        </div>

        {loading ? (
          <div className="no-vehicles">
            <p>Loading vehicles...</p>
          </div>
        ) : error ? (
          <div className="no-vehicles">
            <h3>Something went wrong</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
              Retry
            </button>
          </div>
        ) : filteredVehicles.length === 0 ? (
          <div className="no-vehicles">
            <SlidersHorizontal size={36} />
            <h3>No vehicles found</h3>
            <p>Try changing your search or filters.</p>
          </div>
        ) : (
          <section className="vehicle-grid">
            {filteredVehicles.map((vehicle) => (
              <article
                className="vehicle-card"
                key={vehicle._id || vehicle.id}
              >
                <img
                  src={getVehicleImage(vehicle)}
                  alt={`${vehicle.brand || ""} ${
                    vehicle.model || vehicle.name || "Vehicle"
                  }`}
                />

                <div className="vehicle-card-content">
                  <span className="vehicle-type">
                    {getVehicleType(vehicle)}
                  </span>

                  <h3>
                    {vehicle.brand}{" "}
                    {vehicle.model || vehicle.name}
                  </h3>

                  <p className="vehicle-location">
                    <MapPin size={16} />
                    {vehicle.city || vehicle.location || "Location unavailable"}
                  </p>

                  <div className="vehicle-card-footer">
                    <p>
                      <strong>₹{getVehiclePrice(vehicle)}</strong>
                      <span> / day</span>
                    </p>

                    <Link
                      to={`/vehicles/${vehicle._id || vehicle.id}`}
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </section>
        )}
      </main>
    </>
  );
}

export default Vehicles;