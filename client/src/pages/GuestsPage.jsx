import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Users, Search, Eye } from 'lucide-react';

export default function GuestsPage() {
  const [guests, setGuests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchGuests();
  }, []);

  const fetchGuests = async () => {
    try {
      const res = await fetch('/api/users?role=Guest', { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      setGuests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = guests.filter(g => g.name?.toLowerCase().includes(searchTerm.toLowerCase()) || g.email?.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b border-stone-200 pb-6">
        <div>
          <span className="text-xs uppercase font-semibold tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Guest Directory
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mt-2">Registered Hotel Guests</h1>
          <p className="text-xs text-stone-500 mt-1">View profiles, contact information, booking history, and guest preferences.</p>
        </div>
      </div>

      <Card padding="p-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search guest name or email..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-2 pl-10 pr-4 text-xs text-stone-900"
          />
        </div>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState icon={Users} title="No guests found" description="No guest profiles match the search query." />
      ) : (
        <Card padding="p-0" className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-500 uppercase font-semibold border-b border-stone-200">
                <tr>
                  <th className="p-4">Guest Name</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Phone Number</th>
                  <th className="p-4">Registration Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filtered.map(g => (
                  <tr key={g._id} className="hover:bg-stone-50/60 transition">
                    <td className="p-4 font-bold text-stone-900 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-stone-100 font-serif font-bold text-stone-800 flex items-center justify-center text-xs">
                        {g.name?.charAt(0)}
                      </div>
                      <span>{g.name}</span>
                    </td>
                    <td className="p-4 text-stone-600">{g.email}</td>
                    <td className="p-4 text-stone-600">{g.phone || 'N/A'}</td>
                    <td className="p-4 text-stone-500">{new Date(g.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 text-right">
                      <Link to={`/guests/${g._id}`}>
                        <Button variant="secondary" className="inline-flex">
                          <Eye className="w-3.5 h-3.5" /> View Profile
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
