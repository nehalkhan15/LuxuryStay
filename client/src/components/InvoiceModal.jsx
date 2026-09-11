import React, { useState, useEffect } from 'react';
import { Printer, CheckCircle, Clock, X, Building2, Crown, DollarSign, CreditCard } from 'lucide-react';

export default function InvoiceModal({ invoice, onClose, onPay }) {
  const [settings, setSettings] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState('American Express');

  useEffect(() => {
    fetch('/api/settings')
      .then(res => res.json())
      .then(data => data && setSettings(data))
      .catch(() => {});
  }, []);

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const hotelTitle = settings?.hotelName || 'LuxuryStay Grand Resort & Ocean Suites';
  const hotelAddr = settings?.hotelAddress || '100 Ocean Promenade, Suite 500, Paradise Bay';
  const hotelEmail = settings?.hotelEmail || 'concierge@luxurystay.com';
  const hotelPhone = settings?.hotelPhone || '+1 (800) 555-LUXURY';

  return (
    <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-stone-900 border border-stone-800 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in duration-200">
        {/* Modal Header */}
        <div className="p-4 px-6 border-b border-stone-800 flex items-center justify-between bg-stone-950/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Crown className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h3 className="font-serif font-bold text-stone-100 text-sm">Official Guest Folio & Invoice</h3>
              <span className="text-[10px] text-amber-400 font-mono">#{invoice.invoiceNumber}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-stone-400 hover:text-white rounded-xl hover:bg-stone-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Folio Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-stone-200 text-xs print:p-0 print:text-black print:bg-white">
          {/* Hotel Letterhead */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-stone-800/80 pb-6 print:border-black">
            <div>
              <span className="font-cinzel text-base sm:text-lg font-bold tracking-widest text-amber-400 print:text-black block">
                {hotelTitle}
              </span>
              <p className="text-[11px] text-stone-400 print:text-stone-700 mt-1">{hotelAddr}</p>
              <p className="text-[11px] text-stone-500 print:text-stone-700">{hotelEmail} &bull; {hotelPhone}</p>
            </div>
            <div className="text-left sm:text-right">
              <span className={`inline-flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                invoice.paymentStatus === 'Paid' 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {invoice.paymentStatus === 'Paid' ? <CheckCircle className="w-3.5 h-3.5" /> : <Clock className="w-3.5 h-3.5" />}
                {invoice.paymentStatus}
              </span>
              <p className="text-[10px] text-stone-400 mt-1.5 font-mono print:text-black">
                Date: {new Date(invoice.createdAt || Date.now()).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Guest & Reservation Info Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-stone-950 p-4 rounded-2xl border border-stone-800 print:bg-stone-50 print:border-black">
            <div>
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Guest Information</span>
              <p className="font-serif font-bold text-stone-100 print:text-black text-sm mt-1">{invoice.guest?.name || 'Valued Guest'}</p>
              <p className="text-stone-400 print:text-stone-700 mt-0.5">{invoice.guest?.email}</p>
              <p className="text-stone-400 print:text-stone-700">{invoice.guest?.phone}</p>
            </div>
            <div>
              <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">Stay & Booking Reference</span>
              <p className="font-mono font-bold text-amber-400 print:text-black mt-1">ID: {invoice.booking?.bookingId || 'BK-DIRECT'}</p>
              <p className="text-stone-300 print:text-black">Room: <span className="font-bold">Room {invoice.booking?.room?.roomNumber || 'Assigned'}</span> ({invoice.booking?.room?.roomType?.name || 'Luxury Suite'})</p>
              {invoice.paidAt && (
                <p className="text-emerald-400 text-[10px] mt-1 print:text-black font-semibold">Settled On: {new Date(invoice.paidAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {/* Itemized Line Items */}
          <div className="border border-stone-800 rounded-2xl overflow-hidden print:border-black">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-950 text-stone-400 font-semibold uppercase tracking-wider border-b border-stone-800 print:bg-stone-100 print:text-black">
                <tr>
                  <th className="p-3.5">Description & Service Item</th>
                  <th className="p-3.5 text-right">Amount (USD)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800/60 print:divide-black">
                <tr>
                  <td className="p-3.5">
                    <span className="font-semibold text-stone-200 print:text-black block">Accommodation / Room Stay Charges</span>
                    <span className="text-[10px] text-stone-500">Nightly accommodation rate calculated for reservation period</span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-stone-200 print:text-black">
                    ${Number(invoice.roomCharges || 0).toFixed(2)}
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5">
                    <span className="font-semibold text-stone-200 print:text-black block">Incidentals & In-Room Services</span>
                    <span className="text-[10px] text-stone-500">Dining, spa, laundry, and concierge requests</span>
                  </td>
                  <td className="p-3.5 text-right font-mono font-bold text-stone-200 print:text-black">
                    ${Number(invoice.serviceCharges || 0).toFixed(2)}
                  </td>
                </tr>

                <tr className="bg-stone-950/60 font-semibold text-stone-300 print:bg-stone-50 print:text-black">
                  <td className="p-3.5">Subtotal</td>
                  <td className="p-3.5 text-right font-mono">${Number(invoice.subtotal || 0).toFixed(2)}</td>
                </tr>

                <tr>
                  <td className="p-3.5 text-stone-400 print:text-black">
                    Municipal & Luxury Hospitality Tax ({invoice.taxRate || 12}%)
                  </td>
                  <td className="p-3.5 text-right font-mono text-stone-400 print:text-black">
                    +${Number(invoice.taxAmount || 0).toFixed(2)}
                  </td>
                </tr>

                {Number(invoice.discount || 0) > 0 && (
                  <tr>
                    <td className="p-3.5 text-emerald-400 print:text-black">Complimentary VIP / Promotional Discount</td>
                    <td className="p-3.5 text-right font-mono text-emerald-400 print:text-black">-${Number(invoice.discount).toFixed(2)}</td>
                  </tr>
                )}

                <tr className="bg-gradient-to-r from-amber-500/15 to-transparent border-t-2 border-amber-500/40 text-amber-300 print:text-black print:bg-stone-100">
                  <td className="p-4 font-serif font-bold text-sm">Grand Total</td>
                  <td className="p-4 text-right font-mono font-extrabold text-base text-amber-400 print:text-black">
                    ${Number(invoice.grandTotal || 0).toFixed(2)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p className="text-[10px] text-stone-500 text-center italic">
            Thank you for choosing {hotelTitle}. We look forward to welcoming you back!
          </p>
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 px-6 border-t border-stone-800 bg-stone-950 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition border border-stone-700"
          >
            <Printer className="w-4 h-4 text-amber-400" /> Print / Save PDF
          </button>

          {invoice.paymentStatus !== 'Paid' && onPay && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={paymentMethod}
                onChange={e => setPaymentMethod(e.target.value)}
                className="bg-stone-900 border border-stone-700 text-stone-200 text-xs rounded-2xl px-3 py-2 focus:outline-none"
              >
                <option value="American Express">American Express</option>
                <option value="Visa Platinum">Visa Platinum</option>
                <option value="Mastercard World">Mastercard World</option>
                <option value="Direct Wire / Cash">Direct Wire / Cash</option>
              </select>
              <button
                onClick={() => onPay(invoice._id, paymentMethod)}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-stone-950 rounded-2xl text-xs font-bold shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-2"
              >
                <CreditCard className="w-4 h-4" /> Settle Payment
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
