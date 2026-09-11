import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  Users, BedDouble, Plus, Shield, Settings, Activity,
  Trash2, Edit3, Layers, Search, CalendarCheck, Eye,
  Key, CheckCircle, Crown, X, Sparkles
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('rooms');

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [analytics, setAnalytics] = useState(null);

  const [settings, setSettings] = useState({
    hotelName: '',
    tagline: '',
    hotelAddress: '',
    hotelEmail: '',
    hotelPhone: '',
    taxRate: 12,
    currency: 'USD ($)',
    checkInTime: '14:00',
    checkOutTime: '11:00',
    cancellationPolicy: ''
  });

  // Room type modal
  const [showTypeModal, setShowTypeModal] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const [typeForm, setTypeForm] = useState({
    name: '',
    description: '',
    basePrice: 220,
    capacity: 2,
    amenities: 'King Bed, Carrara Marble Bath, Wi-Fi',
    imageUrl:
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'
  });

  // Physical room modal
  const [showRoomModal, setShowRoomModal] = useState(false);

  const [roomForm, setRoomForm] = useState({
    roomNumber: '',
    roomType: '',
    floor: 1,
    pricePerNight: 220,
    notes: ''
  });

  // Staff
  const [staffList, setStaffList] = useState([]);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);

  const [staffForm, setStaffForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Receptionist',
    phone: ''
  });

  const [showPasswordModal, setShowPasswordModal] = useState(false);

  const [passwordForm, setPasswordForm] = useState({
    staffId: '',
    staffName: '',
    newPassword: ''
  });

  // Housekeeping reports
  const [housekeepingReports, setHousekeepingReports] = useState([]);
  const [reportFilter, setReportFilter] = useState('All');

  const [resolvingReport, setResolvingReport] = useState(null);
  const [resolutionText, setResolutionText] = useState('');

  // Search
  const [searchTerm, setSearchTerm] = useState('');

  const token = localStorage.getItem('luxurystay_token');

  // ---------------------------------------------------------------------------
  // AUTHORIZATION
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    if (user.role !== 'Admin') {
      alert('Access restricted to Hotel Administrator accounts only.');
      navigate('/login');
      return;
    }

    fetchAdminData();
    const refreshTimer = window.setInterval(fetchAdminData, 30000);
    return () => window.clearInterval(refreshTimer);
  }, [user]);

  // ---------------------------------------------------------------------------
  // LOAD ADMIN DATA
  // ---------------------------------------------------------------------------

  const fetchAdminData = async () => {
    setLoading(true);

    try {
      const authHeaders = {
        Authorization: `Bearer ${token}`
      };

      const [
        uRes,
        rRes,
        tRes,
        bRes,
        sRes,
        aRes,
        stfRes,
        hrRes
      ] = await Promise.all([
        fetch('/api/users', { headers: authHeaders }),
        fetch('/api/rooms', { headers: authHeaders }),
        fetch('/api/rooms/types', { headers: authHeaders }),
        fetch('/api/bookings', { headers: authHeaders }),
        fetch('/api/settings', { headers: authHeaders }),
        fetch('/api/reports/analytics', { headers: authHeaders }),
        fetch('/api/staff', { headers: authHeaders }),
        fetch('/api/housekeeping-reports', { headers: authHeaders })
      ]);

      const responses = [
        uRes,
        rRes,
        tRes,
        bRes,
        sRes,
        aRes,
        stfRes,
        hrRes
      ];

      if (responses.some(response => response.status === 401)) {
        alert('Your administrator session has expired. Please log in again.');
        navigate('/login');
        return;
      }

      if (responses.some(response => response.status === 403)) {
        alert('You are not authorized to access administrator data.');
        navigate('/login');
        return;
      }

      const [
        uData,
        rData,
        tData,
        bData,
        sData,
        aData,
        stfData,
        hrData
      ] = await Promise.all(
        responses.map(async response => {
          const contentType = response.headers.get('content-type') || '';

          if (!contentType.includes('application/json')) {
            return null;
          }

          return response.json();
        })
      );

      setUsers(Array.isArray(uData) ? uData : []);
      setRooms(Array.isArray(rData) ? rData : []);
      setRoomTypes(Array.isArray(tData) ? tData : []);
      setBookings(Array.isArray(bData) ? bData : []);

      if (sData && typeof sData === 'object') {
        setSettings(prev => ({
          ...prev,
          ...sData
        }));
      }

      if (aData && typeof aData === 'object') {
        setAnalytics(aData);
      }

      setStaffList(Array.isArray(stfData) ? stfData : []);
      setHousekeepingReports(Array.isArray(hrData) ? hrData : []);
    } catch (err) {
      console.error('Admin data loading error:', err);
      alert(
        'Unable to load administrator data from the database. Please check the server and MongoDB connection.'
      );
    } finally {
      setLoading(false);
    }
  };

  // ---------------------------------------------------------------------------
  // ROOM TYPE MANAGEMENT
  // ---------------------------------------------------------------------------

  const handleOpenCreateType = () => {
    setEditingType(null);

    setTypeForm({
      name: '',
      description: '',
      basePrice: 220,
      capacity: 2,
      amenities: 'King Bed, Marble Bathroom, Ocean Terrace',
      imageUrl:
        'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=800&q=80'
    });

    setShowTypeModal(true);
  };

  const handleOpenEditType = type => {
    setEditingType(type);

    setTypeForm({
      name: type.name || '',
      description: type.description || '',
      basePrice: type.basePrice || 0,
      capacity: type.capacity || 2,
      amenities: Array.isArray(type.amenities)
        ? type.amenities.join(', ')
        : type.amenities || '',
      imageUrl: type.imageUrl || ''
    });

    setShowTypeModal(true);
  };

  const handleSaveType = async event => {
    event.preventDefault();

    try {
      const amenitiesArr = typeForm.amenities
        .split(',')
        .map(item => item.trim())
        .filter(Boolean);

      const payload = {
        name: typeForm.name.trim(),
        description: typeForm.description.trim(),
        basePrice: Number(typeForm.basePrice),
        capacity: Number(typeForm.capacity),
        amenities: amenitiesArr,
        imageUrl: typeForm.imageUrl.trim()
      };

      const url = editingType
        ? `/api/rooms/types/${editingType._id}`
        : '/api/rooms/types';

      const method = editingType ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Room category operation failed.'
        );
      }

      setShowTypeModal(false);
      setEditingType(null);

      await fetchAdminData();

      alert(
        `Room Type "${typeForm.name}" ${
          editingType ? 'updated' : 'added'
        } successfully.`
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDeleteType = async typeId => {
    if (
      !window.confirm(
        'Are you sure you want to delete this room type?'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/rooms/types/${typeId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Room type deletion failed.'
        );
      }

      await fetchAdminData();

      alert('Room category deleted successfully.');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // PHYSICAL ROOM MANAGEMENT
  // ---------------------------------------------------------------------------

  const handleCreateRoom = async event => {
    event.preventDefault();

    try {
      const payload = {
        ...roomForm,
        roomNumber: roomForm.roomNumber.trim(),
        floor: Number(roomForm.floor),
        pricePerNight: Number(roomForm.pricePerNight)
      };

      const response = await fetch('/api/rooms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to add room.'
        );
      }

      setShowRoomModal(false);

      setRoomForm({
        roomNumber: '',
        roomType: '',
        floor: 1,
        pricePerNight: 220,
        notes: ''
      });

      await fetchAdminData();

      alert('Room unit added to the MongoDB inventory successfully.');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDeleteRoom = async roomId => {
    if (
      !window.confirm(
        'Delete this physical room from the database inventory?'
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/rooms/${roomId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to delete room.'
        );
      }

      await fetchAdminData();

      alert('Room deleted successfully.');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // BOOKING OPERATIONS
  // ---------------------------------------------------------------------------

  const handleUpdateBookingStatus = async (
    bookingId,
    newStatus
  ) => {
    let endpoint;

    if (newStatus === 'Checked-In') {
      endpoint = `/api/bookings/${bookingId}/check-in`;
    } else if (newStatus === 'Checked-Out') {
      endpoint = `/api/bookings/${bookingId}/check-out`;
    } else {
      endpoint = `/api/bookings/${bookingId}/cancel`;
    }

    try {
      const response = await fetch(endpoint, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Booking status update failed.'
        );
      }

      await fetchAdminData();

      alert(`Booking updated to "${newStatus}".`);
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // SETTINGS
  // ---------------------------------------------------------------------------

  const handleSaveSettings = async event => {
    event.preventDefault();

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to save hotel settings.'
        );
      }

      await fetchAdminData();

      alert('Hotel global settings saved to the database.');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // STAFF MANAGEMENT
  // ADMIN ONLY
  // ---------------------------------------------------------------------------

  const handleOpenCreateStaff = () => {
    setEditingStaff(null);

    setStaffForm({
      name: '',
      email: '',
      password: '',
      role: 'Receptionist',
      phone: ''
    });

    setShowStaffModal(true);
  };

  const handleOpenEditStaff = staff => {
    setEditingStaff(staff);

    setStaffForm({
      name: staff.name || '',
      email: staff.email || '',
      password: '',
      role:
        staff.role === 'Manager' ||
        staff.role === 'Receptionist' ||
        staff.role === 'Housekeeping' ||
        staff.role === 'Maintenance'
          ? staff.role
          : 'Receptionist',
      phone: staff.phone || ''
    });

    setShowStaffModal(true);
  };

  const handleSaveStaff = async event => {
    event.preventDefault();

    try {
      const url = editingStaff
        ? `/api/staff/${editingStaff._id}`
        : '/api/staff';

      const method = editingStaff ? 'PUT' : 'POST';

      const payload = {
        name: staffForm.name.trim(),
        email: staffForm.email.trim(),
        role: staffForm.role,
        phone: staffForm.phone.trim()
      };

      if (!editingStaff) {
        payload.password = staffForm.password;
      } else if (staffForm.password.trim()) {
        payload.password = staffForm.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Staff operation failed.'
        );
      }

      setShowStaffModal(false);
      setEditingStaff(null);

      await fetchAdminData();

      alert(
        `Staff member ${
          editingStaff ? 'updated' : 'created'
        } successfully.`
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleDeleteStaff = async (staffId, name) => {
    if (
      !window.confirm(
        `Are you sure you want to permanently delete staff account "${name}"?`
      )
    ) {
      return;
    }

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to delete staff member.'
        );
      }

      await fetchAdminData();

      alert(data.message || 'Staff account deleted.');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleToggleStaffStatus = async staffId => {
    try {
      const response = await fetch(
        `/api/staff/${staffId}/status`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to update staff status.'
        );
      }

      await fetchAdminData();

      alert(data.message || 'Staff status updated.');
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  const handleOpenResetPassword = staff => {
    setPasswordForm({
      staffId: staff._id,
      staffName: staff.name,
      newPassword: ''
    });

    setShowPasswordModal(true);
  };

  const handleSavePassword = async event => {
    event.preventDefault();

    try {
      const response = await fetch(
        `/api/staff/${passwordForm.staffId}/password`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            password: passwordForm.newPassword
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Password reset failed.'
        );
      }

      setShowPasswordModal(false);

      setPasswordForm({
        staffId: '',
        staffName: '',
        newPassword: ''
      });

      alert(
        data.message || 'Password reset successfully.'
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // HOUSEKEEPING REPORTS
  // ---------------------------------------------------------------------------

  const handleResolveReport = async reportId => {
    try {
      const response = await fetch(
        `/api/housekeeping-reports/${reportId}/resolve`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            resolution:
              resolutionText.trim() ||
              'Inspected and resolved by Administrator.'
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to resolve report.'
        );
      }

      setResolvingReport(null);
      setResolutionText('');

      await fetchAdminData();

      alert(
        'Housekeeping report marked as resolved.'
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // VIP / NORMAL GUEST TYPE
  // ---------------------------------------------------------------------------

  const handleToggleGuestType = async (
    guestId,
    currentType
  ) => {
    const newType =
      currentType === 'VIP' ? 'NORMAL' : 'VIP';

    try {
      const response = await fetch(
        `/api/users/${guestId}/guest-type`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            guestType: newType
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || 'Failed to update guest type.'
        );
      }

      await fetchAdminData();

      alert(
        `Guest classification updated to ${newType}.`
      );
    } catch (err) {
      console.error(err);
      alert(err.message);
    }
  };

  // ---------------------------------------------------------------------------
  // FILTERED BOOKINGS
  // ---------------------------------------------------------------------------

  const normalizedSearchTerm =
    searchTerm.toLowerCase().trim();

  const filteredBookings = bookings.filter(booking => {
    if (!normalizedSearchTerm) {
      return true;
    }

    return (
      booking.bookingId
        ?.toLowerCase()
        .includes(normalizedSearchTerm) ||
      booking.guest?.name
        ?.toLowerCase()
        .includes(normalizedSearchTerm) ||
      booking.room?.roomNumber
        ?.toString()
        .includes(normalizedSearchTerm)
    );
  });

  const guestUsers = users.filter(
    currentUser => currentUser.role === 'Guest'
  );

  const filteredReports = housekeepingReports.filter(
    report =>
      reportFilter === 'All' ||
      report.status === reportFilter
  );

  // ---------------------------------------------------------------------------
  // LOADING
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-950 text-stone-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-xs text-stone-400 font-mono uppercase tracking-widest">
            Loading Administrator Control Center...
          </p>
        </div>
      </div>
    );
  }

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 p-6 sm:p-10 selection:bg-amber-500 selection:text-stone-950">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ------------------------------------------------------------------ */}
        {/* HEADER */}
        {/* ------------------------------------------------------------------ */}

        <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">

          <div>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-amber-400 font-mono">
              <Shield className="w-4 h-4" />
              Administrator Command Center
            </div>

            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 mt-1">
              Hotel Administration & Content Suite
            </h1>

            <p className="text-xs text-stone-400 mt-1">
              Logged in as{' '}
              <span className="font-bold text-amber-300">
                {user?.name}
              </span>{' '}
              ({user?.email}) &bull; Manage live database
              rooms, staff, bookings, guests and hotel
              configuration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-2xl text-xs font-bold transition flex items-center gap-2 border border-stone-700"
            >
              <Eye className="w-4 h-4 text-amber-400" />
              View Public Landing Page
            </Link>
          </div>
        </div>

        {/* ------------------------------------------------------------------ */}
        {/* KPI */}
        {/* ------------------------------------------------------------------ */}

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">

          <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-3xl space-y-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
              Configured Room Types
            </span>

            <span className="text-3xl font-serif font-bold text-stone-100">
              {roomTypes.length}
            </span>

            <span className="text-[11px] text-amber-400 block">
              Database records
            </span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-3xl space-y-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
              Physical Room Units
            </span>

            <span className="text-3xl font-serif font-bold text-amber-400">
              {rooms.length}
            </span>

            <span className="text-[11px] text-stone-400 block">
              Total database inventory
            </span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-3xl space-y-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
              Total Bookings
            </span>

            <span className="text-3xl font-serif font-bold text-blue-400">
              {bookings.length}
            </span>

            <span className="text-[11px] text-stone-400 block">
              Active & past reservations
            </span>
          </div>

          <div className="bg-stone-900/90 border border-stone-800 p-5 rounded-3xl space-y-1">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider block">
              Gross Revenue Settled
            </span>

            <span className="text-3xl font-serif font-bold text-emerald-400">
              $
              {(
                analytics?.revenue?.totalPaid || 0
              ).toLocaleString()}
            </span>

            <span className="text-[11px] text-stone-400 block">
              Calculated from paid folios
            </span>
          </div>

        </div>

        {/* ------------------------------------------------------------------ */}
        {/* NAVIGATION */}
        {/* ------------------------------------------------------------------ */}

        <div className="flex flex-wrap items-center gap-2 bg-stone-900 p-1.5 rounded-2xl border border-stone-800 text-xs">

          {[
            {
              id: 'staff',
              label: 'Staff Management',
              icon: Shield
            },
            {
              id: 'housekeeping_reports',
              label: 'Housekeeping Reports',
              icon: Sparkles
            },
            {
              id: 'rooms',
              label: 'Room Types',
              icon: BedDouble
            },
            {
              id: 'inventory',
              label: 'Physical Room Units',
              icon: Layers
            },
            {
              id: 'bookings',
              label: 'Guest Bookings',
              icon: CalendarCheck
            },
            {
              id: 'guests',
              label: 'Registered Guests',
              icon: Users
            },
            {
              id: 'settings',
              label: 'Hotel Policies & Tax',
              icon: Settings
            }
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected =
              activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() =>
                  setActiveTab(tab.id)
                }
                className={`px-4 py-2.5 rounded-xl font-bold transition flex items-center gap-2 ${
                  isSelected
                    ? 'bg-amber-400 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}

        </div>

        {/* ------------------------------------------------------------------ */}
        {/* STAFF MANAGEMENT */}
        {/* ------------------------------------------------------------------ */}

        {activeTab === 'staff' && (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-mono uppercase tracking-wider font-bold mb-1">
                  <Shield className="w-3.5 h-3.5" />
                  Strict Admin Security Authority
                </div>

                <h3 className="font-serif font-bold text-xl text-stone-100 flex items-center gap-2">
                  Staff Accounts & Role Administration ({staffList.length})
                </h3>

                <p className="text-xs text-stone-400 mt-1">
                  Only the Administrator can create, edit,
                  deactivate, reset passwords, or delete
                  staff accounts.
                </p>
              </div>

              <button
                onClick={handleOpenCreateStaff}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:brightness-110 text-stone-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                Add Staff Account
              </button>

            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">

                <thead className="bg-stone-950 text-stone-400 uppercase font-semibold border-b border-stone-800">
                  <tr>
                    <th className="p-3.5">Staff Name</th>
                    <th className="p-3.5">Email Address</th>
                    <th className="p-3.5">Assigned Role</th>
                    <th className="p-3.5">Contact Phone</th>
                    <th className="p-3.5">Account Status</th>
                    <th className="p-3.5 text-right">
                      Administrative Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-800/60">

                  {staffList.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-stone-500 italic"
                      >
                        No staff accounts found in the
                        database.
                      </td>
                    </tr>
                  ) : (
                    staffList.map(staff => (
                      <tr
                        key={staff._id}
                        className="hover:bg-stone-800/30 transition"
                      >

                        <td className="p-3.5 font-semibold text-stone-100">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-bold text-xs">
                              {staff.name
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </div>

                            <span>
                              {staff.name}
                            </span>
                          </div>
                        </td>

                        <td className="p-3.5 text-stone-400 font-mono">
                          {staff.email}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                              staff.role === 'Manager'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : staff.role === 'Receptionist'
                                ? 'bg-sky-500/15 text-sky-300 border-sky-500/30'
                                : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                            }`}
                          >
                            {staff.role}
                          </span>
                        </td>

                        <td className="p-3.5 text-stone-400 font-mono">
                          {staff.phone || '—'}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              staff.isActive !== false
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {staff.isActive !== false
                              ? 'Active'
                              : 'Deactivated'}
                          </span>
                        </td>

                        <td className="p-3.5 text-right space-x-2">

                          <button
                            onClick={() =>
                              handleOpenEditStaff(
                                staff
                              )
                            }
                            className="p-1.5 bg-stone-800 hover:bg-stone-700 text-stone-300 rounded-xl transition"
                            title="Edit Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              handleOpenResetPassword(
                                staff
                              )
                            }
                            className="p-1.5 bg-stone-800 hover:bg-amber-500/20 hover:text-amber-400 text-stone-300 rounded-xl transition"
                            title="Reset Password"
                          >
                            <Key className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              handleToggleStaffStatus(
                                staff._id
                              )
                            }
                            className={`p-1.5 rounded-xl transition ${
                              staff.isActive !== false
                                ? 'bg-stone-800 hover:bg-rose-500/20 hover:text-rose-400 text-stone-300'
                                : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                            }`}
                            title={
                              staff.isActive !== false
                                ? 'Deactivate Account'
                                : 'Activate Account'
                            }
                          >
                            <Activity className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() =>
                              handleDeleteStaff(
                                staff._id,
                                staff.name
                              )
                            }
                            className="p-1.5 bg-stone-800 hover:bg-rose-600/30 hover:text-rose-400 text-stone-400 rounded-xl transition"
                            title="Delete Staff"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>

                        </td>
                      </tr>
                    ))
                  )}

                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* HOUSEKEEPING REPORTS */}
        {/* ------------------------------------------------------------------ */}

        {activeTab === 'housekeeping_reports' && (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

              <div>
                <h3 className="font-serif font-bold text-xl text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  Housekeeping Reports & Room Incidents (
                  {housekeepingReports.length}
                  )
                </h3>

                <p className="text-xs text-stone-400 mt-1">
                  Permanent MongoDB records submitted by
                  housekeeping. These reports are available
                  to both Administrator and Manager.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-stone-400">
                  Filter Status:
                </span>

                <select
                  value={reportFilter}
                  onChange={event =>
                    setReportFilter(
                      event.target.value
                    )
                  }
                  className="bg-stone-950 border border-stone-800 p-2 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500"
                >
                  <option value="All">
                    All Reports
                  </option>
                  <option value="Open">
                    Open
                  </option>
                  <option value="In Progress">
                    In Progress
                  </option>
                  <option value="Resolved">
                    Resolved
                  </option>
                </select>
              </div>

            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">

                <thead className="bg-stone-950 text-stone-400 uppercase font-semibold border-b border-stone-800">
                  <tr>
                    <th className="p-3.5">Room</th>
                    <th className="p-3.5">Report Type</th>
                    <th className="p-3.5">Housekeeper Notes</th>
                    <th className="p-3.5">Reported By</th>
                    <th className="p-3.5">Logged Time</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">
                      Resolution
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-800/60">

                  {filteredReports.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-stone-500 italic"
                      >
                        No housekeeping reports found
                        in MongoDB.
                      </td>
                    </tr>
                  ) : (
                    filteredReports.map(report => (
                      <tr
                        key={report._id}
                        className="hover:bg-stone-800/30 transition"
                      >

                        <td className="p-3.5">
                          <span className="font-bold text-stone-100">
                            Room{' '}
                            {report.roomId
                              ?.roomNumber || '—'}
                          </span>

                          <span className="text-[10px] text-stone-500 block">
                            {report.roomId
                              ?.roomType?.name || ''}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              report.reportType ===
                                'Damaged' ||
                              report.reportType ===
                                'Maintenance Issue'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : report.reportType ===
                                  'Needs Cleaning'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : report.reportType ===
                                  'Cleaning Completed'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                            }`}
                          >
                            {report.reportType}
                          </span>
                        </td>

                        <td className="p-3.5 text-stone-300 max-w-xs">
                          {report.notes || '—'}
                        </td>

                        <td className="p-3.5 text-stone-400">
                          {report.reportedBy?.name ||
                            'Staff Member'}
                        </td>

                        <td className="p-3.5 text-stone-500 font-mono">
                          {report.createdAt
                            ? new Date(
                                report.createdAt
                              ).toLocaleString()
                            : '—'}
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              report.status ===
                              'Resolved'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : report.status ===
                                  'In Progress'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>

                        <td className="p-3.5 text-right">

                          {report.status !==
                          'Resolved' ? (
                            <button
                              onClick={() => {
                                setResolvingReport(
                                  report
                                );
                                setResolutionText('');
                              }}
                              className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs transition"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">
                              Resolved:{' '}
                              {report.resolution ||
                                'Cleared'}{' '}
                              (
                              {report.resolvedBy
                                ?.name || 'Admin'}
                              )
                            </span>
                          )}

                        </td>
                      </tr>
                    ))
                  )}

                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* ROOM TYPES */}
        {/* ------------------------------------------------------------------ */}

        {activeTab === 'rooms' && (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

              <div>
                <h3 className="font-serif font-bold text-xl text-stone-100 flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-amber-400" />
                  Room Categories & Pricing Management
                </h3>

                <p className="text-xs text-stone-400 mt-1">
                  Room categories are loaded from MongoDB.
                  Create or modify categories without
                  hardcoding operational data.
                </p>
              </div>

              <button
                onClick={handleOpenCreateType}
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:brightness-110 transition"
              >
                <Plus className="w-4 h-4" />
                Add Room Category
              </button>

            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">

              {roomTypes.length === 0 ? (
                <div className="col-span-full p-10 text-center border border-dashed border-stone-800 rounded-3xl">
                  <BedDouble className="w-8 h-8 mx-auto text-stone-600 mb-3" />
                  <p className="text-sm text-stone-400">
                    No room categories exist in the
                    database.
                  </p>
                </div>
              ) : (
                roomTypes.map(type => (
                  <div
                    key={type._id}
                    className="bg-stone-950 border border-stone-800 rounded-3xl overflow-hidden flex flex-col justify-between group shadow-xl"
                  >

                    <div className="h-48 w-full overflow-hidden relative bg-stone-900">

                      {type.imageUrl ? (
                        <img
                          src={type.imageUrl}
                          alt={type.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-600">
                          <BedDouble className="w-10 h-10" />
                        </div>
                      )}

                      <div className="absolute top-3 right-3 bg-stone-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-mono font-bold text-amber-400 border border-amber-500/30">
                        Cap: {type.capacity} Guests
                      </div>
                    </div>

                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">

                      <div className="space-y-2">

                        <h4 className="font-serif font-bold text-lg text-stone-100">
                          {type.name}
                        </h4>

                        <div className="flex items-baseline gap-1">
                          <span className="text-xl font-extrabold text-red-500 font-mono tracking-tight">
                            ${type.basePrice}
                          </span>

                          <span className="text-xs font-semibold text-red-400 font-sans">
                            / night
                          </span>
                        </div>

                        <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
                          {type.description}
                        </p>

                        {Array.isArray(
                          type.amenities
                        ) &&
                          type.amenities.length >
                            0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {type.amenities
                                .slice(0, 3)
                                .map(
                                  (
                                    amenity,
                                    index
                                  ) => (
                                    <span
                                      key={index}
                                      className="text-[9px] bg-stone-900 text-stone-400 px-2 py-0.5 rounded-full border border-stone-800"
                                    >
                                      {amenity}
                                    </span>
                                  )
                                )}
                            </div>
                          )}

                      </div>

                      <div className="pt-3 border-t border-stone-800 flex items-center justify-between">

                        <button
                          onClick={() =>
                            handleOpenEditType(
                              type
                            )
                          }
                          className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          Edit
                        </button>

                        <button
                          onClick={() =>
                            handleDeleteType(
                              type._id
                            )
                          }
                          className="px-3 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-rose-500/30"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>

                      </div>
                    </div>
                  </div>
                ))
              )}

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* PHYSICAL ROOM INVENTORY */}
        {/* ------------------------------------------------------------------ */}

        {activeTab === 'inventory' && (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

              <div>
                <h3 className="font-serif font-bold text-xl text-stone-100 flex items-center gap-2">
                  <Layers className="w-5 h-5 text-amber-400" />
                  Physical Room Units Inventory
                </h3>

                <p className="text-xs text-stone-400 mt-1">
                  Individual rooms are stored and
                  retrieved from MongoDB.
                </p>
              </div>

              <button
                onClick={() =>
                  setShowRoomModal(true)
                }
                className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 hover:brightness-110 transition"
              >
                <Plus className="w-4 h-4" />
                Add Room Unit
              </button>

            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3.5">

              {rooms.length === 0 ? (
                <div className="col-span-full p-10 text-center border border-dashed border-stone-800 rounded-3xl">
                  <Layers className="w-8 h-8 mx-auto text-stone-600 mb-3" />
                  <p className="text-sm text-stone-400">
                    No physical rooms exist in the
                    database.
                  </p>
                </div>
              ) : (
                rooms.map(room => (
                  <div
                    key={room._id}
                    className="bg-stone-950 border border-stone-800 p-4 rounded-2xl space-y-2 text-center relative group"
                  >

                    <div className="flex justify-between items-center">

                      <span className="font-mono font-bold text-base text-stone-100">
                        #{room.roomNumber}
                      </span>

                      <button
                        onClick={() =>
                          handleDeleteRoom(
                            room._id
                          )
                        }
                        className="text-stone-600 hover:text-rose-400 transition"
                        title="Delete Room"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                    </div>

                    <p className="text-[10px] text-stone-400 truncate">
                      {room.roomType?.name ||
                        'Standard'}
                    </p>

                    <span
                      className={`text-[9px] font-bold px-2 py-0.5 rounded-full border block truncate ${
                        room.status ===
                        'Available'
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                          : room.status ===
                            'Occupied'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : room.status ===
                            'Cleaning'
                          ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                          : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                      }`}
                    >
                      {room.status}
                    </span>

                    <p className="text-[10px] font-mono text-amber-400 font-bold">
                      ${room.pricePerNight}
                    </p>

                  </div>
                ))
              )}

            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* BOOKINGS */}
        {/* ------------------------------------------------------------------ */}

        {activeTab === 'bookings' && (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">

              <div>
                <h3 className="font-serif font-bold text-xl text-stone-100 flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5 text-amber-400" />
                  Active Reservations & Guest Folios
                </h3>

                <p className="text-xs text-stone-400 mt-1">
                  Review live bookings and process
                  check-in/check-out operations.
                </p>
              </div>

              <div className="relative w-full sm:w-64">

                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />

                <input
                  type="text"
                  placeholder="Search booking ID / guest..."
                  value={searchTerm}
                  onChange={event =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  className="w-full bg-stone-950 border border-stone-800 rounded-2xl pl-9 pr-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />

              </div>
            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-left text-xs">

                <thead className="bg-stone-950 text-stone-400 uppercase font-semibold border-b border-stone-800">
                  <tr>
                    <th className="p-3.5">
                      Booking ID
                    </th>
                    <th className="p-3.5">
                      Guest Information
                    </th>
                    <th className="p-3.5">
                      Suite Allocated
                    </th>
                    <th className="p-3.5">
                      Stay Period
                    </th>
                    <th className="p-3.5">
                      Total Amount
                    </th>
                    <th className="p-3.5">
                      Status
                    </th>
                    <th className="p-3.5 text-right">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-800/60">

                  {filteredBookings.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="p-8 text-center text-stone-500 italic"
                      >
                        No bookings found.
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map(
                      booking => (
                        <tr
                          key={booking._id}
                          className="hover:bg-stone-800/30 transition"
                        >

                          <td className="p-3.5 font-mono font-bold text-amber-400">
                            #
                            {
                              booking.bookingId
                            }
                          </td>

                          <td className="p-3.5">
                            <span className="font-semibold text-stone-100 block">
                              {booking.guest
                                ?.name ||
                                'Guest'}
                            </span>

                            <span className="text-[10px] text-stone-500 font-mono">
                              {
                                booking.guest
                                  ?.email
                              }
                            </span>
                          </td>

                          <td className="p-3.5">
                            <span className="font-bold text-stone-200">
                              Room{' '}
                              {
                                booking.room
                                  ?.roomNumber
                              }
                            </span>

                            <span className="text-[10px] text-stone-500 block">
                              {
                                booking.room
                                  ?.roomType
                                  ?.name
                              }
                            </span>
                          </td>

                          <td className="p-3.5 font-mono text-stone-400">
                            {booking.checkInDate
                              ? new Date(
                                  booking.checkInDate
                                ).toLocaleDateString()
                              : '—'}{' '}
                            &rarr;{' '}
                            {booking.checkOutDate
                              ? new Date(
                                  booking.checkOutDate
                                ).toLocaleDateString()
                              : '—'}
                          </td>

                          <td className="p-3.5 font-mono font-bold text-stone-100">
                            $
                            {
                              booking.totalAmount
                            }
                          </td>

                          <td className="p-3.5">

                            <span
                              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                booking.status ===
                                'Checked-In'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : booking.status ===
                                    'Confirmed'
                                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                  : booking.status ===
                                    'Checked-Out'
                                  ? 'bg-stone-800 text-stone-400 border-stone-700'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              }`}
                            >
                              {
                                booking.status
                              }
                            </span>

                          </td>

                          <td className="p-3.5 text-right space-x-2">

                            {booking.status ===
                              'Confirmed' && (
                              <button
                                onClick={() =>
                                  handleUpdateBookingStatus(
                                    booking._id,
                                    'Checked-In'
                                  )
                                }
                                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-xl text-xs transition"
                              >
                                Check In
                              </button>
                            )}

                            {booking.status ===
                              'Checked-In' && (
                              <button
                                onClick={() =>
                                  handleUpdateBookingStatus(
                                    booking._id,
                                    'Checked-Out'
                                  )
                                }
                                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-400 text-white font-bold rounded-xl text-xs transition"
                              >
                                Check Out
                              </button>
                            )}

                          </td>

                        </tr>
                      )
                    )
                  )}

                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* GUESTS */}
        {/* ------------------------------------------------------------------ */}

        {activeTab === 'guests' && (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl">

            <div>
              <h3 className="font-serif font-bold text-xl text-stone-100 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-400" />
                Registered Patrons & Guest Directory (
                {guestUsers.length}
                )
              </h3>

              <p className="text-xs text-stone-400 mt-1">
                Guest classification supports exactly
                two types: VIP and NORMAL.
              </p>
            </div>

            <div className="overflow-x-auto">

              <table className="w-full text-left text-xs">

                <thead className="bg-stone-950 text-stone-400 uppercase font-semibold border-b border-stone-800">
                  <tr>
                    <th className="p-3.5">
                      Patron Name
                    </th>
                    <th className="p-3.5">
                      Email Address
                    </th>
                    <th className="p-3.5">
                      Guest Tier
                    </th>
                    <th className="p-3.5">
                      Contact Phone
                    </th>
                    <th className="p-3.5">
                      Account Status
                    </th>
                    <th className="p-3.5 text-right">
                      VIP Management
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-800/60">

                  {guestUsers.length ===
                  0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="p-8 text-center text-stone-500 italic"
                      >
                        No registered guests in
                        the database yet.
                      </td>
                    </tr>
                  ) : (
                    guestUsers.map(guest => (
                      <tr
                        key={guest._id}
                        className="hover:bg-stone-800/30 transition"
                      >

                        <td className="p-3.5 font-semibold text-stone-100">
                          <div className="flex items-center gap-2">

                            <div className="w-7 h-7 rounded-full bg-stone-800 border border-stone-700 flex items-center justify-center text-stone-300 font-bold text-xs">
                              {guest.name
                                ?.charAt(0)
                                ?.toUpperCase()}
                            </div>

                            <span>
                              {guest.name}
                            </span>

                          </div>
                        </td>

                        <td className="p-3.5 text-stone-400 font-mono">
                          {guest.email}
                        </td>

                        <td className="p-3.5">

                          {guest.guestType ===
                          'VIP' ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#D4AF37] to-amber-300 text-[#001219] font-mono shadow-md uppercase tracking-wider">
                              <Crown className="w-3 h-3 fill-[#001219]" />
                              VIP
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-stone-800 text-stone-300 border border-stone-700 uppercase tracking-wider font-mono">
                              NORMAL
                            </span>
                          )}

                        </td>

                        <td className="p-3.5 text-stone-400 font-mono">
                          {guest.phone || '—'}
                        </td>

                        <td className="p-3.5">

                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              guest.isActive !==
                              false
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {guest.isActive !==
                            false
                              ? 'Active'
                              : 'Deactivated'}
                          </span>

                        </td>

                        <td className="p-3.5 text-right">

                          <button
                            onClick={() =>
                              handleToggleGuestType(
                                guest._id,
                                guest.guestType
                              )
                            }
                            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 ml-auto ${
                              guest.guestType ===
                              'VIP'
                                ? 'bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700'
                                : 'bg-gradient-to-r from-[#D4AF37] to-amber-300 text-[#001219] hover:brightness-110 shadow-sm'
                            }`}
                          >
                            <Crown className="w-3 h-3" />

                            <span>
                              {guest.guestType ===
                              'VIP'
                                ? 'Set Normal'
                                : 'Grant VIP'}
                            </span>
                          </button>

                        </td>

                      </tr>
                    ))
                  )}

                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------------ */}
        {/* SETTINGS */}
        {/* ------------------------------------------------------------------ */}

        {activeTab === 'settings' && (
          <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 sm:p-8 max-w-3xl space-y-6 shadow-2xl">

            <h3 className="font-serif font-bold text-xl text-stone-100 flex items-center gap-2">
              <Settings className="w-5 h-5 text-amber-400" />
              Hotel Policies & Branding Configuration
            </h3>

            <form
              onSubmit={handleSaveSettings}
              className="space-y-4 text-xs"
            >

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                <div>
                  <label className="block text-stone-400 font-bold mb-1">
                    Hotel Name
                  </label>

                  <input
                    type="text"
                    value={settings.hotelName}
                    onChange={event =>
                      setSettings({
                        ...settings,
                        hotelName:
                          event.target.value
                      })
                    }
                    required
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">
                    Hero Tagline
                  </label>

                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={event =>
                      setSettings({
                        ...settings,
                        tagline:
                          event.target.value
                      })
                    }
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                <div>
                  <label className="block text-stone-400 font-bold mb-1">
                    Tax Rate (%)
                  </label>

                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={settings.taxRate}
                    onChange={event =>
                      setSettings({
                        ...settings,
                        taxRate: Number(
                          event.target.value
                        )
                      })
                    }
                    required
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">
                    Standard Check-In
                  </label>

                  <input
                    type="text"
                    value={settings.checkInTime}
                    onChange={event =>
                      setSettings({
                        ...settings,
                        checkInTime:
                          event.target.value
                      })
                    }
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 font-bold mb-1">
                    Standard Check-Out
                  </label>

                  <input
                    type="text"
                    value={settings.checkOutTime}
                    onChange={event =>
                      setSettings({
                        ...settings,
                        checkOutTime:
                          event.target.value
                      })
                    }
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

              </div>

              <div>
                <label className="block text-stone-400 font-bold mb-1">
                  Cancellation Policy
                </label>

                <textarea
                  value={
                    settings.cancellationPolicy
                  }
                  onChange={event =>
                    setSettings({
                      ...settings,
                      cancellationPolicy:
                        event.target.value
                    })
                  }
                  rows="3"
                  className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 text-stone-950 font-bold rounded-2xl text-xs uppercase tracking-wider shadow-lg shadow-amber-500/20 transition"
              >
                Save Hotel Configuration
              </button>

            </form>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL: ROOM TYPE */}
        {/* ================================================================== */}

        {showTypeModal && (
          <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">

            <div className="bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-3xl w-full max-w-md space-y-4 text-stone-100 shadow-2xl">

              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-xl flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-amber-400" />
                  {editingType
                    ? 'Edit Room Category'
                    : 'Create Room Category'}
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setShowTypeModal(false)
                  }
                  className="p-1 text-stone-400 hover:text-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-xs text-stone-400">
                This information is stored in MongoDB
                and used by the hotel application.
              </p>

              <form
                onSubmit={handleSaveType}
                className="space-y-3 text-xs"
              >

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">
                    Room Category Name
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. Deluxe Ocean Suite"
                    value={typeForm.name}
                    onChange={event =>
                      setTypeForm({
                        ...typeForm,
                        name: event.target.value
                      })
                    }
                    required
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">
                      Base Price ($/Night)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        typeForm.basePrice
                      }
                      onChange={event =>
                        setTypeForm({
                          ...typeForm,
                          basePrice: Number(
                            event.target.value
                          )
                        })
                      }
                      required
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-red-400 font-bold focus:outline-none focus:border-red-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">
                      Max Guests
                    </label>

                    <input
                      type="number"
                      min="1"
                      value={
                        typeForm.capacity
                      }
                      onChange={event =>
                        setTypeForm({
                          ...typeForm,
                          capacity: Number(
                            event.target.value
                          )
                        })
                      }
                      required
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">
                    Description
                  </label>

                  <textarea
                    placeholder="Describe luxury features and furnishings..."
                    value={
                      typeForm.description
                    }
                    onChange={event =>
                      setTypeForm({
                        ...typeForm,
                        description:
                          event.target.value
                      })
                    }
                    required
                    rows="2"
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">
                    Amenities
                  </label>

                  <input
                    type="text"
                    placeholder="King Bed, Marble Bathroom, Ocean View"
                    value={
                      typeForm.amenities
                    }
                    onChange={event =>
                      setTypeForm({
                        ...typeForm,
                        amenities:
                          event.target.value
                      })
                    }
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">
                    Room Image URL
                  </label>

                  <input
                    type="url"
                    placeholder="https://..."
                    value={
                      typeForm.imageUrl
                    }
                    onChange={event =>
                      setTypeForm({
                        ...typeForm,
                        imageUrl:
                          event.target.value
                      })
                    }
                    required
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">

                  <button
                    type="button"
                    onClick={() =>
                      setShowTypeModal(false)
                    }
                    className="px-4 py-2.5 bg-stone-800 text-stone-300 rounded-2xl font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-2xl shadow-lg"
                  >
                    {editingType
                      ? 'Update Category'
                      : 'Save Room Category'}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL: PHYSICAL ROOM */}
        {/* ================================================================== */}

        {showRoomModal && (
          <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">

            <div className="bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-3xl w-full max-w-md space-y-4 text-stone-100 shadow-2xl">

              <div className="flex items-center justify-between">
                <h3 className="font-serif font-bold text-xl flex items-center gap-2">
                  <Plus className="w-5 h-5 text-amber-400" />
                  Add Physical Room Unit
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setShowRoomModal(false)
                  }
                  className="p-1 text-stone-400 hover:text-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form
                onSubmit={handleCreateRoom}
                className="space-y-3 text-xs"
              >

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">
                    Room Number
                  </label>

                  <input
                    type="text"
                    placeholder="e.g. 502"
                    value={
                      roomForm.roomNumber
                    }
                    onChange={event =>
                      setRoomForm({
                        ...roomForm,
                        roomNumber:
                          event.target.value
                      })
                    }
                    required
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">
                    Assign Room Category
                  </label>

                  <select
                    value={
                      roomForm.roomType
                    }
                    onChange={event =>
                      setRoomForm({
                        ...roomForm,
                        roomType:
                          event.target.value
                      })
                    }
                    required
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  >
                    <option value="">
                      Select Category...
                    </option>

                    {roomTypes.map(type => (
                      <option
                        key={type._id}
                        value={type._id}
                      >
                        {type.name} — $
                        {type.basePrice}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3">

                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">
                      Floor
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={roomForm.floor}
                      onChange={event =>
                        setRoomForm({
                          ...roomForm,
                          floor: Number(
                            event.target.value
                          )
                        })
                      }
                      required
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">
                      Nightly Rate ($)
                    </label>

                    <input
                      type="number"
                      min="0"
                      value={
                        roomForm.pricePerNight
                      }
                      onChange={event =>
                        setRoomForm({
                          ...roomForm,
                          pricePerNight:
                            Number(
                              event.target.value
                            )
                        })
                      }
                      required
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">
                    Notes
                  </label>

                  <textarea
                    rows="2"
                    value={roomForm.notes}
                    onChange={event =>
                      setRoomForm({
                        ...roomForm,
                        notes:
                          event.target.value
                      })
                    }
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-3">

                  <button
                    type="button"
                    onClick={() =>
                      setShowRoomModal(false)
                    }
                    className="px-4 py-2.5 bg-stone-800 text-stone-300 rounded-2xl font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-2xl shadow-lg"
                  >
                    Add to Inventory
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL: STAFF */}
        {/* ================================================================== */}

        {showStaffModal && (
          <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">

            <div className="bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-3xl w-full max-w-md space-y-4 text-stone-100 shadow-2xl">

              <div className="flex items-center justify-between border-b border-stone-800 pb-3">

                <h3 className="font-serif font-bold text-xl flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-400" />

                  {editingStaff
                    ? 'Edit Staff Account'
                    : 'Register New Staff Member'}
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setShowStaffModal(false)
                  }
                  className="p-1 text-stone-400 hover:text-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>

              </div>

              <form
                onSubmit={handleSaveStaff}
                className="space-y-3 text-xs"
              >

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">
                    Full Legal Name
                  </label>

                  <input
                    type="text"
                    placeholder="Staff member name"
                    value={staffForm.name}
                    onChange={event =>
                      setStaffForm({
                        ...staffForm,
                        name: event.target.value
                      })
                    }
                    required
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">
                    Corporate Email Address
                  </label>

                  <input
                    type="email"
                    placeholder="name@hotel.com"
                    value={staffForm.email}
                    onChange={event =>
                      setStaffForm({
                        ...staffForm,
                        email: event.target.value
                      })
                    }
                    required
                    autoComplete="off"
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                {!editingStaff && (
                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">
                      Initial Access Password
                    </label>

                    <input
                      type="password"
                      placeholder="Minimum 6 characters"
                      value={
                        staffForm.password
                      }
                      onChange={event =>
                        setStaffForm({
                          ...staffForm,
                          password:
                            event.target.value
                        })
                      }
                      required
                      minLength={6}
                      autoComplete="new-password"
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">

                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">
                      Assigned Role
                    </label>

                    <select
                      value={staffForm.role}
                      onChange={event =>
                        setStaffForm({
                          ...staffForm,
                          role:
                            event.target.value
                        })
                      }
                      required
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                    >
                      <option value="Manager">
                        Manager
                      </option>

                      <option value="Receptionist">
                        Receptionist
                      </option>

                      <option value="Housekeeping">
                        Housekeeping
                      </option>

                      <option value="Maintenance">
                        Maintenance
                      </option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-stone-400 mb-1 font-semibold">
                      Contact Phone
                    </label>

                    <input
                      type="text"
                      placeholder="Contact number"
                      value={staffForm.phone}
                      onChange={event =>
                        setStaffForm({
                          ...staffForm,
                          phone:
                            event.target.value
                        })
                      }
                      autoComplete="off"
                      className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                </div>

                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3 text-[10px] text-stone-400">
                  Only the Administrator can create
                  or modify these staff accounts. Staff
                  passwords are not displayed after
                  creation.
                </div>

                <div className="flex justify-end gap-3 pt-3">

                  <button
                    type="button"
                    onClick={() =>
                      setShowStaffModal(false)
                    }
                    className="px-4 py-2.5 bg-stone-800 text-stone-300 rounded-2xl font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-2xl shadow-lg"
                  >
                    {editingStaff
                      ? 'Update Staff Member'
                      : 'Create Staff Member'}
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL: RESET PASSWORD */}
        {/* ================================================================== */}

        {showPasswordModal && (
          <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">

            <div className="bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-3xl w-full max-w-sm space-y-4 text-stone-100 shadow-2xl">

              <div className="flex items-center justify-between border-b border-stone-800 pb-3">

                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                  <Key className="w-5 h-5 text-amber-400" />
                  Reset Password
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setShowPasswordModal(false)
                  }
                  className="p-1 text-stone-400 hover:text-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>

              </div>

              <p className="text-xs text-stone-400">
                Updating credentials for{' '}
                <span className="font-bold text-stone-200">
                  {passwordForm.staffName}
                </span>
                .
              </p>

              <form
                onSubmit={handleSavePassword}
                className="space-y-4 text-xs"
              >

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">
                    New Secure Password
                  </label>

                  <input
                    type="password"
                    placeholder="Enter new password"
                    value={
                      passwordForm.newPassword
                    }
                    onChange={event =>
                      setPasswordForm({
                        ...passwordForm,
                        newPassword:
                          event.target.value
                      })
                    }
                    required
                    minLength={6}
                    autoComplete="new-password"
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">

                  <button
                    type="button"
                    onClick={() =>
                      setShowPasswordModal(
                        false
                      )
                    }
                    className="px-4 py-2.5 bg-stone-800 text-stone-300 rounded-2xl font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-2xl shadow-lg"
                  >
                    Save Password
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

        {/* ================================================================== */}
        {/* MODAL: RESOLVE HOUSEKEEPING REPORT */}
        {/* ================================================================== */}

        {resolvingReport && (
          <div className="fixed inset-0 bg-stone-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4">

            <div className="bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-3xl w-full max-w-md space-y-4 text-stone-100 shadow-2xl">

              <div className="flex items-center justify-between border-b border-stone-800 pb-3">

                <h3 className="font-serif font-bold text-lg flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                  Resolve Incident Report
                </h3>

                <button
                  type="button"
                  onClick={() =>
                    setResolvingReport(null)
                  }
                  className="p-1 text-stone-400 hover:text-stone-100"
                >
                  <X className="w-5 h-5" />
                </button>

              </div>

              <div className="bg-stone-950 p-3.5 rounded-2xl border border-stone-800 text-xs space-y-1">

                <p>
                  <span className="text-stone-400 font-semibold">
                    Room:
                  </span>{' '}
                  #
                  {
                    resolvingReport.roomId
                      ?.roomNumber
                  }
                </p>

                <p>
                  <span className="text-stone-400 font-semibold">
                    Report Type:
                  </span>{' '}
                  {
                    resolvingReport.reportType
                  }
                </p>

                <p>
                  <span className="text-stone-400 font-semibold">
                    Housekeeper Notes:
                  </span>{' '}
                  {resolvingReport.notes ||
                    '—'}
                </p>

              </div>

              <form
                onSubmit={event => {
                  event.preventDefault();
                  handleResolveReport(
                    resolvingReport._id
                  );
                }}
                className="space-y-4 text-xs"
              >

                <div>
                  <label className="block text-stone-400 mb-1 font-semibold">
                    Resolution Notes
                  </label>

                  <textarea
                    rows="3"
                    placeholder="Describe the resolution or inspection..."
                    value={resolutionText}
                    onChange={event =>
                      setResolutionText(
                        event.target.value
                      )
                    }
                    required
                    className="w-full bg-stone-950 border border-stone-800 p-3 rounded-2xl text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex justify-end gap-3 pt-2">

                  <button
                    type="button"
                    onClick={() =>
                      setResolvingReport(null)
                    }
                    className="px-4 py-2.5 bg-stone-800 text-stone-300 rounded-2xl font-bold"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold rounded-2xl shadow-lg"
                  >
                    Confirm Resolution
                  </button>

                </div>

              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}