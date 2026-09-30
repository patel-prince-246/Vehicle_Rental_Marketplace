import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Calendar, MapPin, AlertCircle, Car, Clock, CheckCircle } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import StatusBadge from "../components/common/StatusBadge";
import StatCard from "../components/common/StatCard";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function CustomerDashboard() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/bookings/my");
      if (res.data?.success) {
        setBookings(res.data.bookings || []);
      }
    } catch (err) {
      console.error("Error loading customer bookings:", err);
      setError("Unable to load your bookings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancel = async (bookingId) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;

    try {
      setCancellingId(bookingId);
      const res = await api.put(`/bookings/${bookingId}/cancel`, {
        cancellationReason: "Cancelled by customer via dashboard",
      });

      if (res.data?.success) {
        alert("Booking cancelled successfully.");
        fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
    } finally {
      setCancellingId(null);
    }
  };

  const activeBookings = bookings.filter((b) => ["pending", "confirmed"].includes(b.status));
  const completedBookings = bookings.filter((b) => b.status === "completed");

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              My Rental Activity
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, <strong className="text-slate-800">{user?.name}</strong>. Manage your ongoing and past vehicle trips.
            </p>
          </div>

          <Link
            to="/vehicles"
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition"
          >
            Rent New Vehicle
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <StatCard
            label="Total Reservations"
            value={bookings.length}
            icon={Calendar}
            color="indigo"
          />
          <StatCard
            label="Active Trips"
            value={activeBookings.length}
            icon={Clock}
            color="amber"
          />
          <StatCard
            label="Completed Rides"
            value={completedBookings.length}
            icon={CheckCircle}
            color="emerald"
          />
        </div>

        {/* Bookings List */}
        <h2 className="text-xl font-bold text-slate-900 mb-4">Trip History & Reservations</h2>

        {loading ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-slate-500 text-sm">Loading your bookings...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-rose-200 p-6">
            <AlertCircle size={36} className="text-rose-600 mx-auto mb-2" />
            <p className="text-slate-700 text-sm">{error}</p>
          </div>
        ) : bookings.length === 0 ? (
          <EmptyState
            icon={Car}
            title="No Bookings Yet"
            description="You haven't reserved any vehicles yet. Explore our verified fleet and start your journey today!"
            action={
              <Link
                to="/vehicles"
                className="inline-flex px-5 py-2.5 rounded-xl font-semibold text-white bg-indigo-600 hover:bg-indigo-700 shadow-xs transition text-sm"
              >
                Browse Fleet
              </Link>
            }
          />
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => {
              const vehicle = booking.vehicleId || {};
              const vehicleImg =
                vehicle.imageUrl ||
                "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80";

              return (
                <div
                  key={booking._id}
                  className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition"
                >
                  <div className="flex items-center gap-4">
                    <img
                      src={vehicleImg}
                      alt={vehicle.brand || "Vehicle"}
                      className="w-24 h-20 rounded-xl object-cover border border-slate-100 shrink-0"
                    />

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-base font-bold text-slate-900">
                          {vehicle.brand || "Rental"} {vehicle.model || "Vehicle"}
                        </h3>
                        <span className="text-xs px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium">
                          {vehicle.type || "Car"}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-1.5">
                        <MapPin size={13} className="text-slate-400" />
                        <span>{vehicle.city || "Gujarat"}</span>
                        <span>·</span>
                        <span className="font-mono text-slate-400">ID: {booking.bookingid || booking._id}</span>
                      </p>

                      <p className="text-xs font-medium text-slate-600 flex items-center gap-1.5">
                        <Calendar size={13} className="text-indigo-600" />
                        <span>
                          {new Date(booking.startDate).toLocaleDateString()} &rarr; {new Date(booking.endDate).toLocaleDateString()}
                        </span>
                      </p>
                    </div>
                  </div>

                  <div className="w-full md:w-auto flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 gap-2">
                    <div className="text-left md:text-right">
                      <span className="text-xs text-slate-400 block">Total Amount</span>
                      <strong className="text-lg font-black text-indigo-600">₹{booking.totalAmount}</strong>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={booking.status} />
                      <StatusBadge status={booking.paymentStatus} />
                    </div>

                    {["pending", "confirmed"].includes(booking.status) && (
                      <button
                        onClick={() => handleCancel(booking._id)}
                        disabled={cancellingId === booking._id}
                        className="mt-1 text-xs font-semibold text-rose-600 hover:text-rose-700 underline cursor-pointer disabled:opacity-50"
                      >
                        {cancellingId === booking._id ? "Cancelling..." : "Cancel Booking"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default CustomerDashboard;
