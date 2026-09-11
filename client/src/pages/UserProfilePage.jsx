import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  User, Calendar, FileText, CreditCard, Clock, CheckCircle, 
  MapPin, Phone, Mail, LogOut, BedDouble, ArrowRight, ShieldCheck, Star
} from 'lucide-react';
import InvoiceModal from '../components/InvoiceModal';

export default function UserProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [bookings, setBookings] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }
    fetchUserData();
  }, [user]);

  const fetchUserData = async () => {
    setLoading(true);
    try {
      const [bRes, iRes] = await Promise.all([
        fetch('/api/bookings', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/invoices', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [bData, iData] = await Promise.all([bRes.json(), iRes.json()]);
      setBookings(Array.isArray(bData) ? bData : []);
      setInvoices(Array.isArray(iData) ? iData : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this reservation?')) return;
    try {
      const res = await fetch(`/api/bookings/${bookingId}/cancel`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Cancellation failed');
      alert('Reservation Cancelled Successfully.');
      fetchUserData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handlePayInvoice = async (invoiceId, paymentMethod) => {
    try {
      const res = await fetch(`/api/invoices/${invoiceId}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentMethod: paymentMethod || 'American Express' })
      });
      if (!res.ok) throw new Error('Payment failed');
      alert('Payment Settled Successfully! Your invoice is marked as PAID.');
      fetchUserData();
      setSelectedInvoice(null);
    } catch (err) {
      alert(err.message);
    }
  };

  const activeStay = bookings.find(b => b.status === 'Checked-In' || b.status === 'Confirmed') || bookings[0];

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6 sm:p-10 selection:bg-amber-500 selection:text-stone-950">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Top Header Card */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-600 via-amber-400 to-amber-200 p-[2px] shadow-lg shadow-amber-500/20">
              <div className="w-full h-full bg-stone-950 rounded-[22px] flex items-center justify-center font-serif font-bold text-2xl text-amber-400">
                {user?.name?.charAt(0) || 'G'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-amber-400 font-bold uppercase tracking-widest font-mono">GUEST PROFILE</span>
              <h1 className="text-2xl font-serif font-bold text-stone-100 mt-0.5">{user?.name}</h1>
              <p className="text-xs text-stone-400 font-mono mt-0.5">{user?.email} &bull; {user?.phone || 'No phone registered'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-stone-700"
            >
              <BedDouble className="w-4 h-4 text-amber-400" /> Book New Suite
            </Link>
            <button
              onClick={logout}
              className="px-4 py-2.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 border border-rose-500/30"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>
          </div>
        </div>

        {/* Profile Details & Active Stay Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Active Stay Card */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-400" /> Current Stay Status
            </h3>

            {activeStay ? (
              <div className="bg-stone-950 p-4 rounded-2xl border border-stone-800 space-y-3 text-xs">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-serif font-bold text-lg text-stone-100 block">Room #{activeStay.room?.roomNumber}</span>
                    <span className="text-stone-400">{activeStay.room?.roomType?.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                    activeStay.status === 'Checked-In' ? 'bg-luxury-light-frost/20 text-luxury-muted-blue border-luxury-muted-blue/30' :
                    activeStay.status === 'Confirmed' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                    'bg-stone-800 text-stone-400 border-stone-700'
                  }`}>
                    {activeStay.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-stone-800 space-y-1 font-mono text-stone-400">
                  <p>Check-In: <span className="text-stone-200">{new Date(activeStay.checkInDate).toLocaleDateString()}</span></p>
                  <p>Departure: <span className="text-stone-200">{new Date(activeStay.checkOutDate).toLocaleDateString()}</span></p>
                  <p>Booking ID: <span className="text-amber-400 font-bold">#{activeStay.bookingId}</span></p>
                </div>
              </div>
            ) : (
              <div className="bg-stone-950 p-6 rounded-2xl border border-stone-800 text-center text-xs text-stone-500">
                No active or confirmed reservations.
              </div>
            )}
          </div>

          {/* All Bookings History */}
          <div className="lg:col-span-2 bg-stone-900 border border-stone-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-400" /> Reservation History ({bookings.length})
            </h3>

            {bookings.length === 0 ? (
              <div className="bg-stone-950 p-8 rounded-2xl border border-stone-800 text-center text-xs text-stone-500">
                You have not made any bookings yet. Return to the home page to book a room.
              </div>
            ) : (
              <div className="space-y-3 max-h-[380px] overflow-y-auto">
                {bookings.map(b => (
                  <div key={b._id} className="bg-stone-950 border border-stone-800 p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400">#{b.bookingId}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          b.status === 'Checked-In' ? 'bg-luxury-light-frost/20 text-luxury-muted-blue border-luxury-muted-blue/30' :
                          b.status === 'Confirmed' ? 'bg-blue-500/20 text-blue-300 border-blue-500/30' :
                          b.status === 'Checked-Out' ? 'bg-stone-800 text-stone-400 border-stone-700' :
                          'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="font-serif font-bold text-stone-100 text-sm">Room {b.room?.roomNumber} &bull; {b.room?.roomType?.name}</p>
                      <p className="text-stone-400 font-mono">
                        {new Date(b.checkInDate).toLocaleDateString()} &rarr; {new Date(b.checkOutDate).toLocaleDateString()} &bull; Total: ${b.totalAmount}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {b.status === 'Confirmed' && (
                        <button
                          onClick={() => handleCancelBooking(b._id)}
                          className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-xl font-bold transition border border-rose-500/30"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Digital Invoices & Folio Statements */}
        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-4 shadow-xl">
          <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" /> Digital Folio Invoices ({invoices.length})
          </h3>

          {invoices.length === 0 ? (
            <div className="bg-stone-950 p-8 rounded-2xl border border-stone-800 text-center text-xs text-stone-500">
              No digital invoices generated for your account yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {invoices.map(inv => (
                <div key={inv._id} className="bg-stone-950 border border-stone-800 p-5 rounded-2xl flex items-center justify-between gap-4 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-amber-400 text-sm">#{inv.invoiceNumber}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        inv.paymentStatus === 'Paid' ? 'bg-luxury-light-frost/20 text-luxury-muted-blue border-luxury-muted-blue/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      }`}>
                        {inv.paymentStatus}
                      </span>
                    </div>
                    <p className="text-stone-400">Grand Total: <span className="font-mono font-bold text-stone-100">${Number(inv.grandTotal).toFixed(2)}</span></p>
                    <p className="text-[10px] text-stone-500">{new Date(inv.createdAt).toLocaleDateString()}</p>
                  </div>

                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-2xl font-bold transition flex items-center gap-1.5 border border-stone-700"
                  >
                    <FileText className="w-3.5 h-3.5 text-amber-400" /> View / Pay
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

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
