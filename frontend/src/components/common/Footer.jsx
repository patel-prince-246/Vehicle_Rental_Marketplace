import { Link } from "react-router-dom";
import { Car, ShieldCheck, Mail, Phone, MapPin, Heart } from "lucide-react";

function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 pt-16 pb-12 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          <div className="space-y-4 md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 text-white">
              <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                <Car size={22} />
              </div>
              <span className="text-xl font-bold tracking-tight">DriveHub</span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Premier verified peer-to-peer and commercial fleet rental marketplace in Gujarat.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <ShieldCheck size={16} /> Verified Owners & Instant Booking
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Marketplace</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/vehicles" className="hover:text-white transition">All Vehicles</Link></li>
              <li><Link to="/vehicles?type=SUV" className="hover:text-white transition">SUVs & Family Cars</Link></li>
              <li><Link to="/vehicles?type=Luxury" className="hover:text-white transition">Luxury Fleet</Link></li>
              <li><Link to="/vehicles?type=Bike" className="hover:text-white transition">Bikes & Scooters</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Partners & Portals</h3>
            <ul className="space-y-2.5 text-sm">
              <li><Link to="/register" className="hover:text-white transition">List Your Car (Owner)</Link></li>
              <li><Link to="/register" className="hover:text-white transition">Commercial Agency Fleet</Link></li>
              <li><Link to="/login" className="hover:text-white transition">Partner Login</Link></li>
              <li><Link to="/customer/dashboard" className="hover:text-white transition">Customer Portal</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">Contact & Support</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <MapPin size={16} className="text-indigo-400 shrink-0" />
                <span>Vadodara · Ahmedabad · Surat</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone size={16} className="text-indigo-400 shrink-0" />
                <span>+91 98765 43210</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={16} className="text-indigo-400 shrink-0" />
                <span>support@drivehub.in</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} DriveHub Vehicle Rental Marketplace. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with <Heart size={12} className="text-rose-500 fill-rose-500" /> for SEM-V Project
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
