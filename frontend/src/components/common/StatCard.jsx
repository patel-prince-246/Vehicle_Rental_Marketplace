function StatCard({ label, value, icon: Icon, color = "indigo", subtext }) {
  const colorMap = {
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      valText: "text-slate-900",
    },
    emerald: {
      bg: "bg-emerald-50",
      text: "text-emerald-600",
      valText: "text-emerald-600",
    },
    amber: {
      bg: "bg-amber-50",
      text: "text-amber-600",
      valText: "text-amber-600",
    },
    rose: {
      bg: "bg-rose-50",
      text: "text-rose-600",
      valText: "text-rose-600",
    },
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      valText: "text-slate-900",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      valText: "text-slate-900",
    },
  };

  const scheme = colorMap[color] || colorMap.indigo;

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-4">
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
          {label}
        </span>
        <p className={`text-2xl sm:text-3xl font-bold ${scheme.valText}`}>
          {value}
        </p>
        {subtext && <p className="text-xs text-slate-400">{subtext}</p>}
      </div>

      {Icon && (
        <div className={`w-12 h-12 rounded-xl ${scheme.bg} ${scheme.text} flex items-center justify-center shrink-0`}>
          <Icon size={24} />
        </div>
      )}
    </div>
  );
}

export default StatCard;
