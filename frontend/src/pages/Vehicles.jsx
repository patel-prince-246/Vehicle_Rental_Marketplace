
import { useState } from "react";
import { Link } from "react-router-dom";
import { Search, SlidersHorizontal, MapPin } from "lucide-react";
import Navbar from "../components/Navbar";
import "./Vehicles.css";

const sampleVehicles = [
  {
    id: 1,
    brand: "Honda",
    model: "City",
    type: "Car",
    city: "Nadiad",
    pricePerDay: 1800,
    image: "https://placehold.co/600x350?text=Honda+City",
  },
  {
    id: 2,
    brand: "Royal Enfield",
    model: "Classic 350",
    type: "Bike",
    city: "Nadiad",
    pricePerDay: 900,
    image: "https://placehold.co/600x350?text=Classic+350",
  },
  {
    id: 3,
    brand: "Honda",
    model: "Activa",
    type: "Scooter",
    city: "Nadiad",
    pricePerDay: 500,
    image: "https://placehold.co/600x350?text=Honda+Activa",
  },
];

function Vehicles() {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("All");
  const [maxPrice, setMaxPrice] = useState("");
  const [sort, setSort] = useState("default");

  let filteredVehicles = sampleVehicles.filter((vehicle) => {
    const matchesSearch =
      `${vehicle.brand} ${vehicle.model}`
        .toLowerCase()
        .includes(search.toLowerCase());

    const matchesType = type === "All" || vehicle.type === type;
    const matchesPrice =
      maxPrice === "" || vehicle.pricePerDay <= Number(maxPrice);

    return matchesSearch && matchesType && matchesPrice;
  });

  if (sort === "low") {
    filteredVehicles.sort((a, b) => a.pricePerDay - b.pricePerDay);
  } else if (sort === "high") {
    filteredVehicles.sort((a, b) => b.pricePerDay - a.pricePerDay);
  }

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

          <select value={type} onChange={(e) => setType(e.target.value)}>
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

          <select value={sort} onChange={(e) => setSort(e.target.value)}>
            <option value="default">Sort by: Default</option>
            <option value="low">Price: Low to High</option>
            <option value="high">Price: High to Low</option>
          </select>
        </section>

        <div className="results-heading">
          <h2>Available Vehicles</h2>
          <span>{filteredVehicles.length} vehicles found</span>
        </div>

        {filteredVehicles.length === 0 ? (
          <div className="no-vehicles">
            <SlidersHorizontal size={36} />
            <h3>No vehicles found</h3>
            <p>Try changing your search or filters.</p>
          </div>
        ) : (
          <section className="vehicle-grid">
            {filteredVehicles.map((vehicle) => (
              <article className="vehicle-card" key={vehicle.id}>
                <img src={vehicle.image} alt={`${vehicle.brand} ${vehicle.model}`} />

                <div className="vehicle-card-content">
                  <span className="vehicle-type">{vehicle.type}</span>
                  <h3>{vehicle.brand} {vehicle.model}</h3>

                  <p className="vehicle-location">
                    <MapPin size={16} />
                    {vehicle.city}
                  </p>

                  <div className="vehicle-card-footer">
                    <p>
                      <strong>₹{vehicle.pricePerDay}</strong>
                      <span> / day</span>
                    </p>
                    <Link to={`/vehicles/${vehicle.id}`}>View Details</Link>
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