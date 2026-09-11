import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import { FileText, DollarSign, Eye } from 'lucide-react';

export default function BillingPage() {
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
            Financial Settlement
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mt-2">Billing Console</h1>
          <p className="text-xs text-stone-500 mt-1">Review guest stay charges, service fees, hotel taxes, and payment status.</p>
        </div>
      </div>

      <Card padding="p-0" className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-200">
              <tr>
                <th className="p-4">Invoice #</th>
                <th className="p-4">Guest</th>
                <th className="p-4">Room Charges</th>
                <th className="p-4">Service Charges</th>
                <th className="p-4">Tax Amount</th>
                <th className="p-4">Grand Total</th>
                <th className="p-4">Payment Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {invoices.map(inv => (
                <tr key={inv._id} className="hover:bg-stone-50/60 transition">
                  <td className="p-4 font-mono font-bold text-amber-800">{inv.invoiceNumber}</td>
                  <td className="p-4 font-semibold text-stone-900">{inv.guest?.name}</td>
                  <td className="p-4 font-mono text-stone-600">${inv.roomCharges?.toFixed(2)}</td>
                  <td className="p-4 font-mono text-stone-600">${inv.serviceCharges?.toFixed(2)}</td>
                  <td className="p-4 font-mono text-stone-500">${inv.taxAmount?.toFixed(2)}</td>
                  <td className="p-4 font-mono font-bold text-stone-900">${inv.grandTotal?.toFixed(2)}</td>
                  <td className="p-4">
                    <Badge status={inv.paymentStatus === 'Paid' ? 'Confirmed' : 'Reserved'} label={inv.paymentStatus} />
                  </td>
                  <td className="p-4 text-right">
                    <Link to={`/invoices/${inv._id}`}>
                      <Button variant="secondary" className="inline-flex">
                        <Eye className="w-3.5 h-3.5" /> View Invoice
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
