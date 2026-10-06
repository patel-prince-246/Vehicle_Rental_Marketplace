import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
  FileCheck,
  AlertTriangle,
  MessageSquare,
  Eye,
  Lock,
  Unlock,
  Phone,
  Mail,
  MapPin,
  ShieldCheck,
  FileText,
  UserCheck,
  X,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import StatusBadge from "../components/common/StatusBadge";
import StatCard from "../components/common/StatCard";
import api from "../services/api";

function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && ["overview", "vehicles", "users", "agencies", "licenses", "bookings", "disputes"].includes(tabFromUrl)
      ? tabFromUrl
      : "overview"
  );

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam && ["overview", "vehicles", "users", "agencies", "licenses", "bookings", "disputes"].includes(tabParam)) {
      setActiveTab(tabParam);
      fetchTabContent(tabParam);
    }
  }, [searchParams]);
  const [stats, setStats] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [agenciesList, setAgenciesList] = useState([]);
  const [bookingsList, setBookingsList] = useState([]);
  const [licensesList, setLicensesList] = useState([]);
  const [disputesList, setDisputesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // User details modal state
  const [selectedUser, setSelectedUser] = useState(null);

  // Dispute resolution modal state
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [disputeStatus, setDisputeStatus] = useState("under_review");
  const [disputeResolution, setDisputeResolution] = useState("");
  const [disputeAdminNotes, setDisputeAdminNotes] = useState("");
  const [resolvingDispute, setResolvingDispute] = useState(false);

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
      } else if (tab === "licenses") {
        const res = await api.get("/admin/licenses");
        if (res.data?.success) {
          setLicensesList(res.data.licenses || []);
        }
      } else if (tab === "disputes") {
        const res = await api.get("/disputes/all");
        if (res.data?.success) {
          setDisputesList(res.data.disputes || []);
        }
      } else if (tab === "users") {
        const res = await api.get("/admin/users");
        if (res.data?.success) {
          const filtered = (res.data.users || []).filter((u) => u.role !== "admin");
          setUsersList(filtered);
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

  const handleVerifyLicense = async (userId) => {
    try {
      const res = await api.put(`/admin/licenses/${userId}/verify`);
      if (res.data?.success) {
        alert("Consumer driving license verified successfully!");
        fetchTabContent("licenses");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to verify license.");
    }
  };

  const handleRejectLicense = async (userId) => {
    const reason = prompt("Enter reason for rejecting this license:", "Document photo is unclear or invalid.");
    if (reason === null) return;

    try {
      const res = await api.put(`/admin/licenses/${userId}/reject`, { reason });
      if (res.data?.success) {
        alert("Consumer driving license marked as rejected.");
        fetchTabContent("licenses");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to reject license.");
    }
  };

  const handleResolveDispute = async (e) => {
    e.preventDefault();
    if (!selectedDispute) return;
    setResolvingDispute(true);
    try {
      const res = await api.put(`/disputes/${selectedDispute._id}`, {
        status: disputeStatus,
        resolution: disputeResolution,
        adminNotes: disputeAdminNotes,
      });

      if (res.data?.success) {
        alert("Dispute updated successfully.");
        setSelectedDispute(null);
        fetchTabContent("disputes");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update dispute.");
    } finally {
      setResolvingDispute(false);
    }
  };

  const handleToggleUserStatus = async (user) => {
    try {
      const newStatus = !user.isActive;
      const res = await api.put(`/admin/users/${user._id}/status`, { isActive: newStatus });
      if (res.data?.success) {
        fetchTabContent("users");
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update user status.");
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
      case "resolved":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
      case "uploaded":
      case "booked":
      case "under_review":
      case "open":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected":
      case "cancelled":
      case "inactive":
      case "disabled":
      case "dismissed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Platform Administration</h1>
            <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
              Manage system metrics, license verifications, vehicle listings, disputes, and users.
            </p>
          </div>

          <button
            onClick={() => fetchTabContent(activeTab)}
            className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-slate-200 transition shadow-xs cursor-pointer"
          >
            <RefreshCw size={14} />
            <span>Refresh Data</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-8 bg-slate-200/80 p-1.5 rounded-2xl w-fit">
          {[
            { id: "overview", label: "Overview", icon: Activity },
            { id: "licenses", label: "License Verification", icon: FileCheck },
            { id: "vehicles", label: "Vehicles Approval", icon: Car },
            { id: "disputes", label: "Disputes & Support", icon: MessageSquare },
            { id: "bookings", label: "Bookings", icon: Calendar },
            { id: "users", label: "Users", icon: Users },
            { id: "agencies", label: "Agencies", icon: Building2 },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl font-bold text-xs sm:text-sm transition cursor-pointer ${
                  isActive
                    ? "bg-white text-indigo-600 shadow-xs"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                }`}
                onClick={() => setActiveTab(tab.id)}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                  <Users size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Users</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{stats?.totalUsers ?? 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Car size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Vehicles</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{stats?.totalVehicles ?? 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                  <Building2 size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Hosts &amp; Agencies</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{(stats?.totalAgencies ?? 0) + (stats?.totalOwners ?? 0)}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                  <Calendar size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bookings</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{stats?.totalBookings ?? 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <CreditCard size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payments</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{stats?.totalPayments ?? 0}</p>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                  <AlertTriangle size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Disputes</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">{stats?.totalDisputes ?? 0}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: DRIVING LICENSES (SRS 3.1.6.3) */}
        {activeTab === "licenses" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <FileCheck size={20} className="text-indigo-600" />
              Consumer Driving License Verification Queue (SRS 3.1.6.3)
            </h2>
            {loading ? (
              <p className="text-center py-12 text-slate-500">Loading licenses...</p>
            ) : licensesList.length === 0 ? (
              <p className="text-center py-12 text-slate-500 text-sm">No pending license submissions found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3.5 px-4 font-bold text-slate-700">Customer</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">License Number</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Document</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Status</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {licensesList.map((u) => (
                      <tr key={u._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900 block">{u.name}</strong>
                          <span className="text-slate-500 text-xs">{u.email} · {u.phone}</span>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">
                          {u.license?.licenseNumber || "N/A"}
                        </td>
                        <td className="py-3.5 px-4">
                          {u.license?.imageUrl ? (
                            <a
                              href={u.license.imageUrl.startsWith("http") ? u.license.imageUrl : `http://localhost:5000${u.license.imageUrl}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:underline"
                            >
                              <Eye size={13} /> View File
                            </a>
                          ) : (
                            <span className="text-slate-400 text-xs">No file</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(u.license?.status)}`}>
                            {u.license?.status || "not_uploaded"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            {u.license?.status !== "verified" && (
                              <button
                                onClick={() => handleVerifyLicense(u._id)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                <CheckCircle size={13} /> Approve
                              </button>
                            )}
                            {u.license?.status !== "rejected" && (
                              <button
                                onClick={() => handleRejectLicense(u._id)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                <XCircle size={13} /> Reject
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

        {/* TAB 3: VEHICLES APPROVAL */}
        {activeTab === "vehicles" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Car size={20} className="text-indigo-600" />
              Vehicle Approval Queue
            </h2>
            {loading ? (
              <p className="text-center py-12 text-slate-500">Loading vehicles...</p>
            ) : vehicles.length === 0 ? (
              <p className="text-center py-12 text-slate-500 text-sm">No vehicles found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3.5 px-4 font-bold text-slate-700">Vehicle</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Type</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">City</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Rate / Day</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Verification</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {vehicles.map((v) => (
                      <tr key={v._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4">
                          <strong className="text-slate-900">{v.brand} {v.model}</strong>
                          <div className="text-xs text-slate-400 font-mono">ID: {v.vehicleid}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{v.type}</td>
                        <td className="py-3.5 px-4 text-slate-600">{v.city}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">₹{v.pricePerDay ?? v.price}</td>
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
                                className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                <CheckCircle size={13} /> Approve
                              </button>
                            )}
                            {v.verificationStatus !== "rejected" && (
                              <button
                                onClick={() => handleRejectVehicle(v._id)}
                                className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                              >
                                <XCircle size={13} /> Reject
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

        {/* TAB 4: DISPUTES */}
        {activeTab === "disputes" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <MessageSquare size={20} className="text-indigo-600" />
              Platform Dispute &amp; Support Management
            </h2>
            {loading ? (
              <p className="text-center py-12 text-slate-500">Loading disputes...</p>
            ) : disputesList.length === 0 ? (
              <p className="text-center py-12 text-slate-500 text-sm">No user disputes reported.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3.5 px-4 font-bold text-slate-700">Dispute ID</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">User / Filer</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Category</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Subject</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Status</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {disputesList.map((d) => (
                      <tr key={d._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">#{d.disputeId}</td>
                        <td className="py-3.5 px-4 text-slate-900 font-medium">
                          {d.raisedBy?.name || "User"} ({d.raisedBy?.email})
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 uppercase text-xs font-bold">
                          {d.reason?.replace("_", " ")}
                        </td>
                        <td className="py-3.5 px-4 text-slate-800 font-medium">{d.title}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(d.status)}`}>
                            {d.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => {
                              setSelectedDispute(d);
                              setDisputeStatus(d.status || "under_review");
                              setDisputeResolution(d.resolution || "");
                              setDisputeAdminNotes(d.adminNotes || "");
                            }}
                            className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition cursor-pointer"
                          >
                            Review &amp; Resolve
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

        {/* TAB 5: BOOKINGS */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar size={20} className="text-indigo-600" />
              All Platform Bookings
            </h2>
            {loading ? (
              <p className="text-center py-12 text-slate-500">Loading bookings...</p>
            ) : bookingsList.length === 0 ? (
              <p className="text-center py-12 text-slate-500 text-sm">No bookings recorded.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3.5 px-4 font-bold text-slate-700">Booking ID</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Customer</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Vehicle</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Total</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Status</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {bookingsList.map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-indigo-600">#{b.bookingid}</td>
                        <td className="py-3.5 px-4 text-slate-900 font-medium">{b.customerId?.name || "Customer"}</td>
                        <td className="py-3.5 px-4 text-slate-700">{b.vehicleId ? `${b.vehicleId.brand} ${b.vehicleId.model}` : "Vehicle"}</td>
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

        {/* TAB 6: USERS */}
        {activeTab === "users" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Users size={20} className="text-indigo-600" />
              Manage Users
            </h2>
            {loading ? (
              <p className="text-center py-12 text-slate-500">Loading users...</p>
            ) : usersList.length === 0 ? (
              <p className="text-center py-12 text-slate-500 text-sm">No users found.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3.5 px-4 font-bold text-slate-700">Name</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Email</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Role</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">City</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Status</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Actions</th>
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
                            {u.isActive ? "Active" : "Blocked"}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedUser(u)}
                              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                              title="View Full User Dossier"
                            >
                              <Eye size={13} /> Details
                            </button>
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className={`p-1.5 rounded-lg border text-xs font-bold transition cursor-pointer ${
                                u.isActive
                                  ? "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100"
                                  : "text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100"
                              }`}
                              title={u.isActive ? "Block User" : "Unblock User"}
                            >
                              {u.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                            </button>
                            <button
                              onClick={() => handleDeleteUser(u._id)}
                              className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg border border-transparent transition cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 size={14} />
                            </button>
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

        {/* TAB 7: AGENCIES */}
        {activeTab === "agencies" && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden p-6">
            <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Building2 size={20} className="text-indigo-600" />
              Registered Rental Agencies
            </h2>
            {loading ? (
              <p className="text-center py-12 text-slate-500">Loading agencies...</p>
            ) : agenciesList.length === 0 ? (
              <p className="text-center py-12 text-slate-500 text-sm">No agencies registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50">
                      <th className="py-3.5 px-4 font-bold text-slate-700">Agency Name</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Owner</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">City</th>
                      <th className="py-3.5 px-4 font-bold text-slate-700">Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agenciesList.map((a) => (
                      <tr key={a._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-4 font-bold text-slate-900">{a.agencyName}</td>
                        <td className="py-3.5 px-4 text-slate-600">{a.ownerName || a.userId?.name || "N/A"}</td>
                        <td className="py-3.5 px-4 text-slate-600">{a.city}</td>
                        <td className="py-3.5 px-4 text-slate-600">{a.address || "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DISPUTE RESOLUTION MODAL */}
      {selectedDispute && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <MessageSquare size={20} className="text-indigo-600" />
              Review Dispute #{selectedDispute.disputeId}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Filed by: <strong>{selectedDispute.raisedBy?.name}</strong> ({selectedDispute.raisedBy?.email})
            </p>

            <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-2 mb-4">
              <div>
                <span className="font-bold text-slate-700">Title:</span> {selectedDispute.title}
              </div>
              <div>
                <span className="font-bold text-slate-700">Description:</span>
                <p className="text-slate-600 mt-1 leading-relaxed">{selectedDispute.description}</p>
              </div>
            </div>

            <form onSubmit={handleResolveDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Update Status</label>
                <select
                  value={disputeStatus}
                  onChange={(e) => setDisputeStatus(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                >
                  <option value="open">Open</option>
                  <option value="under_review">Under Review</option>
                  <option value="resolved">Resolved (Approved / Refunded)</option>
                  <option value="dismissed">Dismissed (No Action)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Official Resolution Message</label>
                <textarea
                  rows={3}
                  placeholder="Explain resolution given to customer and owner..."
                  value={disputeResolution}
                  onChange={(e) => setDisputeResolution(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Internal Admin Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Verified photos, approved 50% extra courtesy coupon."
                  value={disputeAdminNotes}
                  onChange={(e) => setDisputeAdminNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDispute(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resolvingDispute}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-60"
                >
                  {resolvingDispute ? "Updating..." : "Save Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* USER DETAILS DOSSIER MODAL */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setSelectedUser(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3.5 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white font-black text-xl flex items-center justify-center shadow-md shadow-indigo-500/20">
                {selectedUser.name?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-900 leading-tight flex items-center gap-2">
                  <span>{selectedUser.name}</span>
                  <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200 uppercase">
                    {selectedUser.role}
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-mono">User ID: #{selectedUser._id}</p>
              </div>
            </div>

            <div className="space-y-4 text-xs">
              {/* Contact Information */}
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2.5">
                <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <UserCheck size={14} className="text-indigo-600" />
                  Contact &amp; Personal Info
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700">
                  <div className="flex items-center gap-2">
                    <Mail size={14} className="text-slate-400 shrink-0" />
                    <span className="font-medium truncate">{selectedUser.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400 shrink-0" />
                    <span className="font-medium">{selectedUser.phone || "Not provided"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-slate-400 shrink-0" />
                    <span className="font-medium">{selectedUser.city || "Not specified"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Activity size={14} className="text-slate-400 shrink-0" />
                    <span>
                      Status:{" "}
                      <strong className={selectedUser.isActive ? "text-emerald-600" : "text-rose-600"}>
                        {selectedUser.isActive ? "Active" : "Blocked"}
                      </strong>
                    </span>
                  </div>
                </div>
                {selectedUser.address && (
                  <div className="pt-1 text-[11px] text-slate-500 border-t border-slate-200/60">
                    <strong>Full Address:</strong> {selectedUser.address}
                  </div>
                )}
              </div>

              {/* Driving License Verification Info */}
              <div className="bg-indigo-50/50 rounded-2xl p-4 border border-indigo-100 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-indigo-950 text-xs uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-indigo-600" />
                    Driving License Verification
                  </h4>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusBadge(selectedUser.license?.status)}`}>
                    {selectedUser.license?.status || "not_uploaded"}
                  </span>
                </div>

                <div className="space-y-1.5 text-slate-700 text-xs">
                  <div>
                    <span className="text-slate-500">License Number:</span>{" "}
                    <strong className="font-mono text-slate-900">{selectedUser.license?.licenseNumber || "N/A"}</strong>
                  </div>

                  {selectedUser.license?.documentUrl ? (
                    <div className="pt-2 flex items-center gap-3">
                      <a
                        href={selectedUser.license.documentUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-indigo-600 font-bold text-xs rounded-xl border border-indigo-200 shadow-xs transition"
                      >
                        <FileText size={13} /> View License Document Photo
                      </a>
                    </div>
                  ) : (
                    <p className="text-[11px] text-slate-500 italic">No document image uploaded yet.</p>
                  )}
                </div>

                {/* License verification action buttons */}
                {selectedUser.license?.status !== "verified" && (
                  <div className="flex gap-2 pt-2 border-t border-indigo-100">
                    <button
                      onClick={() => {
                        handleVerifyLicense(selectedUser._id);
                        setSelectedUser((prev) => ({ ...prev, license: { ...prev.license, status: "verified" } }));
                      }}
                      className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <CheckCircle size={13} /> Approve License
                    </button>
                    <button
                      onClick={() => {
                        handleRejectLicense(selectedUser._id);
                        setSelectedUser((prev) => ({ ...prev, license: { ...prev.license, status: "rejected" } }));
                      }}
                      className="flex-1 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center justify-center gap-1"
                    >
                      <XCircle size={13} /> Reject License
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 pt-5 mt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  handleToggleUserStatus(selectedUser);
                  setSelectedUser((prev) => ({ ...prev, isActive: !prev.isActive }));
                }}
                className={`flex-1 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center justify-center gap-1.5 ${
                  selectedUser.isActive
                    ? "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                    : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                }`}
              >
                {selectedUser.isActive ? <Lock size={14} /> : <Unlock size={14} />}
                <span>{selectedUser.isActive ? "Block Account" : "Unblock Account"}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedUser(null)}
                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default AdminDashboard;
