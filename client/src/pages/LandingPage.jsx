import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Calendar, Users, ArrowRight, BedDouble, Star, CheckCircle, 
  MapPin, Phone, Mail, ShieldCheck, Sparkles, X, ChevronRight,
  Utensils, Compass, Award, Clock
} from 'lucide-react';

export default function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [roomTypes, setRoomTypes] = useState([]);
  const [allPhysicalRooms, setAllPhysicalRooms] = useState([]);
  const [servicesCatalog, setServicesCatalog] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  // Booking Widget State
  const [arriveDate, setArriveDate] = useState(new Date().toISOString().split('T')[0]);
  const [departureDate, setDepartureDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [guestCount, setGuestCount] = useState(2);

  // Live Availability Search Results & Modal State
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [selectedRoomType, setSelectedRoomType] = useState(null);
  const [availableRooms, setAvailableRooms] = useState([]);
  const [selectedPhysicalRoom, setSelectedPhysicalRoom] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  useEffect(() => {
    fetchLandingData();
  }, []);

  const fetchLandingData = async () => {
    setLoading(true);
    try {
      const [tRes, sRes, srvRes, fRes, rRes] = await Promise.all([
        fetch('/api/rooms/types'),
        fetch('/api/settings'),
        fetch('/api/services/catalog'),
        fetch('/api/feedback'),
        fetch('/api/rooms')
      ]);

      const [tData, sData, srvData, fData, rData] = await Promise.all([
        tRes.json(), sRes.json(), srvRes.json(), fRes.json(), rRes.json()
      ]);

      setRoomTypes(Array.isArray(tData) ? tData : []);
      if (sData) setSettings(sData);
      setServicesCatalog(Array.isArray(srvData) ? srvData.slice(0, 4) : []);
      setFeedbacks(Array.isArray(fData) ? fData.slice(0, 3) : []);
      setAllPhysicalRooms(Array.isArray(rData) ? rData : []);
    } catch (err) {
      console.error('Landing data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if physical rooms for a given roomType are available
  const isRoomTypeBooked = (typeId) => {
    // If live search performed, check searchResults
    if (searchResults !== null) {
      const matched = searchResults.filter(r => (r.roomType?._id || r.roomType) === typeId);
      return matched.length === 0;
    }

    // Otherwise check all physical rooms created for this room type
    const roomsOfType = allPhysicalRooms.filter(r => (r.roomType?._id || r.roomType) === typeId);
    if (roomsOfType.length === 0) return false;

    // If all rooms of this type are Occupied, Reserved, Cleaning or Maintenance -> Booked
    const availableRoomsCount = roomsOfType.filter(r => r.status === 'Available').length;
    return availableRoomsCount === 0;
  };

  // Live Availability Search directly querying MongoDB
  const handleBookingSearch = async (e) => {
    if (e) e.preventDefault();
    setSearchLoading(true);
    setSearchResults(null);
    try {
      const res = await fetch(`/api/bookings/check-availability?checkInDate=${arriveDate}&checkOutDate=${departureDate}`);
      const data = await res.json();
      const roomsList = Array.isArray(data) ? data : [];
      setAvailableRooms(roomsList);
      setSearchResults(roomsList);

      // Scroll to suites section smoothly
      const suitesElem = document.getElementById('suites-section');
      if (suitesElem) {
        suitesElem.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err) {
      alert('Availability check failed: ' + err.message);
    } finally {
      setSearchLoading(false);
    }
  };

  // Select Suite category for reservation modal
  const handleSelectRoomCard = async (type) => {
    setSelectedRoomType(type);
    setBookingSuccess(null);
    try {
      const res = await fetch(`/api/bookings/check-availability?checkInDate=${arriveDate}&checkOutDate=${departureDate}&roomType=${type._id}`);
      const data = await res.json();
      const roomsList = Array.isArray(data) ? data : [];
      setAvailableRooms(roomsList);
      if (roomsList.length > 0) {
        setSelectedPhysicalRoom(roomsList[0]);
      } else {
        setSelectedPhysicalRoom(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Confirm Reservation and persist to MongoDB
  const handleConfirmReservation = async () => {
    if (!user) {
      alert('Please sign in or register to complete your reservation.');
      navigate('/login');
      return;
    }

    if (!selectedPhysicalRoom) {
      alert('No available room allocated for this category on the chosen dates.');
      return;
    }

    setBookingLoading(true);
    try {
      const token = localStorage.getItem('luxurystay_token');
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          roomId: selectedPhysicalRoom._id,
          checkInDate: arriveDate,
          checkOutDate: departureDate,
          numberOfGuests: guestCount,
          specialRequests: 'Booked via Online Suite Reservation.'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Booking failed');

      setBookingSuccess(data);
      fetchLandingData();
    } catch (err) {
      alert(err.message);
    } finally {
      setBookingLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-luxury-muted-blue selection:text-stone-950">

      {/* 1. HERO SECTION - FULLSCREEN VIDEO BACKGROUND */}
      <section className="relative min-h-[680px] lg:min-h-[750px] flex flex-col justify-end items-start px-8 sm:px-16 pb-0 overflow-hidden">

        {/* Background Image - Reliable Local Asset */}
        <img
          src="https://img.magnific.com/free-photo/luxury-classic-modern-bedroom-suite-hotel_105762-1787.jpg?semt=ais_hybrid&w=740&q=80"
          alt="Luxury Resort Hero"
          className="absolute inset-0 w-full h-full object-cover z-0"
        />
        {/* Gradient Overlay — dark on left/bottom, transparent right */}
        <div className="absolute inset-0 z-10"
          style={{ background: 'linear-gradient(to right, rgba(119, 119, 120, 0.78) 0%, rgba(9,9,11,0.45) 55%, rgba(9,9,11,0.10) 100%), linear-gradient(to top, rgba(9,9,11,0.90) 0%, transparent 50%)' }}
        />

        {/* Hero Text — left aligned, large, clean */}
        <div className="relative z-20 max-w-2xl mb-16 space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-900/70 border border-luxury-muted-blue/40 text-luxury-muted-blue text-[10px] font-semibold tracking-[0.25em] uppercase font-mono backdrop-blur-sm">
            <Sparkles className="w-3 h-3" />
            <span>{settings?.hotelName || 'LuxuryStay Grand Resort & Spa'}</span>
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-serif font-bold text-white leading-[1.05] tracking-tight drop-shadow-lg">
            COME FOR THE <br />
            <em className="not-italic text-luxury-muted-blue">LUXURY,</em> STAY FOR<br />
            THE <em className="font-serif italic text-stone-200">EXPERIENCE</em>
          </h1>

          <p className="text-sm sm:text-base text-luxury-muted-blue font-serif italic leading-relaxed max-w-lg">
            "{settings?.tagline || 'Where timeless coastal splendor meets bespoke sovereign hospitality.'}"
          </p>

          <div className="flex items-center gap-3 pt-2">
            <a href="#suites-section"
              className="px-6 py-3 bg-luxury-muted-blue hover:bg-luxury-light-frost text-stone-950 font-bold rounded-2xl text-xs uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center gap-2"
            >
              Explore Suites <ArrowRight className="w-4 h-4" />
            </a>
  
<a
  href="#suites-section"
  className="px-6 py-3 bg-stone-200 hover:bg-stone-800 text-stone-800 hover:text-stone-200 border border-stone-700 font-bold rounded-2xl text-xs uppercase tracking-widest backdrop-blur-sm transition-all"
>


              Check Availability
            </a>
          </div>
        </div>

        {/* Booking Bar at bottom of hero */}
        <div className="relative z-20 w-full bg-stone-950/80 backdrop-blur-xl border-t border-stone-800">
          <form
            onSubmit={handleBookingSearch}
            className="max-w-7xl mx-auto px-6 py-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-center"
          >
            <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 flex flex-col text-left hover:border-luxury-muted-blue/40 transition">
              <label className="text-[10px] font-bold text-luxury-muted-blue uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5" /> Check-In
              </label>
              <input
                type="date"
                value={arriveDate}
                onChange={e => setArriveDate(e.target.value)}
                required
                className="bg-transparent font-semibold text-stone-100 text-sm focus:outline-none mt-1 cursor-pointer"
              />
            </div>

            <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 flex flex-col text-left hover:border-luxury-muted-blue/40 transition">
              <label className="text-[10px] font-bold text-luxury-muted-blue uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Calendar className="w-3.5 h-3.5" /> Check-Out
              </label>
              <input
                type="date"
                value={departureDate}
                onChange={e => setDepartureDate(e.target.value)}
                required
                className="bg-transparent font-semibold text-stone-100 text-sm focus:outline-none mt-1 cursor-pointer"
              />
            </div>

            <div className="bg-stone-900/80 p-3 rounded-2xl border border-stone-800 flex flex-col text-left hover:border-luxury-muted-blue/40 transition">
              <label className="text-[10px] font-bold text-luxury-muted-blue uppercase tracking-widest flex items-center gap-1.5 font-mono">
                <Users className="w-3.5 h-3.5" /> Guests
              </label>
              <select
                value={guestCount}
                onChange={e => setGuestCount(Number(e.target.value))}
                className="bg-stone-950 font-semibold text-stone-100 text-sm focus:outline-none mt-1 cursor-pointer"
              >
                <option value={1}>1 Guest</option>
                <option value={2}>2 Guests (King Suite)</option>
                <option value={3}>3 Guests (Deluxe)</option>
                <option value={4}>4 Guests (Family)</option>
                <option value={6}>6 Guests (Presidential)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={searchLoading}
              className="py-3.5 px-6 rounded-2xl font-bold text-stone-950 text-xs uppercase tracking-widest bg-luxury-muted-blue hover:bg-luxury-light-frost active:scale-[0.98] transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <span>{searchLoading ? 'Searching...' : 'Check Availability'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      </section>

      {/* SEARCH RESULTS BANNER */}
      {searchResults !== null && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-8">
          <div className="bg-stone-900 border border-luxury-muted-blue/40 rounded-3xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-luxury-muted-blue/20 border border-luxury-muted-blue/40 flex items-center justify-center text-luxury-muted-blue">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-luxury-muted-blue uppercase tracking-wider font-mono">Live Search Results</p>
                <h4 className="text-sm sm:text-base font-semibold text-stone-100">
                  {searchResults.length > 0
                    ? `${searchResults.length} luxury units available from ${arriveDate} to ${departureDate}`
                    : `No available rooms directly matching these dates. Showing all suite categories.`}
                </h4>
              </div>
            </div>
            <button
              onClick={() => setSearchResults(null)}
              className="text-xs font-semibold text-stone-300 hover:text-luxury-muted-blue underline transition"
            >
              Reset Search Filter
            </button>
          </div>
        </div>
      )}

      {/* 3. SIGNATURE SUITES & RESIDENCES SHOWCASE */}
      <section id="suites-section" className="py-20 sm:py-24 px-6 sm:px-10 relative">
        <div className="max-w-7xl mx-auto space-y-14">

          {/* Section Header */}
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-luxury-muted-blue bg-luxury-muted-blue/10 px-4 py-1.5 rounded-full border border-luxury-muted-blue/30 font-mono inline-block">
              Sanctuary of Luxury
            </span>
            <h2 className="text-3xl sm:text-5xl font-serif font-bold text-white tracking-wide">
              SIGNATURE SUITES & RESIDENCES
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 font-serif italic">
              Each private haven offers oceanfront vistas, plush amenities, and modern intuitive luxuries.
            </p>
          </div>

          {/* Dynamic Responsive Grid */}
          {loading ? (
            <div className="text-center py-20 text-luxury-muted-blue font-serif animate-pulse">
              Loading luxury suites...
            </div>
          ) : roomTypes.length === 0 ? (
            <div className="text-center py-16 text-stone-400 bg-stone-900 rounded-3xl border border-stone-800">
              No suites currently registered. Please add room types in the portal.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {roomTypes.map((type) => {
                const booked = isRoomTypeBooked(type._id);
                return (
                  <div
                    key={type._id}
                    className="bg-stone-900/90 rounded-3xl overflow-hidden border border-stone-800 shadow-xl hover:shadow-2xl hover:border-luxury-muted-blue/50 transition-all duration-300 flex flex-col justify-between group"
                  >
                    {/* Room Image */}
                    <div className="h-64 w-full overflow-hidden relative bg-stone-950">
                      <img
                        src={type.imageUrl || 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'}
                        alt={type.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 brightness-95"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent opacity-70" />

                      <div className="absolute top-4 left-4 bg-stone-950/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest text-luxury-muted-blue border border-luxury-muted-blue/30">
                        {type.category || 'Premier Collection'}
                      </div>

                      {/* Status badge: Booked vs Available */}
                      <div className="absolute top-4 right-4 flex items-center gap-2">
                        {booked ? (
                          <span className="bg-rose-500/20 border border-rose-500/40 text-rose-300 backdrop-blur-md px-3 py-1 rounded-full text-xs font-bold font-mono uppercase">
                            Booked
                          </span>
                        ) : (
                          <div className="bg-stone-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-stone-200 border border-stone-700 flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-luxury-muted-blue" />
                            <span>Max {type.capacity || 2}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Room Content Details */}
                    <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <h3 className="font-serif font-bold text-xl text-stone-100 group-hover:text-luxury-muted-blue transition-colors">
                          {type.name}
                        </h3>

                        <p className="text-xs text-stone-300 line-clamp-2 leading-relaxed">
                          {type.description}
                        </p>

                        {/* Amenities Pills */}
                        {type.amenities && type.amenities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {type.amenities.slice(0, 3).map((a, i) => (
                              <span key={i} className="text-[10px] bg-stone-950 text-stone-300 px-2.5 py-1 rounded-xl border border-stone-800 font-medium">
                                {a}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Footer: Price + Reserve/Booked Button */}
                      <div className="pt-4 border-t border-stone-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-400 uppercase font-mono tracking-wider block">Starting Rate</span>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-2xl font-serif font-bold text-luxury-muted-blue">
                              ${type.basePrice}
                            </span>
                            <span className="text-xs text-stone-400 font-serif italic">
                              / night
                            </span>
                          </div>
                        </div>

                        <button
                          disabled={booked}
                          onClick={() => !booked && handleSelectRoomCard(type)}
                          className={`px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition-all shadow-md ${
                            booked
                              ? 'bg-rose-950/60 text-rose-300 border border-rose-800/60 cursor-not-allowed opacity-80'
                              : 'bg-luxury-muted-blue hover:bg-luxury-light-frost text-stone-950 hover:text-stone-950 active:scale-95 cursor-pointer font-bold'
                          }`}
                        >
                          {booked ? 'Booked' : 'Reserve Suite'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* 4. CURATED EXPERIENCES */}
      <section className="bg-stone-900/60 py-20 px-6 sm:px-10 border-y border-stone-800">
        <div className="max-w-7xl mx-auto space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-luxury-muted-blue font-mono">
              Unrivaled Hospitality
            </span>
            <h2 className="text-3xl sm:text-4xl font-serif font-bold text-white tracking-wide">
              CURATED RESORT PRIVILEGES
            </h2>
            <p className="text-xs sm:text-sm text-stone-400 font-serif italic">
              From gourmet fine dining to personalized concierge and holistic wellness.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-3 hover:border-luxury-muted-blue/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-luxury-muted-blue/15 border border-luxury-muted-blue/30 flex items-center justify-center text-luxury-muted-blue">
                <Utensils className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-base text-stone-100">Haute Gastronomy</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Michelin-standard epicurean journeys with curated wine cellars and oceanfront dining.
              </p>
            </div>

            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-3 hover:border-luxury-muted-blue/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-luxury-muted-blue/15 border border-luxury-muted-blue/30 flex items-center justify-center text-luxury-muted-blue">
                <Sparkles className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-base text-stone-100">Holistic Spa Sanctuary</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Hydrothermal salt sanctuaries and regenerative aromatherapeutic treatments.
              </p>
            </div>

            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-3 hover:border-luxury-muted-blue/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-luxury-muted-blue/15 border border-luxury-muted-blue/30 flex items-center justify-center text-luxury-muted-blue">
                <Compass className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-base text-stone-100">Private Excursions</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                Personalized coastal tours and private charter experiences along the coastline.
              </p>
            </div>

            <div className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-3 hover:border-luxury-muted-blue/40 transition">
              <div className="w-12 h-12 rounded-2xl bg-luxury-muted-blue/15 border border-luxury-muted-blue/30 flex items-center justify-center text-luxury-muted-blue">
                <Award className="w-6 h-6" />
              </div>
              <h4 className="font-serif font-bold text-base text-stone-100">24/7 Butler Service</h4>
              <p className="text-xs text-stone-400 leading-relaxed">
                White-glove concierge catering to every itinerary request and personalized need.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. GUEST TESTIMONIALS */}
      {feedbacks.length > 0 && (
        <section className="py-20 px-6 sm:px-10 bg-stone-950">
          <div className="max-w-7xl mx-auto space-y-12">
            <div className="text-center max-w-xl mx-auto space-y-2">
              <span className="text-[11px] uppercase font-bold tracking-[0.25em] text-luxury-muted-blue font-mono">
                Guest Reviews
              </span>
              <h2 className="text-3xl font-serif font-bold text-white tracking-wide">
                WORDS OF ACCLAIM
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {feedbacks.map((item, idx) => (
                <div
                  key={item._id || idx}
                  className="bg-stone-900 p-6 rounded-3xl border border-stone-800 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex text-amber-400 gap-1">
                      {[...Array(item.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                      ))}
                    </div>
                    <p className="text-xs text-stone-300 font-serif italic leading-relaxed">
                      "{item.comment || 'An absolute masterclass in luxury and hospitality. The attention to detail is unrivaled.'}"
                    </p>
                  </div>
                  <div className="border-t border-stone-800 pt-3 flex items-center justify-between text-xs">
                    <span className="font-serif font-bold text-stone-200">{item.guestId?.name || 'Verified Patron'}</span>
                    <span className="text-[10px] text-emerald-400 font-mono uppercase tracking-wider">Verified Guest</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 6. FOOTER */}
      <footer className="bg-stone-950 border-t border-stone-800 py-12 px-6 text-stone-400 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-10 pb-10 border-b border-stone-800">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <span className="font-serif font-bold text-base text-stone-100 tracking-wider">
                LUXURYSTAY <span className="text-emerald-400">HMS</span>
              </span>
            </div>
            <p className="text-xs text-stone-400 max-w-md leading-relaxed font-serif">
              An international emblem of sanctuary and luxury indulgence. Dedicated to crafting memorable experiences with care.
            </p>
            <div className="flex items-center gap-4 text-emerald-400 pt-2">
              <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {settings?.hotelPhone || '+1 (800) 555-LUXURY'}</span>
              <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {settings?.hotelEmail || 'concierge@luxurystay.com'}</span>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-stone-200 font-serif font-bold text-xs uppercase tracking-widest text-emerald-400">Navigation</h4>
            <ul className="space-y-2 text-stone-400">
              <li><a href="#suites-section" className="hover:text-emerald-400 transition">Signature Suites</a></li>
              <li><Link to="/guest/portal" className="hover:text-emerald-400 transition">Guest Portal</Link></li>
              <li><Link to="/login" className="hover:text-emerald-400 transition">Staff Sign In</Link></li>
              <li><Link to="/register" className="hover:text-emerald-400 transition">Guest Registration</Link></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="text-stone-200 font-serif font-bold text-xs uppercase tracking-widest text-emerald-400">Location</h4>
            <p className="text-stone-400 text-xs leading-relaxed flex items-start gap-1.5">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{settings?.hotelAddress || '100 Ocean Promenade, Paradise Bay, CA 90210'}</span>
            </p>
            <p className="text-[11px] text-stone-500 font-mono">
              Check-In: 15:00 HRS | Check-Out: 12:00 HRS
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-stone-500">
          <p className="font-mono">
            &copy; {new Date().getFullYear()} LuxuryStay HMS. All Rights Reserved.
          </p>
        </div>
      </footer>

      {/* --- RESERVATION BOOKING CONFIRMATION MODAL --- */}
      {selectedRoomType && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 text-stone-100 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-stone-800 p-6 sm:p-8 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-stone-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400 font-mono">RESERVATION CONFIRMATION</span>
                <h3 className="font-serif font-bold text-2xl text-stone-100 mt-0.5">{selectedRoomType.name}</h3>
              </div>
              <button 
                onClick={() => setSelectedRoomType(null)} 
                className="p-1.5 text-stone-400 hover:text-stone-100 rounded-xl hover:bg-stone-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {bookingSuccess ? (
              <div className="bg-stone-950 border border-emerald-500/50 p-6 rounded-2xl text-center space-y-3">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <h4 className="font-serif font-bold text-xl text-stone-100">Reservation Confirmed</h4>
                <p className="text-xs text-stone-300">
                  Your suite reservation <span className="font-mono font-bold text-emerald-400">#{bookingSuccess._id || bookingSuccess.bookingId}</span> is registered.
                </p>
                <div className="pt-3 flex justify-center gap-3">
                  <button
                    onClick={() => { setSelectedRoomType(null); navigate('/guest/portal'); }}
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-2xl text-xs shadow hover:brightness-110 transition"
                  >
                    Enter Guest Portal
                  </button>
                  <button
                    onClick={() => { setSelectedRoomType(null); setBookingSuccess(null); }}
                    className="px-5 py-2.5 bg-stone-900 border border-stone-700 text-stone-300 rounded-2xl text-xs font-bold hover:bg-stone-800 transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-xs">
                {/* Stay summary */}
                <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase font-mono">Arrival</span>
                    <p className="font-semibold text-stone-100 text-sm mt-0.5">{arriveDate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase font-mono">Departure</span>
                    <p className="font-semibold text-stone-100 text-sm mt-0.5">{departureDate}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase font-mono">Guests</span>
                    <p className="font-semibold text-stone-200 mt-0.5">{guestCount} Guests</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-stone-400 font-bold uppercase font-mono">Base Nightly Rate</span>
                    <p className="font-serif font-bold text-emerald-400 text-sm mt-0.5">${selectedRoomType.basePrice} / night</p>
                  </div>
                </div>

                {/* Assigned Room unit preview */}
                {selectedPhysicalRoom ? (
                  <div className="bg-stone-950 border border-emerald-500/30 p-3.5 rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-200 text-xs">Allocated Room:</span>
                      <span className="font-mono font-bold text-emerald-400 ml-1.5">Suite #{selectedPhysicalRoom.roomNumber} (Floor {selectedPhysicalRoom.floor})</span>
                    </div>
                    <span className="text-[10px] bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 font-bold px-2 py-0.5 rounded-full font-mono">
                      Available
                    </span>
                  </div>
                ) : (
                  <div className="bg-rose-950/40 border border-rose-500/30 p-3.5 rounded-2xl text-rose-200 text-xs font-semibold">
                    No physical rooms available for this category on selected dates.
                  </div>
                )}

                {/* Guest Account Prompt if not logged in */}
                {!user && (
                  <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 text-xs flex items-center justify-between">
                    <span className="text-stone-300">Sign in to tie this reservation to your profile:</span>
                    <Link to="/login" className="font-bold text-emerald-400 hover:underline flex items-center gap-1 font-mono">
                      Sign In &rarr;
                    </Link>
                  </div>
                )}

                <div className="pt-3 flex items-center justify-end gap-3 border-t border-stone-800">
                  <button
                    type="button"
                    onClick={() => setSelectedRoomType(null)}
                    className="px-5 py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 rounded-2xl text-xs font-bold transition border border-stone-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={bookingLoading || !selectedPhysicalRoom}
                    onClick={handleConfirmReservation}
                    className={`px-6 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-wider transition ${
                      !selectedPhysicalRoom
                        ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-stone-950 shadow-lg active:scale-95 cursor-pointer font-bold'
                    }`}
                  >
                    {bookingLoading ? 'Securing...' : !selectedPhysicalRoom ? 'Booked' : 'Confirm & Reserve'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
