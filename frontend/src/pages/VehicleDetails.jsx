
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./VehicleDetails.css";

const vehicles = {
  1: {
    id: 1,
    name: "Honda City",
    type: "Car",
    price: 1800,
    location: "Nadiad",
    image: "https://placehold.co/800x500?text=Honda+City",
    rating: 4.8,
    reviews: 24,
    fuel: "Petrol",
    transmission: "Manual",
    seats: 5,
    description:
      "Enjoy a comfortable ride with the Honda City. Suitable for family trips and daily travel.",
    owner: "Rahul Patel",
  },
  2: {
    id: 2,
    name: "Royal Enfield Classic 350",
    type: "Bike",
    price: 900,
    location: "Nadiad",
    image: "https://placehold.co/800x500?text=Classic+350",
    rating: 4.7,
    reviews: 18,
    fuel: "Petrol",
    transmission: "Manual",
    seats: 2,
    description:
      "Experience a classic ride with the Royal Enfield Classic 350. Ideal for city rides and long journeys.",
    owner: "Amit Shah",
  },
  3: {
    id: 3,
    name: "Honda Activa",
    type: "Scooter",
    price: 500,
    location: "Nadiad",
    image: "https://placehold.co/800x500?text=Honda+Activa",
    rating: 4.5,
    reviews: 12,
    fuel: "Petrol",
    transmission: "Automatic",
    seats: 2,
    description:
      "A convenient scooter for daily commuting and exploring the city.",
    owner: "Neha Desai",
  },
};

function VehicleDetails() {
  const { id } = useParams();
  const vehicle = vehicles[id];

  if (!vehicle) {
    return (
      <>
        <Navbar />
        <div className="vehicle-details-container">
          <h1>Vehicle not found</h1>
          <Link to="/vehicles">Back to Vehicles</Link>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />

      <div className="vehicle-details-container">
        <Link to="/vehicles" className="back-link">
          &larr; Back to Vehicles
        </Link>

        <div className="vehicle-details-layout">
          <div className="vehicle-details-main">
            <img
              src={vehicle.image}
              alt={vehicle.name}
              className="vehicle-main-image"
            />

            <div className="vehicle-info">
              <div className="vehicle-title-row">
                <div>
                  <h1>{vehicle.name}</h1>
                  <p className="vehicle-location">
                    {vehicle.location} · {vehicle.type}
                  </p>
                </div>

                <div className="vehicle-rating">
                  ★ {vehicle.rating} ({vehicle.reviews} reviews)
                </div>
              </div>

              <hr />

              <h2>Vehicle Details</h2>

              <div className="vehicle-specs">
                <div>
                  <span>Vehicle Type</span>
                  <strong>{vehicle.type}</strong>
                </div>

                <div>
                  <span>Fuel</span>
                  <strong>{vehicle.fuel}</strong>
                </div>

                <div>
                  <span>Transmission</span>
                  <strong>{vehicle.transmission}</strong>
                </div>

                <div>
                  <span>Seats</span>
                  <strong>{vehicle.seats}</strong>
                </div>
              </div>

              <hr />

              <h2>Description</h2>
              <p className="vehicle-description">
                {vehicle.description}
              </p>

              <hr />

              <h2>Vehicle Owner</h2>
              <p>{vehicle.owner}</p>

              <hr />

              <h2>Customer Reviews</h2>
              <div className="review-card">
                <strong>Customer Review</strong>
                <p>★★★★★</p>
                <p>
                  Good vehicle and a comfortable experience.
                </p>
              </div>
            </div>
          </div>

          <aside className="vehicle-booking-card">
            <h2>
              ₹{vehicle.price}
              <span> / day</span>
            </h2>

            <p className="availability-text">
              Check availability and book this vehicle.
            </p>

            <Link
              to={`/booking/${vehicle.id}`}
              className="book-now-btn"
            >
              Book Now
            </Link>

            <p className="booking-disclaimer">
              Booking is subject to vehicle availability and owner
              approval.
            </p>
          </aside>
        </div>
      </div>
    </>
  );
}

export default VehicleDetails;