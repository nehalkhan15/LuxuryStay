import React, { useState, useEffect } from 'react';
import { 
  CalendarCheck, BedDouble, FileText, CheckCircle, LogOut, Search, 
  UserPlus, FilePlus, Sparkles, ConciergeBell, Clock, CreditCard, DollarSign, Plus, ArrowRight,
  Crown, Users
} from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

export default function ReceptionistDashboard({ activeTab: parentActiveTab }) {
  const [internalTab, setInternalTab] = useState('frontdesk');
  const activeTab = parentActiveTab && parentActiveTab !== 'dashboard' ? parentActiveTab : internalTab;

  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [guests, setGuests] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // New Booking Modal State
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [newBooking, setNewBooking] = useState({
    guestId: '',
    roomId: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    numberOfGuests: 2
  });

  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchReceptionData();
    const refreshTimer = window.setInterval(fetchReceptionData, 30000);
    return () => window.clearInterval(refreshTimer);
  }, []);

  const fetchReceptionData = async () => {
    try {
      const [bRes, rRes, gRes, iRes, srvRes] = await Promise.all([
        fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/rooms'),
        fetch('/api/users?role=Guest', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/invoices', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/services', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const [bData, rData, gData, iData, srvData] = await Promise.all([
        bRes.json(), rRes.json(), gRes.json(), iRes.json(), srvRes.json()
      ]);

      setBookings(Array.isArray(bData) ? bData : []);
      setRooms(Array.isArray(rData) ? rData : []);
      setGuests(Array.isArray(gData) ? gData : []);
      setInvoices(Array.isArray(iData) ? iData : []);
      setServices(Array.isArray(srvData) ? srvData : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCheckIn = async (bookingId) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/check-in`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Check-in failed');
      fetchReceptionData();
      alert('Guest Successfully Checked In! Room assigned as Occupied.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCheckOut = async (bookingId) => {
    try {
      // 1. Mark checked out
      const res = await fetch(`/api/bookings/${bookingId}/check-out`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Check-out failed');

      // 2. Generate and open Invoice
      const invRes = await fetch(`/api/invoices/generate/${bookingId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const invData = await invRes.json();
      setSelectedInvoice(invData);

      fetchReceptionData();
      alert('Guest Checked Out! Room status set to Cleaning (Housekeeping task dispatched). Folio generated.');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGenerateInvoice = async (bookingId) => {
    try {
      const invRes = await fetch(`/api/invoices/generate/${bookingId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const invData = await invRes.json();
      setSelectedInvoice(invData);
      fetchReceptionData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePayInvoice = async (invoiceId, paymentMethod) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentMethod: paymentMethod || 'Cash / Credit Card' })
      });
      if (!res.ok) throw new Error('Payment failed');
      alert('Folio Marked as Paid and Stamped!');
      fetchReceptionData();
      setSelectedInvoice(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleCreateWalkInBooking = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newBooking)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);

      setShowBookingModal(false);
      alert(`Walk-In Reservation Created! Booking ID: ${data.bookingId}`);
      fetchReceptionData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateServiceStatus = async (serviceId, newStatus) => {
    try {
      await fetch(`/api/services/${serviceId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      fetchReceptionData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleToggleGuestType = async (guestId, currentType) => {
    const newType = currentType === 'VIP' ? 'NORMAL' : 'VIP';
    try {
      const response = await fetch(`/api/users/${guestId}/guest-type`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ guestType: newType })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update VIP status.');
      fetchReceptionData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredBookings = bookings.filter(b => 
    b.bookingId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.guest?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.room?.roomNumber?.includes(searchTerm)
  );

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto selection:bg-amber-500 selection:text-stone-950">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400 font-mono">
            <CalendarCheck className="w-4 h-4" /> Front Desk & Concierge Terminal
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 mt-1">
            Reception Operations & Guest Arrivals
          </h1>
          <p className="text-xs text-stone-400 mt-1">
            Process arrivals, fast check-ins/check-outs, walk-in reservations, billing folios, and service requests.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Sub tab selector */}
          <div className="flex items-center gap-1.5 bg-stone-900/90 p-1.5 rounded-2xl border border-stone-800 text-xs">
            {[
              { id: 'frontdesk', label: 'Front Desk', icon: CalendarCheck },
              { id: 'grid', label: 'Room Matrix', icon: BedDouble },
              { id: 'billing', label: 'Billing Desk', icon: CreditCard },
              { id: 'services', label: 'Service Orders', icon: ConciergeBell },
              { id: 'guests', label: 'Guest Directory & VIPs', icon: Users }
            ].map(t => {
              const Icon = t.icon;
              const isSel = (parentActiveTab === 'dashboard' || !parentActiveTab) ? internalTab === t.id : activeTab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setInternalTab(t.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                    isSel ? 'bg-amber-400 text-stone-950 shadow-md' : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{t.label}</span>
                </button>
              );
            })}
          </div>

          <button
            onClick={() => setShowBookingModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-2xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 hover:brightness-110 transition"
          >
            <Plus className="w-4 h-4" /> New Walk-In Booking
          </button>
        </div>
      </div>

      {/* --- FRONT DESK ARRIVALS & DEPARTURES TAB --- */}
      {(activeTab === 'frontdesk' || activeTab === 'checkin' || activeTab === 'reservations') && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
                <CalendarCheck className="w-5 h-5 text-amber-400" /> Today's Arrival & Departure Queue
              </h3>
              <p className="text-xs text-stone-400">Perform seamless 1-click guest check-in and check-out processing.</p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search guest or room..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-2xl pl-9 pr-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950 text-stone-400 uppercase font-semibold border-b border-stone-800">
                <tr>
                  <th className="p-3.5">Booking ID</th>
                  <th className="p-3.5">Guest Details</th>
                  <th className="p-3.5">Assigned Suite</th>
                  <th className="p-3.5">Stay Period</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Desk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {filteredBookings.map(b => (
                  <tr key={b._id} className="hover:bg-stone-800/30 transition">
                    <td className="p-3.5 font-mono font-bold text-amber-400">#{b.bookingId}</td>
                    <td className="p-3.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-stone-100">{b.guest?.name || 'Walk-In Guest'}</span>
                        {b.guest?.guestType === 'VIP' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-[#D4AF37] to-amber-300 text-[#001219] font-mono shadow-sm uppercase tracking-wider">
                            <Crown className="w-2.5 h-2.5 fill-[#001219]" /> VIP
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-stone-800 text-stone-400 border border-stone-700 uppercase tracking-wider font-mono">
                            NORMAL
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-stone-500 font-mono block">{b.guest?.phone || b.guest?.email}</span>
                    </td>
                    <td className="p-3.5">
                      <span className="font-bold text-stone-200 block">Room {b.room?.roomNumber}</span>
                      <span className="text-[10px] text-stone-500">{b.room?.roomType?.name}</span>
                    </td>
                    <td className="p-3.5 font-mono text-stone-400">
                      {new Date(b.checkInDate).toLocaleDateString()} &rarr; {new Date(b.checkOutDate).toLocaleDateString()}
                    </td>
                    <td className="p-3.5">
                      <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                        b.status === 'Checked-In' ? 'bg-luxury-light-frost/15 text-luxury-muted-blue border-luxury-muted-blue/30' :
                        b.status === 'Confirmed' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' :
                        b.status === 'Checked-Out' ? 'bg-stone-800 text-stone-400 border-stone-700' :
                        'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right space-x-2">
                      {b.status === 'Confirmed' && (
                        <button
                          onClick={() => handleCheckIn(b._id)}
                          className="px-3.5 py-1.5 bg-luxury-muted-blue hover:bg-luxury-light-frost text-stone-950 font-bold rounded-xl text-xs transition shadow-sm"
                        >
                          Check In Guest
                        </button>
                      )}

                      {b.status === 'Checked-In' && (
                        <button
                          onClick={() => handleCheckOut(b._id)}
                          className="px-3.5 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs transition shadow-sm"
                        >
                          Check Out & Bill
                        </button>
                      )}

                      <button
                        onClick={() => handleGenerateInvoice(b._id)}
                        className="px-2.5 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold rounded-xl text-xs transition"
                        title="Generate / View Folio"
                      >
                        <FileText className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- LIVE ROOM MATRIX GRID --- */}
      {activeTab === 'grid' && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 space-y-5">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
              <BedDouble className="w-5 h-5 text-amber-400" /> Real-Time Room Matrix
            </h3>
            <p className="text-xs text-stone-400">Visual floor plan with active room occupancy, maintenance, and cleaning statuses.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3.5">
            {rooms.map(room => (
              <div 
                key={room._id} 
                className={`p-4 rounded-2xl border text-center space-y-1.5 transition ${
                  room.status === 'Available' ? 'bg-luxury-deep-slate/30 border-luxury-muted-blue/40 text-luxury-light-frost' :
                  room.status === 'Occupied' ? 'bg-rose-950/30 border-rose-500/40 text-rose-300' :
                  room.status === 'Cleaning' ? 'bg-amber-950/30 border-amber-500/40 text-amber-300' :
                  room.status === 'Reserved' ? 'bg-blue-950/30 border-blue-500/40 text-blue-300' :
                  'bg-purple-950/30 border-purple-500/40 text-purple-300'
                }`}
              >
                <span className="font-mono font-extrabold text-base block text-stone-100">#{room.roomNumber}</span>
                <span className="text-[10px] block truncate font-medium text-stone-300">{room.roomType?.name}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider block py-0.5 rounded-full bg-stone-950/60">
                  {room.status}
                </span>
                <span className="text-[10px] font-mono text-stone-400 block">${room.pricePerNight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- BILLING & INVOICING DESK --- */}
      {activeTab === 'billing' && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 space-y-5">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-amber-400" /> Folio Billing & Payment Desk
            </h3>
            <p className="text-xs text-stone-400">All guest account folios, room charges, incidentals, and settlement receipts.</p>
          </div>

          <div className="space-y-3">
            {invoices.map(inv => (
              <div key={inv._id} className="bg-stone-950 border border-stone-800 p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono font-bold text-amber-400 text-sm">#{inv.invoiceNumber}</span>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      inv.paymentStatus === 'Paid' ? 'bg-luxury-light-frost/20 text-luxury-muted-blue border-luxury-muted-blue/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}>
                      {inv.paymentStatus}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-stone-200">{inv.guest?.name || 'Guest'}</p>
                  <p className="text-[11px] text-stone-400">Booking: <span className="font-mono">{inv.booking?.bookingId}</span></p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <span className="text-[10px] text-stone-500 block">Grand Total</span>
                    <span className="font-mono font-bold text-amber-400 text-base">${Number(inv.grandTotal).toFixed(2)}</span>
                  </div>
                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border border-stone-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" /> View & Settle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- GUEST SERVICE ORDERS QUEUE --- */}
      {activeTab === 'services' && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 space-y-5">
          <div>
            <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
              <ConciergeBell className="w-5 h-5 text-amber-400" /> Guest Service & In-Room Orders Queue
            </h3>
            <p className="text-xs text-stone-400">Live order requests from guest suites, dining room delivery, and concierge inquiries.</p>
          </div>

          <div className="space-y-3">
            {services.map(s => (
              <div key={s._id} className="bg-stone-950 border border-stone-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-serif font-bold text-stone-100 text-sm">{s.serviceType}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      s.status === 'Completed' ? 'bg-luxury-light-frost/15 text-luxury-muted-blue border-luxury-muted-blue/30' :
                      s.status === 'In Progress' ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' :
                      'bg-stone-800 text-stone-400 border-stone-700'
                    }`}>
                      {s.status}
                    </span>
                  </div>
                  <p className="text-stone-300">{s.description}</p>
                  <p className="text-[10px] text-stone-500">
                    Guest: {s.guest?.name} &bull; Room {s.booking?.room?.roomNumber} &bull; Folio Price: <span className="font-mono text-amber-400 font-bold">${s.cost}</span>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {s.status !== 'Completed' && (
                    <button
                      onClick={() => handleUpdateServiceStatus(s._id, 'Completed')}
                      className="px-3.5 py-1.5 bg-luxury-muted-blue hover:bg-luxury-light-frost text-stone-950 font-bold rounded-xl text-xs transition"
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- GUEST DIRECTORY & VIP MANAGEMENT --- */}
      {activeTab === 'guests' && (
        <div className="bg-stone-900/90 border border-stone-800 rounded-3xl p-6 space-y-5 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" /> Guest Directory & VIP Classifications ({guests.length})
              </h3>
              <p className="text-xs text-stone-400">Review patron profiles and elevate frequent guests to VIP Sovereign status.</p>
            </div>

            <div className="relative">
              <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search guests..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="bg-stone-950 border border-stone-800 rounded-2xl pl-9 pr-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950 text-stone-400 uppercase font-semibold border-b border-stone-800">
                <tr>
                  <th className="p-3.5">Guest Name</th>
                  <th className="p-3.5">Email Address</th>
                  <th className="p-3.5">Phone</th>
                  <th className="p-3.5">Tier Classification</th>
                  <th className="p-3.5 text-right">Desk Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60">
                {guests
                  .filter(g => g.name?.toLowerCase().includes(searchTerm.toLowerCase()) || g.email?.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(g => (
                    <tr key={g._id} className="hover:bg-stone-800/30 transition">
                      <td className="p-3.5 font-semibold text-stone-100 flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-bold text-xs">
                          {g.name?.charAt(0) || 'G'}
                        </div>
                        <span>{g.name}</span>
                      </td>
                      <td className="p-3.5 text-stone-400 font-mono">{g.email}</td>
                      <td className="p-3.5 text-stone-400 font-mono">{g.phone || '—'}</td>
                      <td className="p-3.5">
                        {g.guestType === 'VIP' ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#D4AF37] to-amber-300 text-[#001219] font-mono shadow-md uppercase tracking-wider">
                            <Crown className="w-3 h-3 fill-[#001219]" /> VIP Patron
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-stone-800 text-stone-300 border border-stone-700 uppercase tracking-wider font-mono">
                            NORMAL
                          </span>
                        )}
                      </td>
                      <td className="p-3.5 text-right">
                        <button
                          onClick={() => handleToggleGuestType(g._id, g.guestType)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ml-auto ${
                            g.guestType === 'VIP'
                              ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                              : 'bg-gradient-to-r from-[#D4AF37] to-amber-300 text-[#001219] hover:brightness-110 shadow-sm'
                          }`}
                        >
                          <Crown className="w-3 h-3" />
                          <span>{g.guestType === 'VIP' ? 'Set Normal' : 'Grant VIP'}</span>
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL: NEW WALK-IN BOOKING WIZARD --- */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-3xl w-full max-w-md space-y-4 text-stone-100 shadow-2xl">
            <h3 className="font-serif font-bold text-xl flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-amber-400" /> Walk-In Guest Reservation
            </h3>

            <form onSubmit={handleCreateWalkInBooking} className="space-y-3 text-xs">
              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Select Registered Guest</label>
                <select
                  value={newBooking.guestId}
                  onChange={e => setNewBooking({ ...newBooking, guestId: e.target.value })}
                  required
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Choose Guest Profile...</option>
                  {guests.map(g => (
                    <option key={g._id} value={g._id}>
                      {g.name} ({g.email}) {g.guestType === 'VIP' ? '★ [VIP Patron]' : '[Standard]'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-stone-400 mb-1 font-semibold">Select Available Room</label>
                <select
                  value={newBooking.roomId}
                  onChange={e => setNewBooking({ ...newBooking, roomId: e.target.value })}
                  required
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                >
                  <option value="">Choose Room...</option>
                  {rooms.filter(r => r.status === 'Available').map(r => (
                    <option key={r._id} value={r._id}>Room {r.roomNumber} - {r.roomType?.name} (${r.pricePerNight}/night)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Check-In Date</label>
                  <input
                    type="date"
                    value={newBooking.checkInDate}
                    onChange={e => setNewBooking({ ...newBooking, checkInDate: e.target.value })}
                    required
                    className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">Check-Out Date</label>
                  <input
                    type="date"
                    value={newBooking.checkOutDate}
                    onChange={e => setNewBooking({ ...newBooking, checkOutDate: e.target.value })}
                    required
                    className="w-full bg-stone-950 border border-stone-800 p-2.5 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowBookingModal(false)} className="px-4 py-2.5 bg-stone-800 text-stone-300 rounded-2xl font-bold">Cancel</button>
                <button type="submit" className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-2xl shadow-lg">Confirm Reservation</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Invoice Folio Modal */}
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
