function StatusBadge({ status, className = "" }) {
  if (!status) return null;

  const getStyle = (s) => {
    switch (s?.toLowerCase()) {
      case "available":
      case "verified":
      case "active":
      case "paid":
      case "confirmed":
      case "completed":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "pending":
      case "booked":
      case "in_progress":
      case "uploaded":
        return "bg-amber-50 text-amber-700 border-amber-200";
      case "rejected":
      case "cancelled":
      case "inactive":
      case "disabled":
      case "failed":
        return "bg-rose-50 text-rose-700 border-rose-200";
      default:
        return "bg-slate-50 text-slate-700 border-slate-200";
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider border ${getStyle(
        status
      )} ${className}`}
    >
      {status}
    </span>
  );
}

export default StatusBadge;
