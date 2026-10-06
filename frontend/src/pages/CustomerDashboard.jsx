import { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Calendar,
  MapPin,
  AlertCircle,
  Car,
  Clock,
  CheckCircle,
  ShieldCheck,
  UploadCloud,
  User,
  AlertTriangle,
  FileText,
  DollarSign,
  PlusCircle,
  MessageSquare,
  Edit3,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";
import StatusBadge from "../components/common/StatusBadge";
import StatCard from "../components/common/StatCard";
import EmptyState from "../components/common/EmptyState";
import { useAuth } from "../context/AuthContext";
import api from "../services/api";

function CustomerDashboard() {
  const { user, refreshProfile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "bookings";
  const [activeTab, setActiveTab] = useState(initialTab); // "bookings", "disputes", "profile"

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && ["bookings", "disputes", "profile"].includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  const handleTabChange = (tabName) => {
    setActiveTab(tabName);
    setSearchParams({ tab: tabName });
  };

  // Bookings state
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Payment modal state (post-approval payment)
  const [payModalBooking, setPayModalBooking] = useState(null);
  const [payMethod, setPayMethod] = useState("razorpay");
  const [payUpiId, setPayUpiId] = useState("");
  const [payCardNum, setPayCardNum] = useState("");
  const [payCardExp, setPayCardExp] = useState("");
  const [payCardCvv, setPayCardCvv] = useState("");
  const [payCardHolder, setPayCardHolder] = useState("");
  const [payBankName, setPayBankName] = useState("HDFC Bank");
  const [paying, setPaying] = useState(false);
  const [paySuccessMsg, setPaySuccessMsg] = useState("");
  const [payErrorMsg, setPayErrorMsg] = useState("");

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Cancel modal state
  const [selectedBookingForCancel, setSelectedBookingForCancel] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelResult, setCancelResult] = useState(null);

  // Dispute modal state
  const [disputeBooking, setDisputeBooking] = useState(null);
  const [disputeTitle, setDisputeTitle] = useState("");
  const [disputeReason, setDisputeReason] = useState("vehicle_condition");
  const [disputeDesc, setDisputeDesc] = useState("");
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputes, setDisputes] = useState([]);

  // Profile update state
  const [profileName, setProfileName] = useState(user?.name || "");
  const [profilePhone, setProfilePhone] = useState(user?.phone || "");
  const [profileCity, setProfileCity] = useState(user?.city || "");
  const [profileAddress, setProfileAddress] = useState(user?.address || "");
  const [profileLicenseNo, setProfileLicenseNo] = useState(user?.license?.licenseNumber || "");
  const [licenseFile, setLicenseFile] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccessMsg, setProfileSuccessMsg] = useState("");

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await api.get("/bookings/my");
      if (res.data?.success) {
        const list = res.data.bookings || [];
        setBookings(list);

        // Check if payBookingId query param is present to auto-open pay modal
        const payIdParam = searchParams.get("payBookingId");
        if (payIdParam) {
          const match = list.find((b) => b._id === payIdParam || b.bookingid === payIdParam);
          if (match && match.paymentStatus !== "paid") {
            setPayModalBooking(match);
          }
        }
      }
    } catch (err) {
      console.error("Error loading customer bookings:", err);
      setError("Unable to load your bookings.");
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (e) => {
    e.preventDefault();
    if (!payModalBooking) return;
    setPayErrorMsg("");

    // ==========================================
    // 1. OFFICIAL RAZORPAY GATEWAY CHECKOUT
    // ==========================================
    if (payMethod === "razorpay") {
      setPaying(true);
      try {
        const orderRes = await api.post("/payments/create-razorpay-order", {
          bookingId: payModalBooking._id
        });

        if (!orderRes.data?.success) {
          throw new Error(orderRes.data?.message || "Failed to initiate Razorpay order");
        }

        const { orderId, amount, currency, key, isSimulated } = orderRes.data;

        // Load Razorpay script dynamically
        const scriptLoaded = await loadRazorpayScript();

        // If Razorpay SDK loaded and not in mock/simulated fallback
        if (scriptLoaded && window.Razorpay && !isSimulated) {
          const options = {
            key: key,
            amount: amount,
            currency: currency || "INR",
            name: "GearUp Rentals",
            description: `Payment for Booking #${payModalBooking.bookingid}`,
            image: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=200&auto=format&fit=crop&q=80",
            order_id: orderId,
            handler: async function (response) {
              try {
                const verifyRes = await api.post("/payments/verify-razorpay-payment", {
                  bookingId: payModalBooking._id,
                  razorpay_order_id: response.razorpay_order_id || orderId,
                  razorpay_payment_id: response.razorpay_payment_id,
                  razorpay_signature: response.razorpay_signature
                });

                if (verifyRes.data?.success) {
                  setPaySuccessMsg(
                    `Razorpay Payment of ₹${payModalBooking.totalAmount} Verified! Txn: ${response.razorpay_payment_id}`
                  );
                  fetchBookings();
                  setTimeout(() => {
                    setPayModalBooking(null);
                    setPaySuccessMsg("");
                  }, 2500);
                } else {
                  setPayErrorMsg(verifyRes.data?.message || "Payment verification failed.");
                }
              } catch (vErr) {
                setPayErrorMsg(vErr.response?.data?.message || "Payment verification failed.");
              } finally {
                setPaying(false);
              }
            },
            prefill: {
              name: user?.name || "Customer",
              email: user?.email || "customer@example.com",
              contact: user?.phone || "9999999999"
            },
            notes: {
              bookingId: payModalBooking._id,
              bookingReference: payModalBooking.bookingid
            },
            theme: {
              color: "#4f46e5"
            },
            modal: {
              ondismiss: function () {
                setPaying(false);
              }
            }
          };

          const rzpInstance = new window.Razorpay(options);
          rzpInstance.on("payment.failed", function (failResponse) {
            setPayErrorMsg(failResponse.error?.description || "Payment failed at Razorpay gateway.");
            setPaying(false);
          });
          rzpInstance.open();
          return;
        }

        // Seamless Dev / Test Simulation Verification
        const simTxnId = `pay_sim_${Date.now().toString().slice(-8)}`;
        const verifyRes = await api.post("/payments/verify-razorpay-payment", {
          bookingId: payModalBooking._id,
          razorpay_order_id: orderId,
          razorpay_payment_id: simTxnId,
          razorpay_signature: "simulated_signature_verified"
        });

        if (verifyRes.data?.success) {
          setPaySuccessMsg(
            `Razorpay Payment of ₹${payModalBooking.totalAmount} Completed! (Txn ID: ${simTxnId})`
          );
          fetchBookings();
          setTimeout(() => {
            setPayModalBooking(null);
            setPaySuccessMsg("");
            setPayErrorMsg("");
          }, 2000);
        } else {
          setPayErrorMsg(verifyRes.data?.message || "Payment verification failed.");
        }
      } catch (rzpErr) {
        console.error("Razorpay error:", rzpErr);
        setPayErrorMsg(rzpErr.response?.data?.message || rzpErr.message || "Failed to process Razorpay payment.");
      } finally {
        setPaying(false);
      }
      return;
    }

    // ==========================================
    // 2. OTHER PAYMENT METHODS (DIRECT / CASH)
    // ==========================================
    if (payMethod === "upi" && !payUpiId.trim()) {
      setPayErrorMsg("Please enter a valid UPI ID (e.g. name@okhdfcbank).");
      return;
    }
    if (payMethod === "card" && (!payCardNum || !payCardExp || !payCardCvv)) {
      setPayErrorMsg("Please enter complete card details.");
      return;
    }

    setPaying(true);
    try {
      const generatedTxnId =
        payMethod === "cash"
          ? "CASH-PENDING"
          : `TXN-${Date.now().toString().slice(-8)}`;

      const paymentPayload = {
        paymentid: "PAY-" + Date.now().toString().slice(-6),
        bookingId: payModalBooking._id,
        amount: payModalBooking.totalAmount,
        paymentMethod: payMethod,
        transactionId: generatedTxnId,
      };

      const res = await api.post("/payments", paymentPayload);
      if (res.data?.success) {
        setPaySuccessMsg(
          payMethod === "cash"
            ? "Payment mode set to Cash on Pickup. Please pay when collecting keys."
            : `Payment of ₹${payModalBooking.totalAmount} completed successfully! Transaction Ref: ${generatedTxnId}`
        );
        fetchBookings();
        setTimeout(() => {
          setPayModalBooking(null);
          setPaySuccessMsg("");
          setPayErrorMsg("");
        }, 2000);
      }
    } catch (err) {
      setPayErrorMsg(err.response?.data?.message || err.response?.data?.error || "Failed to process payment.");
    } finally {
      setPaying(false);
    }
  };

  const fetchDisputes = async () => {
    try {
      const res = await api.get("/disputes/my-disputes");
      if (res.data?.success) {
        setDisputes(res.data.disputes || []);
      }
    } catch (err) {
      console.error("Error loading disputes:", err);
    }
  };

  useEffect(() => {
    fetchBookings();
    fetchDisputes();
  }, []);

  useEffect(() => {
    if (user) {
      setProfileName(user.name || "");
      setProfilePhone(user.phone || "");
      setProfileCity(user.city || "");
      setProfileAddress(user.address || "");
      setProfileLicenseNo(user.license?.licenseNumber || "");
    }
  }, [user]);

  // Calculate refund tier preview
  const getRefundPreview = (booking) => {
    if (!booking) return { hours: 0, percentage: 0, amount: 0 };
    const now = new Date();
    const start = new Date(booking.startDate);
    const hours = Math.max(0, (start.getTime() - now.getTime()) / (1000 * 60 * 60));
    let percentage = 0;
    if (hours >= 24) percentage = 100;
    else if (hours >= 12) percentage = 50;
    else percentage = 0;

    const amount =
      booking.paymentStatus === "paid"
        ? Math.round((booking.totalAmount * percentage) / 100)
        : 0;

    return {
      hours: Math.round(hours * 10) / 10,
      percentage,
      amount,
    };
  };

  const handleConfirmCancel = async () => {
    if (!selectedBookingForCancel) return;
    setCancelling(true);
    try {
      const res = await api.put(`/bookings/${selectedBookingForCancel._id}/cancel`, {
        cancellationReason: "Cancelled via customer dashboard",
      });

      if (res.data?.success) {
        setCancelResult(res.data);
        fetchBookings();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to cancel booking.");
      setSelectedBookingForCancel(null);
    } finally {
      setCancelling(false);
    }
  };

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    if (!disputeBooking || !disputeTitle || !disputeDesc) return;
    setSubmittingDispute(true);
    try {
      const res = await api.post("/disputes", {
        bookingId: disputeBooking._id,
        title: disputeTitle,
        reason: disputeReason,
        description: disputeDesc,
      });

      if (res.data?.success) {
        alert("Dispute lodged successfully. Our admin team will investigate.");
        setDisputeBooking(null);
        setDisputeTitle("");
        setDisputeDesc("");
        fetchDisputes();
      }
    } catch (err) {
      alert(err.response?.data?.message || "Failed to submit dispute.");
    } finally {
      setSubmittingDispute(false);
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileSuccessMsg("");
    try {
      const formData = new FormData();
      formData.append("name", profileName);
      formData.append("phone", profilePhone);
      formData.append("city", profileCity);
      formData.append("address", profileAddress);
      if (avatarFile) formData.append("avatar", avatarFile);

      await api.put("/users/profile", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // If license file also uploaded
      if (profileLicenseNo || licenseFile) {
        const licData = new FormData();
        if (profileLicenseNo) licData.append("licenseNumber", profileLicenseNo);
        if (licenseFile) licData.append("file", licenseFile);
        await api.post("/users/license", licData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      }

      if (refreshProfile) await refreshProfile();
      setProfileSuccessMsg("Profile details and documents updated successfully!");
    } catch (err) {
      console.error("Profile update error:", err);
      alert(err.response?.data?.message || "Failed to update profile.");
    } finally {
      setSavingProfile(false);
    }
  };

  const activeBookings = bookings.filter((b) => ["pending", "confirmed", "ongoing"].includes(b.status));
  const completedBookings = bookings.filter((b) => ["returned", "completed"].includes(b.status));

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
              Customer Portal
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Welcome back, <strong className="text-slate-800">{user?.name}</strong>. Manage your bookings, license verification, and support disputes.
            </p>
          </div>

          <Link
            to="/vehicles"
            className="px-5 py-2.5 rounded-xl font-bold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 shadow-md shadow-indigo-500/20 transition cursor-pointer"
          >
            + Rent New Vehicle
          </Link>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-8">
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
          <StatCard
            label="Active Disputes"
            value={disputes.filter((d) => d.status === "open").length}
            icon={AlertTriangle}
            color="rose"
          />
        </div>

        {/* 3 Main Customer Dashboard Tabs */}
        <div className="bg-slate-100/80 p-1.5 rounded-2xl border border-slate-200/80 mb-8 flex flex-wrap sm:flex-nowrap gap-2 shadow-inner">
          {/* Button 1: My Reservations */}
          <button
            onClick={() => handleTabChange("bookings")}
            className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl font-bold text-sm cursor-pointer transition-all ${
              activeTab === "bookings"
                ? "bg-white text-indigo-600 shadow-md shadow-slate-200/50 scale-[1.01]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <Calendar size={18} className={activeTab === "bookings" ? "text-indigo-600" : "text-slate-400"} />
            <span>My Reservations</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                activeTab === "bookings"
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {bookings.length}
            </span>
          </button>

          {/* Button 2: Disputes & Claims */}
          <button
            onClick={() => handleTabChange("disputes")}
            className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl font-bold text-sm cursor-pointer transition-all ${
              activeTab === "disputes"
                ? "bg-white text-rose-600 shadow-md shadow-slate-200/50 scale-[1.01]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <AlertTriangle size={18} className={activeTab === "disputes" ? "text-rose-600" : "text-slate-400"} />
            <span>Disputes &amp; Claims</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                activeTab === "disputes"
                  ? "bg-rose-100 text-rose-700"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {disputes.length}
            </span>
          </button>

          {/* Button 3: Profile & License Settings */}
          <button
            onClick={() => handleTabChange("profile")}
            className={`flex-1 min-w-[200px] flex items-center justify-center gap-2.5 py-3 px-5 rounded-xl font-bold text-sm cursor-pointer transition-all ${
              activeTab === "profile"
                ? "bg-white text-emerald-600 shadow-md shadow-slate-200/50 scale-[1.01]"
                : "text-slate-600 hover:text-slate-900 hover:bg-white/60"
            }`}
          >
            <ShieldCheck size={18} className={activeTab === "profile" ? "text-emerald-600" : "text-slate-400"} />
            <span>Profile &amp; License Settings</span>
            <span
              className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                user?.license?.isVerified
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}
            >
              {user?.license?.isVerified ? "Verified" : "Verification"}
            </span>
          </button>
        </div>

        {/* TAB 1: BOOKINGS */}
        {activeTab === "bookings" && (
          <div>
            {loading ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200">
                <div className="w-8 h-8 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-slate-500 text-sm">Loading your reservations...</p>
              </div>
            ) : error ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-rose-200 p-6">
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
                  const getFallback = (t) => {
                    if (t === "Scooter") return "https://images.unsplash.com/photo-1591768575198-88dac53fbd0a?w=800&auto=format&fit=crop&q=80";
                    if (t === "Bike") return "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80";
                    if (t === "SUV") return "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=800&auto=format&fit=crop&q=80";
                    return "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80";
                  };
                  const vehicleImg = vehicle.imageUrl
                    ? (vehicle.imageUrl.startsWith("http") ? vehicle.imageUrl : `http://localhost:5000${vehicle.imageUrl.startsWith("/") ? "" : "/"}${vehicle.imageUrl}`)
                    : getFallback(vehicle.type);

                  return (
                    <div
                      key={booking._id}
                      className="bg-white rounded-3xl border border-slate-200/90 p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:shadow-md transition"
                    >
                      <div className="flex items-center gap-4">
                        <img
                          src={vehicleImg}
                          alt={vehicle.brand || "Vehicle"}
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = getFallback(vehicle.type);
                          }}
                          className="w-24 h-20 rounded-2xl object-cover border border-slate-100 shrink-0"
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
                            <span className="font-mono text-indigo-600 font-semibold">#{booking.bookingid || booking._id}</span>
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
                          {booking.refundAmount > 0 && (
                            <span className="block text-[11px] text-emerald-600 font-bold">
                              Refund: ₹{booking.refundAmount}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <StatusBadge status={booking.status} />
                          <StatusBadge status={booking.paymentStatus} />
                        </div>

                        <div className="flex flex-wrap items-center justify-end gap-2 mt-2">
                          {booking.status === "confirmed" && booking.paymentStatus !== "paid" && (
                            <button
                              onClick={() => {
                                setPayModalBooking(booking);
                                setPaySuccessMsg("");
                              }}
                              className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-95 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-500/20 transition-all flex items-center gap-1.5 cursor-pointer animate-pulse"
                            >
                              <CreditCard size={14} />
                              <span>Pay Now (₹{booking.totalAmount})</span>
                            </button>
                          )}

                          {booking.status === "pending" && (
                            <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                              ⏳ Awaiting Host Approval
                            </span>
                          )}

                          {["pending", "confirmed"].includes(booking.status) && (
                            <button
                              onClick={() => setSelectedBookingForCancel(booking)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-3 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            onClick={() => setDisputeBooking(booking)}
                            className="text-xs font-semibold text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition cursor-pointer flex items-center gap-1"
                          >
                            <MessageSquare size={13} />
                            <span>Issue</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: DISPUTES */}
        {activeTab === "disputes" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
              <h2 className="text-lg font-bold text-slate-900">Your Support Disputes &amp; Claims</h2>
            </div>

            {disputes.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                <CheckCircle size={40} className="text-emerald-500 mx-auto mb-3" />
                <h3 className="font-bold text-slate-800">No active disputes</h3>
                <p className="text-xs text-slate-500 mt-1">
                  Everything looks peaceful! You can file an issue on any booking from the Reservations tab.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {disputes.map((disp) => (
                  <div key={disp._id} className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-3">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600">#{disp.disputeId}</span>
                          <span className="text-xs uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                            {disp.reason.replace("_", " ")}
                          </span>
                        </div>
                        <h4 className="text-base font-bold text-slate-900 mt-1">{disp.title}</h4>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        disp.status === "resolved"
                          ? "bg-emerald-100 text-emerald-800"
                          : disp.status === "dismissed"
                          ? "bg-slate-100 text-slate-700"
                          : "bg-amber-100 text-amber-800"
                      }`}>
                        {disp.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-2xl">
                      {disp.description}
                    </p>

                    {disp.resolution && (
                      <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl text-xs text-emerald-900">
                        <strong className="block mb-1">Admin Resolution:</strong>
                        {disp.resolution}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROFILE & LICENSE */}
        {activeTab === "profile" && (
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs max-w-3xl">
            <h2 className="text-lg font-bold text-slate-900 mb-1 flex items-center gap-2">
              <User size={20} className="text-indigo-600" />
              Profile Details &amp; Compliance (SRS 3.1.1.3)
            </h2>
            <p className="text-xs text-slate-500 mb-6">
              Manage your personal information and verified driving license for rental authentication.
            </p>

            {profileSuccessMsg && (
              <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle size={16} />
                <span>{profileSuccessMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Phone Number *</label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">City *</label>
                  <input
                    type="text"
                    value={profileCity}
                    onChange={(e) => setProfileCity(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1.5">Full Street Address</label>
                  <input
                    type="text"
                    placeholder="e.g. 102 Green Avenue, Vadodara"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* License Section */}
              <div className="border-t border-slate-200 pt-5 space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">Driving License Verification</h3>
                    <p className="text-xs text-slate-500">Required to book cars or bikes.</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    user?.license?.status === "verified"
                      ? "bg-emerald-100 text-emerald-800"
                      : user?.license?.status === "uploaded"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-amber-100 text-amber-800"
                  }`}>
                    {user?.license?.status ? user.license.status.toUpperCase() : "NOT UPLOADED"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">License Number</label>
                    <input
                      type="text"
                      placeholder="e.g. GJ-06-20230012345"
                      value={profileLicenseNo}
                      onChange={(e) => setProfileLicenseNo(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-indigo-600 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">Upload Document (Image / PDF)</label>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setLicenseFile(e.target.files[0])}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingProfile}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:opacity-95 text-white font-bold text-sm rounded-xl shadow-md shadow-indigo-500/20 transition cursor-pointer disabled:opacity-60"
              >
                {savingProfile ? "Saving Changes..." : "Save Profile & Documents"}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* TIERED CANCELLATION MODAL (SRS 3.1.3.4 & 3.1.4.2) */}
      {selectedBookingForCancel && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
            {cancelResult ? (
              <div className="text-center space-y-4">
                <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Booking Cancelled</h3>
                <p className="text-xs text-slate-600">{cancelResult.refundDetails?.explanation}</p>
                <div className="bg-slate-50 p-4 rounded-2xl text-xs space-y-2 text-left">
                  <div className="flex justify-between">
                    <span>Refund Percentage:</span>
                    <strong>{cancelResult.refundDetails?.refundPercentage}%</strong>
                  </div>
                  <div className="flex justify-between border-t border-slate-200 pt-2 text-sm font-bold text-emerald-600">
                    <span>Refund Processed:</span>
                    <span>₹{cancelResult.refundDetails?.refundAmount}</span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setSelectedBookingForCancel(null);
                    setCancelResult(null);
                  }}
                  className="w-full py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl"
                >
                  Done
                </button>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-black text-slate-900 mb-2 flex items-center gap-2">
                  <AlertTriangle size={20} className="text-rose-600" />
                  Confirm Cancellation
                </h3>
                <p className="text-xs text-slate-600 mb-4">
                  Please review the tiered cancellation refund for booking #{selectedBookingForCancel.bookingid}:
                </p>

                {(() => {
                  const preview = getRefundPreview(selectedBookingForCancel);
                  return (
                    <div className="bg-indigo-50/70 border border-indigo-200 rounded-2xl p-4 text-xs space-y-2 mb-5">
                      <div className="flex justify-between text-slate-700">
                        <span>Time until rental start:</span>
                        <strong className="font-mono">{preview.hours} hrs</strong>
                      </div>
                      <div className="flex justify-between text-slate-700">
                        <span>Applicable Tier:</span>
                        <strong className="text-indigo-600">{preview.percentage}% Refund</strong>
                      </div>
                      <div className="flex justify-between border-t border-indigo-200/60 pt-2 font-bold text-slate-900">
                        <span>Refund Amount:</span>
                        <span className="text-emerald-600 font-black">₹{preview.amount}</span>
                      </div>
                    </div>
                  );
                })()}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedBookingForCancel(null)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                  >
                    Keep Booking
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    disabled={cancelling}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-60"
                  >
                    {cancelling ? "Processing..." : "Confirm Cancel"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* DISPUTE CREATION MODAL */}
      {disputeBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl">
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <MessageSquare size={20} className="text-indigo-600" />
              Report an Issue / Dispute
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Booking: #{disputeBooking.bookingid || disputeBooking._id}
            </p>

            <form onSubmit={handleRaiseDispute} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Issue Category *</label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                >
                  <option value="vehicle_condition">Vehicle Condition / Maintenance Issue</option>
                  <option value="late_return">Return / Handover Issue</option>
                  <option value="payment_issue">Payment or Deposit Concern</option>
                  <option value="cancellation_conflict">Cancellation / Refund Conflict</option>
                  <option value="damage_claim">Damage Assessment Claim</option>
                  <option value="other">Other Inquiry</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Subject Title *</label>
                <input
                  type="text"
                  placeholder="e.g. AC was not working during trip"
                  value={disputeTitle}
                  onChange={(e) => setDisputeTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description of the Issue *</label>
                <textarea
                  rows={4}
                  placeholder="Provide clear details regarding what occurred..."
                  value={disputeDesc}
                  onChange={(e) => setDisputeDesc(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-indigo-600 focus:bg-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setDisputeBooking(null)}
                  className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs disabled:opacity-60"
                >
                  {submittingDispute ? "Submitting..." : "Submit Dispute"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PAYMENT CHECKOUT MODAL (POST-APPROVAL) */}
      {payModalBooking && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative">
            <h3 className="text-lg font-black text-slate-900 mb-1 flex items-center gap-2">
              <CreditCard size={22} className="text-emerald-600" />
              Complete Payment for Reservation
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Booking: <span className="font-mono font-bold text-indigo-600">#{payModalBooking.bookingid}</span> · Total Due: <strong className="text-slate-900">₹{payModalBooking.totalAmount}</strong>
            </p>

            {paySuccessMsg && (
              <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 size={16} />
                <span>{paySuccessMsg}</span>
              </div>
            )}

            {payErrorMsg && (
              <div className="mb-4 p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle size={16} className="shrink-0 text-rose-600" />
                <span>{payErrorMsg}</span>
              </div>
            )}

            {!paySuccessMsg && (
              <form onSubmit={handleProcessPayment} className="space-y-4">
                {/* Method selector */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-2">Select Payment Method</label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayMethod("razorpay")}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition relative overflow-hidden ${
                        payMethod === "razorpay"
                          ? "border-indigo-600 bg-indigo-50/70 text-indigo-950 font-bold ring-2 ring-indigo-500/20"
                          : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xs block font-bold text-indigo-700">⚡ Razorpay</span>
                      <span className="text-[10px] text-slate-500 block leading-tight mt-0.5">UPI, Cards, NetBank</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayMethod("upi")}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                        payMethod === "upi" ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold" : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xs block">UPI / QR</span>
                      <span className="text-[10px] text-slate-400">GPay, PhonePe</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayMethod("card")}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                        payMethod === "card" ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold" : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xs block">Cards</span>
                      <span className="text-[10px] text-slate-400">Visa / Master</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayMethod("cash")}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition ${
                        payMethod === "cash" ? "border-emerald-600 bg-emerald-50 text-emerald-900 font-bold" : "border-slate-200 text-slate-600 hover:border-slate-300"
                      }`}
                    >
                      <span className="text-xs block">Cash</span>
                      <span className="text-[10px] text-slate-400">On Pickup</span>
                    </button>
                  </div>
                </div>

                {/* Sub Inputs */}
                {payMethod === "razorpay" && (
                  <div className="bg-gradient-to-br from-indigo-50/70 to-blue-50/50 p-3.5 rounded-2xl border border-indigo-100 space-y-2 text-xs text-indigo-950">
                    <div className="flex items-center justify-between">
                      <span className="font-bold flex items-center gap-1.5 text-indigo-900">
                        <ShieldCheck size={16} className="text-indigo-600" />
                        Razorpay Secure Checkout
                      </span>
                      <span className="bg-indigo-100 text-indigo-700 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md">
                        Instant Verification
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Click the button below to complete payment via Razorpay. Supports <strong>UPI QR, Google Pay, PhonePe, Paytm, all Credit/Debit Cards & Net Banking</strong>.
                    </p>
                  </div>
                )}

                {payMethod === "upi" && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">UPI ID / VPA</label>
                    <input
                      type="text"
                      placeholder="e.g. yourname@okhdfcbank"
                      value={payUpiId}
                      onChange={(e) => setPayUpiId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                )}

                {payMethod === "card" && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="Name on card"
                        value={payCardHolder}
                        onChange={(e) => setPayCardHolder(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                        <input
                          type="text"
                          maxLength={19}
                          placeholder="4532 •••• •••• 8921"
                          value={payCardNum}
                          onChange={(e) => setPayCardNum(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Expiry / CVV</label>
                        <div className="flex gap-1">
                          <input
                            type="text"
                            placeholder="MM/YY"
                            maxLength={5}
                            value={payCardExp}
                            onChange={(e) => setPayCardExp(e.target.value)}
                            className="w-1/2 px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs text-center focus:outline-none focus:border-emerald-600"
                          />
                          <input
                            type="password"
                            placeholder="CVV"
                            maxLength={4}
                            value={payCardCvv}
                            onChange={(e) => setPayCardCvv(e.target.value)}
                            className="w-1/2 px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs text-center focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {payMethod === "online" && (
                  <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-700">Select Bank</label>
                    <select
                      value={payBankName}
                      onChange={(e) => setPayBankName(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                    >
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="State Bank of India">State Bank of India (SBI)</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    </select>
                  </div>
                )}

                {payMethod === "cash" && (
                  <div className="bg-amber-50 p-3 rounded-2xl border border-amber-200 text-amber-900 text-xs">
                    You can pay <strong>₹{payModalBooking.totalAmount} cash</strong> directly to the host upon key handover.
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setPayModalBooking(null)}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={paying}
                    className={`flex-1 py-3 text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition cursor-pointer disabled:opacity-60 flex items-center justify-center gap-2 ${
                      payMethod === "razorpay"
                        ? "bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:opacity-95 shadow-indigo-500/25"
                        : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20"
                    }`}
                  >
                    {paying
                      ? "Processing Payment..."
                      : payMethod === "razorpay"
                      ? `Pay with Razorpay • ₹${payModalBooking.totalAmount}`
                      : payMethod === "cash"
                      ? `Confirm Cash on Pickup • ₹${payModalBooking.totalAmount}`
                      : `Pay ₹${payModalBooking.totalAmount}`}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}

export default CustomerDashboard;
