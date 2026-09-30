import { Link } from "react-router-dom";
import { MapPin, ShieldCheck, Star } from "lucide-react";
import StatusBadge from "../common/StatusBadge";

function VehicleCard({ vehicle }) {
  if (!vehicle) return null;

  const fallbackImage =
    "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=800&auto=format&fit=crop&q=80";

  return (
    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition group flex flex-col justify-between">
      <div>
        <div className="relative overflow-hidden aspect-16/10 bg-slate-100">
          <img
            src={vehicle.imageUrl || fallbackImage}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
          />
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 items-end">
            <StatusBadge status={vehicle.status || "available"} />
            {vehicle.verificationStatus === "verified" && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/90 text-white backdrop-blur-xs">
                <ShieldCheck size={12} /> Verified
              </span>
            )}
          </div>
          <div className="absolute bottom-3 left-3">
            <span className="px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-xs font-semibold backdrop-blur-xs">
              {vehicle.type || "Car"}
            </span>
          </div>
        </div>

        <div className="p-5">
          <div className="flex justify-between items-start gap-2 mb-1">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-indigo-600 transition">
              {vehicle.brand} {vehicle.model}
            </h3>
            <div className="text-right shrink-0">
              <span className="text-lg font-extrabold text-indigo-600">
                ₹{vehicle.pricePerDay ?? vehicle.price}
              </span>
              <span className="text-xs text-slate-400 block font-normal">/ day</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-3">
            <MapPin size={14} className="text-slate-400 shrink-0" />
            <span>{vehicle.city || "Gujarat"}</span>
            {vehicle.year && <span>· {vehicle.year}</span>}
          </div>

          {vehicle.description && (
            <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
              {vehicle.description}
            </p>
          )}
        </div>
      </div>

      <div className="px-5 pb-5 pt-0">
        <Link
          to={`/vehicles/${vehicle._id || vehicle.vehicleid}`}
          className="w-full inline-flex items-center justify-center py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-indigo-600 text-white text-sm font-medium transition shadow-xs"
        >
          View Details & Book
        </Link>
      </div>
    </div>
  );
}

export default VehicleCard;
