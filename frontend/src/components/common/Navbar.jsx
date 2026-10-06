import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Car,
  User,
  LogOut,
  LayoutDashboard,
  Shield,
  Building2,
  Bell,
  Check,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get("/notifications/my");
      if (res.data?.success) {
        const notifs = res.data.notifications || [];
        setNotifications(notifs);
        setUnreadCount(notifs.filter((n) => !n.isRead).length);
      }
    } catch (err) {
      // Quiet fail if not logged in
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, [user]);

  // Click outside to close notification dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setUnreadCount(0);
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  const handleNotificationClick = async (notif) => {
    // Mark as read in backend
    if (!notif.isRead) {
      try {
        await api.patch(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Failed to mark notification read:", err);
      }
    }

    setShowNotifications(false);

    // Determine target link
    let targetLink = notif.link;
    if (!targetLink) {
      const type = (notif.type || "").toLowerCase();
      if (type.includes("booking")) {
        if (user?.role === "owner") targetLink = "/owner/dashboard?tab=bookings";
        else if (user?.role === "agency") targetLink = "/agency/dashboard?tab=bookings";
        else if (user?.role === "admin") targetLink = "/admin/dashboard?tab=bookings";
        else targetLink = "/customer/dashboard?tab=bookings";
      } else if (type.includes("license")) {
        targetLink = user?.role === "admin" ? "/admin/dashboard?tab=licenses" : "/customer/dashboard?tab=profile";
      } else if (type.includes("vehicle")) {
        if (user?.role === "owner") targetLink = "/owner/dashboard?tab=vehicles";
        else if (user?.role === "agency") targetLink = "/agency/dashboard?tab=vehicles";
        else if (user?.role === "admin") targetLink = "/admin/dashboard?tab=vehicles";
      } else if (type.includes("dispute")) {
        targetLink = user?.role === "admin" ? "/admin/dashboard?tab=disputes" : "/customer/dashboard?tab=disputes";
      } else {
        targetLink = getDashboardPath();
      }
    }

    if (targetLink) {
      navigate(targetLink);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const getDashboardPath = () => {
    if (!user) return "/login";
    switch (user.role) {
      case "owner":
        return "/owner/dashboard";
      case "agency":
        return "/agency/dashboard";
      case "admin":
        return "/admin/dashboard";
      default:
        return "/customer/dashboard";
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-sm group-hover:bg-indigo-700 transition">
              <Car size={22} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-indigo-900 bg-clip-text text-transparent">
              DriveHub
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
              Home
            </Link>
            <Link to="/vehicles" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
              Explore Fleet
            </Link>
            {user && (
              <Link to={getDashboardPath()} className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition">
                Dashboard
              </Link>
            )}
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-3">
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                  <button
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
                    title="Notifications"
                  >
                    <Bell size={18} />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 w-4 h-4 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-pulse">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notification Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl border border-slate-200 shadow-2xl p-4 z-50">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold text-slate-900">Live Notifications</h4>
                          {unreadCount > 0 && (
                            <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-bold">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={handleMarkAllAsRead}
                            className="text-[11px] font-bold text-indigo-600 hover:underline cursor-pointer"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 py-2">
                        {notifications.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-400">
                            No notifications yet.
                          </div>
                        ) : (
                          notifications.slice(0, 10).map((notif) => (
                            <div
                              key={notif._id}
                              onClick={() => handleNotificationClick(notif)}
                              className={`py-2.5 px-3 rounded-2xl text-xs space-y-1 transition cursor-pointer hover:bg-slate-100/80 ${
                                notif.isRead ? "text-slate-600 bg-white" : "bg-indigo-50/70 text-slate-900 font-medium"
                              }`}
                            >
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-[10px] uppercase font-bold text-indigo-600">
                                  {notif.title || notif.type.replace(/_/g, " ")}
                                </span>
                                <span className="text-[10px] text-slate-400 shrink-0">
                                  {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="leading-relaxed text-xs">{notif.message}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <Link
                  to={getDashboardPath()}
                  className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold uppercase tracking-wider transition"
                >
                  {user.role === "admin" && <Shield size={14} className="text-indigo-600" />}
                  {user.role === "agency" && <Building2 size={14} className="text-indigo-600" />}
                  {user.role === "owner" && <LayoutDashboard size={14} className="text-indigo-600" />}
                  {user.role === "customer" && <User size={14} className="text-indigo-600" />}
                  <span>{user.name} ({user.role})</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition cursor-pointer"
                  title="Logout"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-indigo-600 transition"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition shadow-xs"
                >
                  Register
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
