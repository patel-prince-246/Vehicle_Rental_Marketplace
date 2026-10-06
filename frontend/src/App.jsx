
import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import Vehicles from "./pages/Vehicles";
import VehicleDetails from "./pages/VehicleDetails";
import Booking from "./pages/Booking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import CustomerDashboard from "./pages/CustomerDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import AgencyDashboard from "./pages/AgencyDashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ProtectedRoute from "./components/common/ProtectedRoute";


function NotFound() {
  return (
    <div style={{ textAlign: "center", padding: "5rem 2rem", color: "#64748b" }}>
      <h1 style={{ fontSize: "3rem", color: "#0f172a", marginBottom: "1rem" }}>404</h1>
      <p style={{ fontSize: "1.2rem" }}>Page Not Found</p>
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/vehicles" element={<Vehicles />} />
      <Route path="/vehicles/:id" element={<VehicleDetails />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Authenticated Booking Route (Customer only) */}
      <Route element={<ProtectedRoute allowedRoles={["customer", "admin"]} />}>
        <Route path="/booking/:id" element={<Booking />} />
      </Route>

      {/* Customer Protected Route */}
      <Route element={<ProtectedRoute allowedRoles={["customer", "admin"]} />}>
        <Route path="/customer/dashboard" element={<CustomerDashboard />} />
      </Route>

      {/* Owner Protected Route */}
      <Route element={<ProtectedRoute allowedRoles={["owner", "admin"]} />}>
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
      </Route>

      {/* Agency Protected Route */}
      <Route element={<ProtectedRoute allowedRoles={["agency", "admin"]} />}>
        <Route path="/agency/dashboard" element={<AgencyDashboard />} />
      </Route>

      {/* Admin Protected Route */}
      <Route element={<ProtectedRoute allowedRoles={["admin"]} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
      </Route>

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;