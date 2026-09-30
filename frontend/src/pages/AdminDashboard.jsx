import { useState, useEffect } from "react";
import {
  Users,
  Car,
  Building2,
  Calendar,
  CreditCard,
  CheckCircle,
  XCircle,
  Activity,
  Trash2,
  RefreshCw,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import StatusBadge from "../components/common/StatusBadge";
import StatCard from "../components/common/StatCard";
import api from "../services/api";


function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [agenciesList, setAgenciesList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchStats = async () => {
    try {
      const res = await api.get("/admin/dashboard");
      if (res.data?.success) {
        setStats(res.data.dashboard);
      }
    } catch (err) {
      console.error("Error loading admin stats:", err);
    }
  };

  const fetchTabContent = async (tab) => {
    try {
      setLoading(true);
      setError("");

      if (tab === "overview") {
        await fetchStats();
      } else if (tab === "vehicles") {
        const res = await api.get("/admin/vehicles");
        if (res.data?.success) {
          setVehicles(res.data.vehicles || []);
        }
      } else if (tab === "users") {
        const res = await api.get("/admin/users");
        if (res.data?.success) {
          setUsersList(res.data.users || []);
        }
      } else if (tab === "agencies") {
        const res = await api.get("/admin/agencies");
        if (res.data?.success) {
          setAgenciesList(res.data.agencies || []);
        }
      } else if (tab === "bookings") {
        const res = await api.get("/admin/bookings");
        if (res.data?.success) {
          setBookingsList(res.data.bookings || []);
        }
      }
    } catch (err) {
      console.error(`Error loading ${tab}:`, err);
      setError(`Failed to load ${tab} data.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchTabContent(activeTab);
  }, [activeTab]);

  const handleVerifyVehicle = async (vehicleId) => {
    try {
      const res = await api.put(`/admin/vehicles/${vehicleId}/verify`);
      if (res.data?.success) {
        fetchTabContent("vehicles");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to verify vehicle.");
    }
  };

  const handleRejectVehicle = async (vehicleId) => {
    try {
      const res = await api.put(`/admin/vehicles/${vehicleId}/reject`);
      if (res.data?.success) {
        fetchTabContent("vehicles");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject vehicle.");
    }
  };

  const handleVerifyAgency = async (agencyId) => {
    try {
      const res = await api.put(`/admin/agencies/${agencyId}/verify`);
      if (res.data?.success) {
        fetchTabContent("agencies");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to verify agency.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to remove this user?")) return;
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      if (res.data?.success) {
        fetchTabContent("users");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete user.");
    }
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "verified":
      case "available":
      case "active":
      case "paid":
      case "confirmed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
      case "booked":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected":
      case "cancelled":
      case "inactive":
      case "disabled":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Platform Administration</h1>
            <p className="text-slate-500 mt-1">System-wide metrics, vehicle verifications, users and transaction logs.</p>
          </div>

          <button
            onClick={() => fetchTabContent(activeTab)}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-medium px-4 py-2 rounded-xl border border-slate-200 transition shadow-sm"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-200/70 p-1.5 rounded-2xl w-fit">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "vehicles", label: "Vehicles Approval", icon: Car },
            { id: "agencies", label: "Agencies", icon: Building2 },
            { id: "users", label: "Users", icon: Users },
            { id: "bookings", label: "Bookings", icon: Calendar },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition ${
                  isActive
                    ? "bg-white text-indigo-600 shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users size={24} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Users</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalUsers ?? 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Car size={24} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Vehicles Listed</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalVehicles ?? 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Building2 size={24} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Agencies & Owners</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{(stats?.totalAgencies ?? 0) + (stats?.totalOwners ?? 0)}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Calendar size={24} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Bookings</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalBookings ?? 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CreditCard size={24} />
                </div>
                <div>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Payments</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{stats?.totalPayments ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vehicles Verification Tab */}
        {activeTab === "vehicles" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Vehicle Verification Queue</h2>
            {loading ? (
              <p className="text-center py-12 text-slate-500">Loading vehicles...</p>
            ) : vehicles.length === 0 ? (
              <p className="text-center py-12 text-slate-500">No vehicles found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Vehicle</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Type</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">City</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Price / Day</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Verification Status</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehicles.map((v) => (
                      <tr key={v._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900">{v.brand} {v.model}</strong>
                          <div className="text-xs text-slate-400">{v.vehicleid}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{v.type}</td>
                        <td className="py-3.5 px-4 text-slate-600">{v.city}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-900">₹{v.pricePerDay ?? v.price}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(v.verificationStatus)}`}>
                            {v.verificationStatus}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {v.verificationStatus !== "verified" && (
                              <button
                                onClick={() => handleVerifyVehicle(v._id)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition"
                                title="Approve & Verify"
                              >
                                <CheckCircle size={14} /> Approve
                              </button>
                            )}
                            {v.verificationStatus !== "rejected" && (
                              <button
                                onClick={() => handleRejectVehicle(v._id)}
                                className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg transition"
                                title="Reject"
                              >
                                <XCircle size={14} /> Reject
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Agencies Tab */}
        {activeTab === "agencies" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Agencies</h2>
            {loading ? (
              <p className="text-center py-12 text-slate-500">Loading agencies...</p>
            ) : agenciesList.length === 0 ? (
              <p className="text-center py-12 text-slate-500">No agencies registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Agency Name</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Owner / Contact</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Address</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Status</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agenciesList.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{a.agencyName}</td>
                        <td className="py-3.5 px-4 text-slate-600">{a.ownerName || a.userId?.name || "N/A"}</td>
                        <td className="py-3.5 px-4 text-slate-600">{a.address || "N/A"}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(a.verificationStatus || 'verified')}`}>
                            {a.verificationStatus || 'verified'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          {a.verificationStatus !== "verified" && (
                            <button
                              onClick={() => handleVerifyAgency(a._id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition"
                            >
                              <CheckCircle size={14} /> Verify
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Platform Users</h2>
            {loading ? (
              <p className="text-center py-12 text-slate-500">Loading users...</p>
            ) : usersList.length === 0 ? (
              <p className="text-center py-12 text-slate-500">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Name</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Email</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Role</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">City</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Status</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {usersList.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{u.name}</td>
                        <td className="py-3.5 px-4 text-slate-600">{u.email}</td>
                        <td className="py-3.5 px-4">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{u.city || "N/A"}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(u.isActive ? "active" : "disabled")}`}>
                            {u.isActive ? "Active" : "Disabled"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleDeleteUser(u._id)}
                            className="inline-flex items-center text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-2 rounded-lg transition"
                            title="Delete User"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <h2 className="text-xl font-bold text-slate-900 mb-6">All Marketplace Bookings</h2>
            {loading ? (
              <p className="text-center py-12 text-slate-500">Loading bookings...</p>
            ) : bookingsList.length === 0 ? (
              <p className="text-center py-12 text-slate-500">No bookings recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Booking ID</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Customer</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Vehicle</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Duration</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Total</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Status</th>
                      <th className="py-3.5 px-4 font-semibold text-slate-700 text-xs uppercase tracking-wider">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookingsList.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono text-xs text-indigo-600 font-semibold">{b.bookingid}</td>
                        <td className="py-3.5 px-4 text-slate-900 font-medium">{b.customerId?.name || "Customer"}</td>
                        <td className="py-3.5 px-4 text-slate-700">{b.vehicleId ? `${b.vehicleId.brand} ${b.vehicleId.model}` : "Vehicle"}</td>
                        <td className="py-3.5 px-4 text-slate-500 text-xs">{new Date(b.startDate).toLocaleDateString()} - {new Date(b.endDate).toLocaleDateString()}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">₹{b.totalAmount}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(b.status)}`}>
                            {b.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(b.paymentStatus)}`}>
                            {b.paymentStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
}

export default AdminDashboard;


