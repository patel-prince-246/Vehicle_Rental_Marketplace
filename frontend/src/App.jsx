
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Vehicles from "./pages/Vehicles";
import VehicleDetails from "./pages/VehicleDetails";
import Booking from "./pages/Booking";
import Login from "./pages/Login";

function Register() {
  return <h1>Register</h1>;
}

function CustomerDashboard() {
  return <h1>Customer Dashboard</h1>;
}

function OwnerDashboard() {
  return <h1>Owner Dashboard</h1>;
}

function AgencyDashboard() {
  return <h1>Agency Dashboard</h1>;
}

function AdminDashboard() {
  return <h1>Admin Dashboard</h1>;
}

function NotFound() {
  return <h1>404 - Page Not Found</h1>;
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/vehicles" element={<Vehicles />} />
      <Route
        path="/vehicles/:id"
        element={<VehicleDetails />}
      />
      <Route path="/booking/:id" element={<Booking />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/customer/dashboard"
        element={<CustomerDashboard />}
      />

      <Route
        path="/owner/dashboard"
        element={<OwnerDashboard />}
      />

      <Route
        path="/agency/dashboard"
        element={<AgencyDashboard />}
      />

      <Route
        path="/admin/dashboard"
        element={<AdminDashboard />}
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;

//demonstartion 
//future goals
//cross comparison