import { Link } from "react-router-dom";
import { Search, ShieldCheck, CalendarCheck, CarFront, ArrowRight } from "lucide-react";
import Navbar from "../components/common/Navbar";
import Footer from "../components/common/Footer";


function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <Navbar />

      <main className="flex-1">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 py-16 sm:py-24 px-4 sm:px-8 border-b border-slate-200">
          <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6 text-center lg:text-left">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-blue-50 border border-blue-200 text-blue-700">
                ⭐ Trusted Car & Bike Rentals
              </span>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight">
                Find Your Perfect <span className="text-blue-600">Ride Today</span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Rent cars, bikes, SUVs, and luxury vehicles from verified hosts and commercial rental agencies with zero hassle.
              </p>

              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  to="/vehicles"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
                >
                  <Search size={18} />
                  <span>Explore Vehicles</span>
                </Link>

                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-slate-800 bg-white hover:bg-slate-50 border border-slate-300 shadow-xs transition-all"
                >
                  <span>List Your Vehicle</span>
                  <ArrowRight size={16} />
                </Link>
              </div>

              {/* Quick Trust Highlights */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-200 text-slate-600">
                <div>
                  <strong className="block text-xl font-black text-slate-900">100%</strong>
                  <span className="text-xs">Verified Hosts</span>
                </div>
                <div>
                  <strong className="block text-xl font-black text-slate-900">0 Deposit</strong>
                  <span className="text-xs">Flexible Terms</span>
                </div>
                <div>
                  <strong className="block text-xl font-black text-slate-900">24/7</strong>
                  <span className="text-xs">Online Support</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-slate-900 aspect-4/3">
                <img
                  src="https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=1000&auto=format&fit=crop&q=80"
                  alt="Rental vehicle"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent flex items-end p-6">
                  <div className="text-white">
                    <p className="text-xs font-semibold text-blue-300 uppercase">Featured Marketplace Fleet</p>
                    <p className="text-lg font-bold">Premium Cars & Bikes across Gujarat</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* WHY CHOOSE US */}
        <section className="py-20 px-4 sm:px-8 max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Why Choose RentWheels?
            </h2>
            <p className="text-slate-600">
              Everything you need for a frictionless and dependable vehicle rental experience.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-6">
                <CarFront size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Wide Vehicle Choices</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Explore budget hatchbacks, premium sedans, SUVs, bikes, and luxury fleets tailored for any road trip.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6">
                <ShieldCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Verified Host Platform</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Every vehicle and driving licence is reviewed by our administration team to guarantee trust and security.
              </p>
            </div>

            <div className="bg-white p-8 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-shadow">
              <div className="w-14 h-14 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-6">
                <CalendarCheck size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Online Booking</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Select your dates, check live vehicle availability, calculate pricing, and book your ride seamlessly.
              </p>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="py-20 px-4 sm:px-8 bg-slate-900 text-white">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
              <span className="text-xs font-bold uppercase tracking-widest text-blue-400">Step-by-Step Guide</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">How RentWheels Works</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-lg mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30">
                  1
                </div>
                <h3 className="text-xl font-bold">Discover & Select</h3>
                <p className="text-slate-400 text-sm">
                  Search through verified cars and bikes filtered by city, type, and daily rental budget.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-lg mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30">
                  2
                </div>
                <h3 className="text-xl font-bold">Pick Schedule & Dates</h3>
                <p className="text-slate-400 text-sm">
                  Choose your rental pickup and return dates with automatic real-time conflict checking.
                </p>
              </div>

              <div className="space-y-4">
                <div className="w-12 h-12 rounded-full bg-blue-600 text-white font-black text-lg mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30">
                  3
                </div>
                <h3 className="text-xl font-bold">Drive & Enjoy</h3>
                <p className="text-slate-400 text-sm">
                  Receive instant confirmation, pick up the keys, and start your journey with full peace of mind.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}

export default Home;