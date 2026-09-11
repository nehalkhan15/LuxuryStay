import React, { useState, useEffect } from 'react';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { Sparkles, CheckCircle, Wrench } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function HousekeepingPage() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState('');
  const [issueText, setIssueText] = useState('');
  const token = localStorage.getItem('luxurystay_token');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tRes, rRes] = await Promise.all([
        fetch('/api/housekeeping', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/rooms')
      ]);
      const [tData, rData] = await Promise.all([tRes.json(), rRes.json()]);
      setTasks(Array.isArray(tData) ? tData : []);
      setRooms(Array.isArray(rData) ? rData : []);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkCleaned = async (taskId) => {
    try {
      const res = await fetch(`/api/housekeeping/${taskId}/complete`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to update task');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleReportIssue = async (e) => {
    e.preventDefault();
    if (!selectedRoomId || !issueText) return;
    try {
      const res = await fetch('/api/maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ roomId: selectedRoomId, problemDescription: issueText, priority: 'High' })
      });
      if (!res.ok) throw new Error('Failed to report issue');
      setShowModal(false);
      setIssueText('');
      alert('Maintenance Request Created! Room status set to Under Maintenance.');
      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <div>
          <span className="text-xs uppercase font-semibold tracking-widest text-amber-800 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            Room Sanitation
          </span>
          <h1 className="text-3xl font-serif font-bold text-stone-900 mt-2">Housekeeping Management</h1>
          <p className="text-xs text-stone-500 mt-1">Manage cleaning assignments, room inspections, and damage reports.</p>
        </div>

        <Button variant="secondary" onClick={() => setShowModal(true)}>
          <Wrench className="w-4 h-4 text-purple-600" /> Report Maintenance Issue
        </Button>
      </div>

      {tasks.length === 0 ? (
        <EmptyState icon={Sparkles} title="All rooms are clean" description="No pending housekeeping tasks assigned at this time." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map(task => (
            <Card key={task._id} padding="p-6" className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-serif font-bold text-xl text-stone-900">Room {task.room?.roomNumber}</span>
                  <p className="text-xs font-semibold text-stone-500 mt-0.5">{task.room?.roomType?.name} • Floor {task.room?.floor}</p>
                </div>
                <Badge status={task.status === 'Completed' ? 'Confirmed' : 'Reserved'} label={task.status} />
              </div>

              <div className="bg-stone-50 p-3 rounded-2xl border border-stone-200 text-xs text-stone-700">
                {task.notes || 'Routine check-out deep cleaning & sanitation'}
              </div>

              {task.status !== 'Completed' && (
                <div className="pt-2">
                  <Button variant="gold" onClick={() => handleMarkCleaned(task._id)} className="w-full">
                    <CheckCircle className="w-4 h-4" /> Mark Room Cleaned & Available
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-stone-200 p-8 rounded-3xl w-full max-w-md space-y-4 text-stone-900 shadow-2xl">
            <h3 className="font-serif font-bold text-xl">Report Maintenance Issue</h3>
            <form onSubmit={handleReportIssue} className="space-y-3 text-xs">
              <select
                value={selectedRoomId}
                onChange={e => setSelectedRoomId(e.target.value)}
                required
                className="w-full bg-stone-50 border border-stone-200 p-3 rounded-2xl text-stone-900"
              >
                <option value="">Select Room...</option>
                {rooms.map(r => (
                  <option key={r._id} value={r._id}>Room {r.roomNumber} ({r.status})</option>
                ))}
              </select>
              <textarea
                placeholder="Describe problem (e.g. Bathroom sink leaking, AC thermostat defect)..."
                value={issueText}
                onChange={e => setIssueText(e.target.value)}
                required
                rows="3"
                className="w-full bg-stone-50 border border-stone-200 p-3 rounded-2xl text-stone-900"
              ></textarea>
              <div className="flex justify-end gap-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                <Button type="submit" variant="primary">Submit Ticket</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
