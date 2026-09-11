import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { FileText, Printer, Eye } from 'lucide-react';

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState([]);
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      const res = await fetch('/api/invoices', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b border-stone-200 pb-6">
        <div>
          <span className="text-xs uppercase font-semibold tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Digital Invoices
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mt-2">Issued Invoices</h1>
          <p className="text-xs text-stone-500 mt-1">Formal guest folios, printable PDF invoices, and payment receipts.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {invoices.map(inv => (
          <Card key={inv._id} padding="p-6" className="flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-mono font-bold text-amber-800 text-sm">Invoice #{inv.invoiceNumber}</span>
                  <h3 className="font-serif font-bold text-lg text-stone-900 mt-0.5">{inv.guest?.name}</h3>
                </div>
                <Badge status={inv.paymentStatus === 'Paid' ? 'Confirmed' : 'Reserved'} label={inv.paymentStatus} />
              </div>

              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-100 text-xs space-y-1">
                <p className="text-stone-500">Booking ID: {inv.booking?.bookingId} • Room {inv.booking?.room?.roomNumber}</p>
                <p className="font-serif font-bold text-stone-900 text-base">Grand Total: ${inv.grandTotal?.toFixed(2)}</p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Link to={`/invoices/${inv._id}`}>
                <Button variant="secondary">
                  <Printer className="w-4 h-4" /> View / Print Folio
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
