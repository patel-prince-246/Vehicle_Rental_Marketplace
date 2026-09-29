import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Booking.css";

const vehicles = {
1: {
name: "Honda City",
type: "Car",
price: 1800,
image: "https://placehold.co/600x400?text=Honda+City",
},
2: {
name: "Royal Enfield Classic 350",
type: "Bike",
price: 900,
image: "https://placehold.co/600x400?text=Classic+350",
},
3: {
name: "Honda Activa",
type: "Scooter",
price: 500,
image: "https://placehold.co/600x400?text=Honda+Activa",
},
};

function Booking() {
const { id } = useParams();
const navigate = useNavigate();
const vehicle = vehicles[id];

const [startDate, setStartDate] = useState("");
const [endDate, setEndDate] = useState("");
const [pickupLocation, setPickupLocation] = useState("");

if (!vehicle) {
return <h2>Vehicle not found</h2>;
}

const days =
startDate && endDate
? Math.max(
0,
Math.ceil(
(new Date(endDate) - new Date(startDate)) /
(1000 * 60 * 60 * 24)
)
)
: 0;

const total = days * vehicle.price;

const handleSubmit = (e) => {
e.preventDefault();

```
if (!startDate || !endDate || !pickupLocation.trim()) {
  alert("Please fill in all fields.");
  return;
}

if (new Date(endDate) <= new Date(startDate)) {
  alert("Return date must be after pickup date.");
  return;
}

alert("Booking form completed. Backend integration is pending.");
```

};

return (
<> <Navbar />

```
  <div className="booking-container">
    <h1>Book Your Vehicle</h1>

    <div className="booking-layout">
      <div className="booking-form-card">
        <h2>Rental Details</h2>

        <form onSubmit={handleSubmit}>
          <label>Pickup Date</label>
          <input
            type="date"
            value={startDate}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />

          <label>Return Date</label>
          <input
            type="date"
            value={endDate}
            min={startDate || new Date().toISOString().split("T")[0]}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />

          <label>Pickup Location</label>
          <input
            type="text"
            placeholder="Enter pickup location"
            value={pickupLocation}
            onChange={(e) => setPickupLocation(e.target.value)}
            required
          />

          <button type="submit" className="confirm-booking-btn">
            Confirm Booking
          </button>
        </form>
      </div>

      <div className="booking-summary-card">
        <h2>Booking Summary</h2>

        <img src={vehicle.image} alt={vehicle.name} />

        <h3>{vehicle.name}</h3>
        <p>{vehicle.type}</p>

        <div className="summary-row">
          <span>Price per day</span>
          <strong>₹{vehicle.price}</strong>
        </div>

        <div className="summary-row">
          <span>Rental days</span>
          <strong>{days}</strong>
        </div>

        <div className="summary-total">
          <span>Total Amount</span>
          <strong>₹{total}</strong>
        </div>

        <p className="booking-note">
          Final booking is subject to vehicle availability and owner
          approval.
        </p>
      </div>
    </div>
  </div>
</>

);
}

export default Booking;
