import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { ArrowLeft, Printer, CheckCircle, Crown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function InvoiceDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchInvoice();
  }, [id]);

  const fetchInvoice = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setInvoice(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkPaid = async () => {
    try {
      const res = await fetch(`/api/invoices/${id}/pay`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentMethod: 'Credit Card' })
      });
      if (!res.ok) throw new Error('Failed to update invoice');
      fetchInvoice();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-xs text-stone-500">Loading invoice...</div>;
  if (!invoice) return <div className="p-8 text-center text-xs text-stone-500">Invoice not found.</div>;

  return (
    <div className="p-8 space-y-8 max-w-4xl mx-auto">
      <div>
        <button onClick={() => navigate('/invoices')} className="inline-flex items-center gap-2 text-xs font-semibold text-stone-600 hover:text-stone-900 transition">
          <ArrowLeft className="w-4 h-4" /> Back to Invoices List
        </button>
      </div>

      {/* Printable Folio Card */}
      <Card padding="p-8" className="space-y-8 print:shadow-none print:border-none print:p-0">
        {/* Invoice Header */}
        <div className="flex justify-between border-b border-stone-200 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-stone-900 font-serif font-bold text-xl">
              <Crown className="w-5 h-5 text-amber-600" />
              <span>LUXURYSTAY HOTEL & RESORT</span>
            </div>
            <p className="text-xs text-stone-500">100 Ocean Drive, Paradise Bay</p>
            <p className="text-xs text-stone-500">concierge@luxurystay.com | +1 (800) 555-LUXURY</p>
          </div>

          <div className="text-right space-y-2">
            <span className="font-mono font-bold text-amber-800 text-lg block">INVOICE #{invoice.invoiceNumber}</span>
            <Badge status={invoice.paymentStatus === 'Paid' ? 'Confirmed' : 'Reserved'} label={invoice.paymentStatus} />
            <p className="text-xs text-stone-400 mt-1">Date: {new Date(invoice.createdAt).toLocaleDateString()}</p>
          </div>
        </div>

        {/* Guest & Stay Summary */}
        <div className="grid grid-cols-2 gap-4 bg-stone-50 p-4 rounded-2xl border border-stone-200 text-xs">
          <div>
            <span className="text-stone-400 font-semibold block uppercase">Guest Folio</span>
            <p className="font-bold text-stone-900 text-sm mt-1">{invoice.guest?.name}</p>
            <p className="text-stone-500">{invoice.guest?.email}</p>
          </div>
          <div>
            <span className="text-stone-400 font-semibold block uppercase">Stay Details</span>
            <p className="font-bold text-stone-900 text-sm mt-1">Booking ID: {invoice.booking?.bookingId}</p>
            <p className="text-stone-500">Room {invoice.booking?.room?.roomNumber}</p>
          </div>
        </div>

        {/* Line Items Table */}
        <div className="border border-stone-200 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-200">
              <tr>
                <th className="p-3">Description</th>
                <th className="p-3 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              <tr>
                <td className="p-3 font-semibold text-stone-900">Room Stay Charges</td>
                <td className="p-3 text-right font-mono">${invoice.roomCharges?.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="p-3 font-semibold text-stone-900">In-Room Services & Amenities</td>
                <td className="p-3 text-right font-mono">${invoice.serviceCharges?.toFixed(2)}</td>
              </tr>
              <tr className="bg-stone-50 font-semibold">
                <td className="p-3 text-stone-600">Subtotal</td>
                <td className="p-3 text-right font-mono text-stone-900">${invoice.subtotal?.toFixed(2)}</td>
              </tr>
              <tr>
                <td className="p-3 text-stone-500">Hotel Tax ({invoice.taxRate}%)</td>
                <td className="p-3 text-right font-mono text-stone-500">+${invoice.taxAmount?.toFixed(2)}</td>
              </tr>
              {invoice.discount > 0 && (
                <tr>
                  <td className="p-3 text-emerald-700 font-semibold">Special Discount</td>
                  <td className="p-3 text-right font-mono text-emerald-700">-${invoice.discount?.toFixed(2)}</td>
                </tr>
              )}
              <tr className="bg-amber-50 font-bold text-sm text-amber-900 border-t border-amber-200">
                <td className="p-3 font-serif">Grand Total</td>
                <td className="p-3 text-right font-mono text-base">${invoice.grandTotal?.toFixed(2)}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-between pt-4 border-t border-stone-100 print:hidden">
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Print PDF Folio
          </Button>

          {invoice.paymentStatus !== 'Paid' && (user?.role === 'Admin' || user?.role === 'Receptionist' || user?.role === 'Manager') && (
            <Button variant="gold" onClick={handleMarkPaid}>
              <CheckCircle className="w-4 h-4" /> Mark Paid
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
