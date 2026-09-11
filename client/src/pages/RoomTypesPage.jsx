import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { BedDouble, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function RoomTypesPage() {
  const { user } = useAuth();
  const [types, setTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [newType, setNewType] = useState({ name: '', description: '', basePrice: 200, capacity: 2 });
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchTypes();
  }, []);

  const fetchTypes = async () => {
    try {
      const res = await fetch('/api/rooms/types');
      const data = await res.json();
      setTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateType = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/rooms/types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(newType)
      });
      if (!res.ok) throw new Error('Failed to add room category');
      setShowModal(false);
      fetchTypes();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center border-b border-stone-200 pb-6">
        <div>
          <span className="text-xs uppercase font-semibold tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            System Configuration
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mt-2">Room Categories & Pricing</h1>
          <p className="text-xs text-stone-500 mt-1">Configure luxury room types, base rates, and guest capacities.</p>
        </div>

        {user?.role === 'Admin' && (
          <Button variant="primary" onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4" /> Add Room Category
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {types.map(t => (
          <Card key={t._id} padding="p-6" className="space-y-4">
            <div className="flex justify-between items-start">
              <h3 className="font-serif font-bold text-xl text-stone-900">{t.name}</h3>
              <span className="font-mono font-bold text-amber-800 text-lg">${t.basePrice}</span>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">{t.description}</p>
            <p className="text-xs text-stone-400 font-semibold">Max Capacity: {t.capacity} Guests</p>
          </Card>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 p-8 rounded-3xl w-full max-w-md space-y-4 text-stone-900 shadow-2xl">
            <h3 className="font-serif font-bold text-xl">New Room Category</h3>
            <form onSubmit={handleCreateType} className="space-y-3 text-xs">
              <input
                type="text"
                placeholder="Category Name (e.g. Executive Suite)"
                value={newType.name}
                onChange={e => setNewType({ ...newType, name: e.target.value })}
                required
                className="w-full bg-stone-50 border border-stone-200 p-3 rounded-2xl text-stone-900"
              />
              <textarea
                placeholder="Description"
                value={newType.description}
                onChange={e => setNewType({ ...newType, description: e.target.value })}
                required
                className="w-full bg-stone-50 border border-stone-200 p-3 rounded-2xl text-stone-900"
              ></textarea>
              <input
                type="number"
                placeholder="Base Price ($)"
                value={newType.basePrice}
                onChange={e => setNewType({ ...newType, basePrice: Number(e.target.value) })}
                required
                className="w-full bg-stone-50 border border-stone-200 p-3 rounded-2xl text-stone-900"
              />
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Create Category</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
