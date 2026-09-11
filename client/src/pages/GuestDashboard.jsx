import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Crown, Utensils, Wine, ShoppingBag, Dumbbell, Heart, Compass, 
  ArrowUpRight, Star, BedDouble, Calendar, ConciergeBell, Clock, Sparkles,
  CreditCard, CheckCircle, AlertCircle, FileText, ChevronRight, Send, X, ShieldCheck
} from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

export default function GuestDashboard({ activeTab: parentActiveTab }) {
  const { user } = useAuth();
  const [internalTab, setInternalTab] = useState('portal');
  const activeTab = parentActiveTab && parentActiveTab !== 'dashboard' ? parentActiveTab : internalTab;

  const [availableRooms, setAvailableRooms] = useState([]);
  const [myBookings, setMyBookings] = useState([]);
  const [myInvoices, setMyInvoices] = useState([]);
  const [servicesCatalog, setServicesCatalog] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [settings, setSettings] = useState(null);

  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [selectedServiceItem, setSelectedServiceItem] = useState(null);

  // Search & Booking parameters
  const [checkInDate, setCheckInDate] = useState(new Date().toISOString().split('T')[0]);
  const [checkOutDate, setCheckOutDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [guestsCount, setGuestsCount] = useState(2);

  // Service Order State
  const [serviceCategory, setServiceCategory] = useState('All');
  const [orderInstructions, setOrderInstructions] = useState('');
  const [targetBookingId, setTargetBookingId] = useState('');

  // Feedback State
  const [rating, setRating] = useState(5);
  const [feedbackText, setFeedbackText] = useState('');
  const [feedbackBookingId, setFeedbackBookingId] = useState('');

  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchGuestData();
    const refreshTimer = window.setInterval(fetchGuestData, 30000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const fetchGuestData = async () => {
    try {
      const [bRes, iRes, srvRes, prmRes, amnRes, fRes, setRes] = await Promise.all([
        fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/invoices', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/services/catalog'),
        fetch('/api/promotions'),
        fetch('/api/amenities'),
        fetch('/api/feedback'),
        fetch('/api/settings')
      ]);

      const [bData, iData, srvData, prmData, amnData, fData, setData] = await Promise.all([
        bRes.json(), iRes.json(), srvRes.json(), prmRes.json(), amnRes.json(), fRes.json(), setRes.json()
      ]);

      const myB = Array.isArray(bData) ? bData : [];
      setMyBookings(myB);
      setMyInvoices(Array.isArray(iData) ? iData : []);
      setServicesCatalog(Array.isArray(srvData) ? srvData : []);
      setPromotions(Array.isArray(prmData) ? prmData : []);
      setAmenities(Array.isArray(amnData) ? amnData : []);
      setFeedbacks(Array.isArray(fData) ? fData : []);
      if (setData) setSettings(setData);

      if (setData) setSettings(setData);

      if (myB.length > 0) {
        const active = myB.find(
          b => b.status === 'Checked-In' || b.status === 'Confirmed'
        );

        const completedBooking = myB.find(
          b => b.status === 'Checked-Out'
        );

        if (active) {
          setTargetBookingId(active._id);
        }

        if (completedBooking) {
          setFeedbackBookingId(completedBooking._id);
        } else {
          setFeedbackBookingId('');
        }
      }

    } catch (err) {
      console.error(err);
    }
  };

  // --- Suite Availability Search ---
  const handleSearchRooms = async (e) => {
    e?.preventDefault();
    try {
      const res = await fetch(`/api/bookings/check-availability?checkInDate=${checkInDate}&checkOutDate=${checkOutDate}`);
      const data = await res.json();
      setAvailableRooms(Array.isArray(data) ? data : []);
      if (Array.isArray(data) && data.length === 0) {
        alert('No rooms available for the selected dates. Please try another range.');
      }
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Confirm Booking ---
  const handleCreateBooking = async () => {
    if (!selectedRoom) return;
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          roomId: selectedRoom._id,
          checkInDate,
          checkOutDate,
          numberOfGuests: guestsCount,
          specialRequests: 'Complimentary luxury welcome amenities requested.'
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setSelectedRoom(null);
      alert(`Reservation Confirmed! Your Booking Reference is: ${data.bookingId}`);
      fetchGuestData();
      setInternalTab('my_bookings');
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Order Service Item ---
  const handleOrderServiceItem = async (serviceItem) => {
    if (!targetBookingId) {
      alert('You need an active hotel booking to request in-room services.');
      return;
    }

    try {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bookingId: targetBookingId,
          serviceId: serviceItem._id,
          description: orderInstructions ? `${serviceItem.name} — Note: ${orderInstructions}` : `${serviceItem.name} (${serviceItem.category})`,
          cost: serviceItem.price
        })
      });
      if (!res.ok) throw new Error('Order submission failed');

      setSelectedServiceItem(null);
      setOrderInstructions('');
      alert(`Your order for "${serviceItem.name}" ($${serviceItem.price}) has been placed and dispatched to the concierge team!`);
      fetchGuestData();
    } catch (err) {
      alert(err.message);
    }
  };

  // --- Settle Invoice Payment ---
  const handlePayInvoice = async (invoiceId, paymentMethod) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentMethod: paymentMethod || 'American Express' })
      });
      if (!res.ok) throw new Error('Payment failed');

      alert('Payment Settled Successfully! Your digital receipt has been stamped as PAID.');
      fetchGuestData();
      setSelectedInvoice(null);
    } catch (err) {
      alert(err.message);
    }
  };

// --- Submit Feedback ---
const handleSubmitFeedback = async (e) => {
  e.preventDefault();

  const cleanComments = feedbackText.trim();
  const cleanRating = Number(rating);

  console.log('SUBMITTING FEEDBACK:', {
    bookingId: feedbackBookingId,
    rating: cleanRating,
    comments: cleanComments
  });

  if (!cleanComments) {
    alert('Please write your comments before submitting.');
    return;
  }

  if (!feedbackBookingId) {
    alert('You can submit a review only after completing a hotel stay.');
    return;
  }

  if (!cleanRating || cleanRating < 1 || cleanRating > 5) {
    alert('Please select a rating from 1 to 5 stars.');
    return;
  }

  try {
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        bookingId: feedbackBookingId,
        rating: cleanRating,
        comments: cleanComments
      })
    });

    const data = await res.json();

    console.log('FEEDBACK RESPONSE:', {
      status: res.status,
      data
    });

    if (!res.ok) {
      throw new Error(data.message || 'Failed to submit review');
    }

    setFeedbackText('');
    setRating(5);

    alert(
      'Thank you for your rating & feedback! Our management team values your impression.'
    );

    await fetchGuestData();

  } catch (err) {
    console.error('Feedback submission error:', err);
    alert(err.message);
  }
};

  // Active stay calculation
  const activeStay = myBookings.find(b => b.status === 'Checked-In' || b.status === 'Confirmed') || myBookings[0];
  const primaryPromotion = promotions.length > 0 ? promotions[0] : null;

  const filteredServices = servicesCatalog.filter(s => {
    if (serviceCategory === 'All') return true;
    return s.category === serviceCategory;
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto selection:bg-amber-500 selection:text-stone-950">
      {/* Top Banner Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Guest Summary Card */}
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between space-y-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-[1.5px] shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-stone-950 rounded-[14px] flex items-center justify-center font-serif font-bold text-lg text-amber-400">
                {user?.name?.charAt(0) || 'G'}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest font-mono text-stone-400">
                  PATRON PORTAL
                </span>
                {user?.guestType === 'VIP' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-[#D4AF37] to-amber-300 text-[#001219] font-mono shadow-md uppercase tracking-wider">
                    <Crown className="w-3 h-3 fill-[#001219]" /> VIP Sovereign
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-stone-800 text-stone-300 border border-stone-700 uppercase tracking-wider font-mono">
                    Standard Guest
                  </span>
                )}
              </div>
              <h3 className="font-serif font-bold text-lg text-stone-100 mt-0.5">{user?.name || 'Valued Guest'}</h3>
              <p className="text-[11px] text-stone-400 font-mono">{user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 bg-stone-950 p-4 rounded-2xl border border-stone-800 text-xs">
            <div>
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Assigned Suite</span>
              <span className="text-xl font-serif font-bold text-amber-400 mt-0.5 block">
                {activeStay ? `Room ${activeStay.room?.roomNumber}` : 'No Active Stay'}
              </span>
              <span className="text-[10px] text-stone-400 truncate block">{activeStay?.room?.roomType?.name || 'Select a suite'}</span>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">Stay Status</span>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border inline-block mt-1 ${
                activeStay?.status === 'Checked-In' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                activeStay?.status === 'Confirmed' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                'bg-stone-800 text-stone-400 border-stone-700'
              }`}>
                {activeStay?.status || 'Direct Guest'}
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-stone-800 flex items-center justify-between text-xs">
            <div>
              <span className="text-[10px] text-stone-400">Concierge In-Suite Assistance</span>
              <p className="font-bold text-stone-200">Dial Ext: 00 &bull; 24/7</p>
            </div>
            <ShieldCheck className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        {/* Dynamic Resort Event Banner (Fetched from Database) */}
        <div 
          className="lg:col-span-2 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[220px] group border border-stone-800"
          style={{
            backgroundImage: `linear-gradient(to right, rgba(12, 16, 26, 0.95), rgba(12, 16, 26, 0.65)), url('${primaryPromotion?.imageUrl || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80'}')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="space-y-2 z-10">
            <span className="text-[10px] uppercase tracking-widest text-amber-300 font-bold bg-stone-950/80 px-3 py-1 rounded-full inline-block border border-amber-400/30">
              {primaryPromotion?.badge || 'Resort Special'}
            </span>
            <h2 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white mt-1">
              {primaryPromotion?.title || 'Sunset Jazz & Rooftop Soirée'}
            </h2>
            <p className="text-xs text-stone-300 max-w-lg leading-relaxed">
              {primaryPromotion?.description || 'Enjoy signature artisan mixology, live acoustic jazz, and breathtaking panoramic ocean skyline views tonight.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-6 z-10">
            <button 
              onClick={() => setInternalTab('promotions')}
              className="px-5 py-2.5 bg-gradient-to-r from-amber-400 to-amber-500 text-stone-950 rounded-2xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:brightness-110 transition w-fit"
            >
              {primaryPromotion?.actionText || 'Explore Experiences'} <ArrowUpRight className="w-4 h-4" />
            </button>

            {activeStay && (
              <div className="flex items-center gap-4 bg-stone-950/90 backdrop-blur-md px-4 py-2 rounded-2xl border border-stone-800 text-xs">
                <div>
                  <span className="text-[9px] text-stone-400 block uppercase font-mono">Check IN</span>
                  <span className="font-semibold text-stone-200 text-[11px]">
                    {new Date(activeStay.checkInDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
                <div className="h-6 w-px bg-stone-800"></div>
                <div>
                  <span className="text-[9px] text-stone-400 block uppercase font-mono">Check OUT</span>
                  <span className="font-semibold text-stone-200 text-[11px]">
                    {new Date(activeStay.checkOutDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Guest Portal Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800 text-xs">
        {[
          { id: 'portal', label: 'Guest Portal', icon: Sparkles },
          { id: 'search', label: 'Book a Suite', icon: BedDouble },
          { id: 'order_services', label: 'In-Room Services', icon: ConciergeBell },
          { id: 'my_bookings', label: 'My Bookings', icon: Calendar },
          { id: 'amenities', label: 'Amenities Guide', icon: Compass },
          { id: 'promotions', label: 'Events & Offers', icon: Star },
          { id: 'my_invoices', label: 'Digital Invoices', icon: FileText },
          { id: 'feedback', label: 'Ratings & Reviews', icon: Heart }
        ].map(t => {
          const Icon = t.icon;
          const isSelected = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setInternalTab(t.id)}
              className={`px-3.5 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
                isSelected ? 'bg-amber-400 text-stone-950 shadow-md' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- SECTION: IN-ROOM SERVICE ORDERING MENU (DYNAMIC FROM DB) --- */}
      {(activeTab === 'portal' || activeTab === 'order_services') && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-amber-400 uppercase font-mono font-bold">
                <ConciergeBell className="w-4 h-4" /> Concierge & In-Room Services
              </div>
              <h3 className="font-serif font-bold text-xl text-stone-100 mt-1">Order to Your Suite</h3>
              <p className="text-xs text-stone-400">All items are freshly prepared and billed directly to your room folio.</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 bg-stone-950 p-1 rounded-2xl border border-stone-800 text-xs">
              {['All', 'Dining', 'Beverages', 'Spa & Wellness', 'Transportation', 'Laundry', 'Concierge'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setServiceCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    serviceCategory === cat ? 'bg-stone-800 text-amber-400 border border-stone-700' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Service Items Grid (Dynamic from DB) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredServices.map(item => (
              <div key={item._id} className="bg-stone-950 border border-stone-800 rounded-2xl overflow-hidden flex flex-col justify-between group">
                {item.imageUrl && (
                  <div className="h-40 w-full overflow-hidden relative">
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <span className="absolute top-2.5 left-2.5 bg-stone-950/80 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-bold text-amber-400 border border-stone-700">
                      {item.category}
                    </span>
                    <span className="absolute top-2.5 right-2.5 bg-stone-950/90 backdrop-blur-md px-2.5 py-0.5 rounded-full text-xs font-mono font-bold text-emerald-400 border border-emerald-500/30">
                      ${item.price}
                    </span>
                  </div>
                )}
                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-stone-100 text-sm">{item.name}</h4>
                    <p className="text-[11px] text-stone-400 mt-1 line-clamp-2">{item.description}</p>
                  </div>

                  <div className="pt-3 border-t border-stone-800/80 flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-400 text-sm">${item.price}</span>
                    <button
                      onClick={() => setSelectedServiceItem(item)}
                      className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-md transition"
                    >
                      <span>Order</span> <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SECTION: SUITE SEARCH & RESERVATION ENGINE --- */}
      {(activeTab === 'portal' || activeTab === 'search') && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <div className="flex items-center gap-2 text-xs text-amber-400 uppercase font-mono font-bold">
              <BedDouble className="w-4 h-4" /> Live Booking Engine
            </div>
            <h3 className="font-serif font-bold text-xl text-stone-100 mt-1">Reserve a Luxury Suite</h3>
            <p className="text-xs text-stone-400">Search real-time room availability across our ocean suites and penthouses.</p>
          </div>

          <form onSubmit={handleSearchRooms} className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-stone-950 p-4 rounded-3xl border border-stone-800 text-xs">
            <div>
              <label className="block text-stone-400 font-bold mb-1">Check-In Date</label>
              <input
                type="date"
                value={checkInDate}
                onChange={e => setCheckInDate(e.target.value)}
                required
                className="w-full bg-stone-900 border border-stone-800 p-2.5 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-stone-400 font-bold mb-1">Check-Out Date</label>
              <input
                type="date"
                value={checkOutDate}
                onChange={e => setCheckOutDate(e.target.value)}
                required
                className="w-full bg-stone-900 border border-stone-800 p-2.5 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-stone-400 font-bold mb-1">Number of Guests</label>
              <select
                value={guestsCount}
                onChange={e => setGuestsCount(Number(e.target.value))}
                className="w-full bg-stone-900 border border-stone-800 p-2.5 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
              >
                <option value={1}>1 Guest</option>
                <option value={2}>2 Guests</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4 Guests</option>
                <option value={6}>6 Guests (Penthouse)</option>
              </select>
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 font-bold rounded-2xl text-xs uppercase tracking-wider transition shadow-lg shadow-amber-500/20"
              >
                Check Available Rooms
              </button>
            </div>
          </form>

          {/* Available Rooms Grid */}
          {availableRooms.length > 0 && (
            <div className="space-y-4 pt-2">
              <h4 className="font-serif font-bold text-base text-stone-200">Available Suites for Your Dates</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {availableRooms.map(room => (
                  <div key={room._id} className="bg-stone-950 border border-stone-800 rounded-3xl overflow-hidden flex flex-col justify-between group shadow-xl">
                    {room.roomType?.imageUrl && (
                      <div className="h-44 w-full overflow-hidden relative">
                        <img src={room.roomType.imageUrl} alt={room.roomType.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        <span className="absolute top-3 left-3 bg-stone-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono font-bold text-amber-400 border border-amber-500/30">
                          Room #{room.roomNumber}
                        </span>
                        <span className="absolute top-3 right-3 bg-stone-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono font-bold text-emerald-400 border border-emerald-500/30">
                          ${room.pricePerNight}/night
                        </span>
                      </div>
                    )}

                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-serif font-bold text-lg text-stone-100">{room.roomType?.name}</h4>
                        <p className="text-xs text-stone-400 mt-1 line-clamp-2">{room.roomType?.description}</p>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {room.roomType?.amenities?.slice(0, 3).map((a, i) => (
                            <span key={i} className="text-[9px] px-2 py-0.5 rounded-full bg-stone-900 text-stone-300 border border-stone-800">
                              {a}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-stone-800 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-stone-500 block">Total per night</span>
                          <span className="font-serif font-bold text-amber-400 text-base">${room.pricePerNight}</span>
                        </div>
                        <button
                          onClick={() => setSelectedRoom(room)}
                          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-bold rounded-2xl text-xs shadow-md transition"
                        >
                          Reserve Suite
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- SECTION: MY RESERVATIONS TAB --- */}
      {activeTab === 'my_bookings' && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div>
            <h3 className="font-serif font-bold text-xl text-stone-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" /> My Booking History & Active Stays
            </h3>
            <p className="text-xs text-stone-400">View current reservation statuses, check-in dates, and suite details.</p>
          </div>

          {myBookings.length === 0 ? (
            <div className="text-center py-10 bg-stone-950 rounded-2xl border border-stone-800 text-stone-500 text-xs">
              You do not have any active or past bookings. Use "Book a Suite" to make your first reservation.
            </div>
          ) : (
            <div className="space-y-4">
              {myBookings.map(b => (
                <div key={b._id} className="bg-stone-950 border border-stone-800 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-amber-400 text-sm">#{b.bookingId}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        b.status === 'Checked-In' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                        b.status === 'Confirmed' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                        b.status === 'Checked-Out' ? 'bg-stone-800 text-stone-400 border-stone-700' :
                        'bg-rose-500/20 text-rose-300 border-rose-500/30'
                      }`}>
                        {b.status}
                      </span>
                    </div>
                    <h4 className="font-serif font-bold text-stone-100 text-base">
                      Room {b.room?.roomNumber} &bull; {b.room?.roomType?.name}
                    </h4>
                    <p className="text-xs text-stone-400 font-mono">
                      Stay: {new Date(b.checkInDate).toLocaleDateString()} &rarr; {new Date(b.checkOutDate).toLocaleDateString()}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-stone-500 block">Total Calculated</span>
                      <span className="font-mono font-bold text-amber-400 text-base">${b.totalAmount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SECTION: RESORT AMENITIES GUIDE (DYNAMIC FROM DB) --- */}
      {(activeTab === 'portal' || activeTab === 'amenities') && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-xl text-stone-100 flex items-center gap-2">
                <Compass className="w-5 h-5 text-amber-400" /> Resort Amenities & Attractions
              </h3>
              <p className="text-xs text-stone-400">Exclusive facilities available complimentary for registered resort guests.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {amenities.map(a => (
              <div 
                key={a._id}
                className="h-60 rounded-3xl p-5 text-white flex flex-col justify-end relative overflow-hidden group shadow-lg border border-stone-800"
                style={{
                  backgroundImage: `linear-gradient(to top, rgba(12, 16, 26, 0.95), rgba(12, 16, 26, 0.2)), url('${a.imageUrl}')`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center'
                }}
              >
                <div className="absolute top-3 left-3">
                  <span className="bg-stone-950/80 backdrop-blur-md text-amber-400 text-[10px] font-bold px-2.5 py-1 rounded-full border border-stone-700">
                    {a.category}
                  </span>
                </div>

                <div className="z-10 space-y-1">
                  <h4 className="font-serif font-bold text-base text-white group-hover:text-amber-300 transition">{a.title}</h4>
                  <p className="text-[11px] text-stone-300 line-clamp-2 leading-relaxed">{a.description}</p>
                  <p className="text-[10px] text-amber-400/80 font-mono mt-1">{a.openingHours} &bull; {a.location}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SECTION: PROMOTIONS & EXPERIENCES --- */}
      {activeTab === 'promotions' && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <h3 className="font-serif font-bold text-xl text-stone-100 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" /> Exclusive Resort Experiences & Banners
            </h3>
            <p className="text-xs text-stone-400">Discover scheduled evening events, romantic dining, and private excursions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {promotions.map(p => (
              <div key={p._id} className="bg-stone-950 border border-stone-800 rounded-3xl overflow-hidden relative shadow-xl group">
                <div className="h-52 relative overflow-hidden">
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-stone-950/50 to-transparent"></div>
                  <span className="absolute top-3 left-3 bg-amber-400 text-stone-950 font-bold text-[10px] uppercase px-3 py-1 rounded-full shadow-md">
                    {p.badge}
                  </span>
                </div>
                <div className="p-6 space-y-3">
                  <h4 className="font-serif font-bold text-xl text-stone-100">{p.title}</h4>
                  {p.subtitle && <p className="text-xs text-amber-300 font-semibold">{p.subtitle}</p>}
                  <p className="text-xs text-stone-300 leading-relaxed">{p.description}</p>
                  <div className="pt-3 border-t border-stone-800 flex items-center justify-between text-xs">
                    <span className="text-stone-400 font-mono">{p.eventDate} &bull; {p.time}</span>
                    <button 
                      onClick={() => alert(`Concierge has received your interest for "${p.title}". Our team will contact you shortly.`)}
                      className="px-4 py-2 bg-stone-800 hover:bg-amber-400 hover:text-stone-950 text-stone-100 rounded-xl font-bold transition flex items-center gap-1.5"
                    >
                      {p.actionText || 'RSVP VIP Access'} <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- SECTION: DIGITAL INVOICES & FOLIO --- */}
      {activeTab === 'my_invoices' && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-5">
          <div>
            <h3 className="font-serif font-bold text-xl text-stone-100 flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" /> Digital Invoices & Folio Statements
            </h3>
            <p className="text-xs text-stone-400">View official room stay and service charges, print receipts, and settle balances.</p>
          </div>

          {myInvoices.length === 0 ? (
            <div className="text-center py-10 bg-stone-950 rounded-2xl border border-stone-800 text-stone-500 text-xs">
              No invoices generated yet. Invoices are generated automatically during check-out or upon request.
            </div>
          ) : (
            <div className="space-y-4">
              {myInvoices.map(inv => (
                <div key={inv._id} className="bg-stone-950 border border-stone-800 p-5 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-amber-400 text-sm">#{inv.invoiceNumber}</span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                        inv.paymentStatus === 'Paid' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </div>
                    <p className="text-xs text-stone-300">Booking: <span className="font-mono font-bold text-stone-100">{inv.booking?.bookingId}</span></p>
                    <p className="text-[11px] text-stone-500">Date: {new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[10px] text-stone-500 block">Grand Total</span>
                      <span className="font-mono font-bold text-amber-400 text-lg">${Number(inv.grandTotal).toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => setSelectedInvoice(inv)}
                      className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border border-stone-700"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-400" /> View & Pay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- SECTION: RATINGS & REVIEWS --- */}
      {activeTab === 'feedback' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-stone-900/90 border border-stone-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" /> Leave a Review
            </h3>
            <p className="text-xs text-stone-400">Your impression matters. Share your thoughts with the general manager.</p>

            <form onSubmit={handleSubmitFeedback} className="space-y-4 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Overall Rating</label>
                <div className="flex items-center gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      className="p-1 text-2xl transition hover:scale-110"
                    >
                      <Star className={`w-6 h-6 ${star <= rating ? 'fill-amber-400 text-amber-400' : 'text-stone-700'}`} />
                    </button>
                  ))}
                  <span className="font-mono font-bold text-amber-400 ml-2">{rating}/5 Stars</span>
                </div>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Your Comments & Experience</label>
                <textarea
                  rows="4"
                  value={feedbackText}
                  onChange={e => setFeedbackText(e.target.value)}
                  placeholder="Share details about your suite comfort, dining, and staff service..."
                  required
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                ></textarea>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Submit Feedback
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-stone-900/90 border border-stone-800 rounded-3xl p-6 space-y-4">
            <h3 className="font-serif font-bold text-lg text-stone-100">Guest Review Timeline & Responses</h3>
            <div className="space-y-3 max-h-[500px] overflow-y-auto">
              {feedbacks.map(f => (
                <div key={f._id} className="bg-stone-950 border border-stone-800 p-4 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-serif font-bold text-stone-200">{f.guest?.name || 'Guest'}</span>
                    <div className="flex items-center gap-1">
                      {[...Array(f.rating || 5)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-stone-300 leading-relaxed">{f.comments}</p>
                  {f.response && (
                    <div className="bg-stone-900/80 p-3 rounded-xl border border-stone-800/80 text-[11px] text-amber-300/90 space-y-0.5">
                      <span className="font-bold text-amber-400 block">General Manager Response:</span>
                      <p>{f.response}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: CONFIRM SUITE BOOKING --- */}
      {selectedRoom && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-3xl w-full max-w-md space-y-4 text-stone-100 shadow-2xl">
            <h3 className="font-serif font-bold text-xl flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-400" /> Confirm Suite Reservation
            </h3>

            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 text-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-serif font-bold text-sm text-stone-100">Room #{selectedRoom.roomNumber}</span>
                <span className="font-mono font-bold text-amber-400">${selectedRoom.pricePerNight}/night</span>
              </div>
              <p className="text-stone-400">{selectedRoom.roomType?.name}</p>
              <div className="pt-2 border-t border-stone-800 text-[11px] text-stone-400 space-y-1">
                <p>Stay Dates: <span className="font-mono text-stone-200">{checkInDate} &rarr; {checkOutDate}</span></p>
                <p>Guests: <span className="text-stone-200">{guestsCount} Persons</span></p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setSelectedRoom(null)} className="px-4 py-2.5 bg-stone-800 text-stone-300 rounded-2xl font-bold text-xs">Cancel</button>
              <button onClick={handleCreateBooking} className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-2xl text-xs shadow-lg">Confirm & Reserve</button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL: ORDER SERVICE CONFIRMATION --- */}
      {selectedServiceItem && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-3xl w-full max-w-md space-y-4 text-stone-100 shadow-2xl">
            <h3 className="font-serif font-bold text-lg flex items-center gap-2">
              <ConciergeBell className="w-5 h-5 text-amber-400" /> Order In-Room Service
            </h3>

            <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 text-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-serif font-bold text-sm text-stone-100">{selectedServiceItem.name}</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">${selectedServiceItem.price}</span>
              </div>
              <p className="text-stone-400">{selectedServiceItem.description}</p>
            </div>

            <div className="space-y-1.5 text-xs">
              <label className="block text-stone-400 font-semibold">Special Instructions or Dietary Notes</label>
              <input
                type="text"
                placeholder="e.g. Please deliver at 8:30 AM, extra dressing on side..."
                value={orderInstructions}
                onChange={e => setOrderInstructions(e.target.value)}
                className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <button onClick={() => setSelectedServiceItem(null)} className="px-4 py-2.5 bg-stone-800 text-stone-300 rounded-2xl font-bold text-xs">Cancel</button>
              <button onClick={() => handleOrderServiceItem(selectedServiceItem)} className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-2xl text-xs shadow-lg">Confirm Order (${selectedServiceItem.price})</button>
            </div>
          </div>
        </div>
      )}

      {/* Digital Invoice Modal */}
      {selectedInvoice && (
        <InvoiceModal
          invoice={selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          onPay={handlePayInvoice}
        />
      )}
    </div>
  );
}
