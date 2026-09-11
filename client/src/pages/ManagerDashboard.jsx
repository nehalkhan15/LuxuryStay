import React, { useState, useEffect } from 'react';

import {
  PieChart,
  TrendingUp,
  Star,
  BedDouble,
  Calendar,
  DollarSign,
  MessageSquare,
  CheckCircle,
  Sparkles,
  Wrench,
  Shield,
  Search,
  Send,
  Clock,
  ClipboardList,
  Plus,
  Trash2,
  Edit3
} from 'lucide-react';

export default function ManagerDashboard({
  activeTab: parentActiveTab
}) {
  const [internalTab, setInternalTab] = useState('overview');

  const activeTab =
    parentActiveTab &&
    parentActiveTab !== 'dashboard'
      ? parentActiveTab
      : internalTab;

  const [analytics, setAnalytics] = useState(null);
  const [feedbackList, setFeedbackList] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [responseText, setResponseText] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  const [housekeepingReports, setHousekeepingReports] =
    useState([]);

  const [assignmentStaff, setAssignmentStaff] =
    useState([]);

  const [maintenanceList, setMaintenanceList] =
    useState([]);

  const [reportStatusFilter, setReportStatusFilter] =
    useState('All');

  // ---- TASK ASSIGNMENT STATE ----
  const [taskList, setTaskList] = useState([]);
  const [taskCategoryFilter, setTaskCategoryFilter] = useState('All');
  const [taskStatusFilter, setTaskStatusFilter] = useState('All');
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    category: 'General',
    priority: 'Normal',
    assignedTo: '',
    room: '',
    dueDate: '',
    notes: ''
  });

  const token =
    localStorage.getItem('luxurystay_token');

  // ============================================================
  // INITIAL LOAD + AUTO REFRESH
  // ============================================================
  useEffect(() => {
    fetchManagerData();

    const refreshTimer =
      window.setInterval(fetchManagerData, 30000);

    return () =>
      window.clearInterval(refreshTimer);
  }, []);

  // ============================================================
  // FETCH ALL MANAGER DATA
  // ============================================================
  const fetchManagerData = async () => {
    try {
      const [
        aRes,
        fRes,
        bRes,
        rRes,
        hrRes,
        mRes,
        staffRes,
        taskRes
      ] = await Promise.all([
        fetch('/api/reports/analytics', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),

        fetch('/api/feedback'),

        fetch('/api/bookings', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),

        fetch('/api/rooms'),

        fetch('/api/housekeeping-reports', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),

        fetch('/api/maintenance', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),

        fetch('/api/users?staff=true', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }),

        fetch('/api/tasks', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })
      ]);

      const [
        aData,
        fData,
        bData,
        rData,
        hrData,
        mData,
        staffData,
        taskData
      ] = await Promise.all([
        aRes.json(),
        fRes.json(),
        bRes.json(),
        rRes.json(),
        hrRes.json(),
        mRes.json(),
        staffRes.json(),
        taskRes.json()
      ]);

      setAnalytics(aData);

      setFeedbackList(
        Array.isArray(fData) ? fData : []
      );

      setBookings(
        Array.isArray(bData) ? bData : []
      );

      setRooms(
        Array.isArray(rData) ? rData : []
      );

      setHousekeepingReports(
        Array.isArray(hrData) ? hrData : []
      );

      setMaintenanceList(
        Array.isArray(mData) ? mData : []
      );

      setTaskList(
        Array.isArray(taskData) ? taskData : []
      );

      /*
       * Keep all active staff.
       *
       * We specifically filter Maintenance staff when
       * displaying the maintenance assignment dropdown.
       */
      setAssignmentStaff(
        Array.isArray(staffData)
          ? staffData.filter(
              staff =>
                staff.role !== 'Guest' &&
                staff.isActive !== false
            )
          : []
      );
    } catch (err) {
      console.error(
        'Manager dashboard data error:',
        err
      );
    }
  };

  // ============================================================
  // ASSIGN HOUSEKEEPING REPORT
  // ============================================================
  const handleAssignHousekeepingReport = async (
    reportId,
    assignedTo
  ) => {
    if (!assignedTo) return;

    try {
      const response = await fetch(
        `/api/housekeeping-reports/${reportId}/assign`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            assignedTo
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Assignment update failed.'
        );
      }

      await fetchManagerData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================
  // ASSIGN MAINTENANCE REQUEST
  // ============================================================
  const handleAssignMaintenance = async (
    requestId,
    assignedTo
  ) => {
    if (!assignedTo) return;

    try {
      const response = await fetch(
        `/api/maintenance/${requestId}/update`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            assignedTo
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Maintenance assignment failed.'
        );
      }

      /*
       * Refresh immediately so Manager sees
       * the new assignee and status.
       */
      await fetchManagerData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================
  // RESOLVE HOUSEKEEPING REPORT
  // ============================================================
  const handleResolveHousekeepingReport = async (
    reportId
  ) => {
    const resolution = prompt(
      'Enter resolution notes for this incident:'
    );

    if (resolution === null) return;

    try {
      const res = await fetch(
        `/api/housekeeping-reports/${reportId}/resolve`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            resolution:
              resolution ||
              'Resolved by Manager.'
          })
        }
      );

      if (!res.ok) {
        const data = await res.json();

        throw new Error(
          data.message ||
            'Resolution update failed'
        );
      }

      alert(
        'Housekeeping report marked as Resolved!'
      );

      await fetchManagerData();
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================
  // SEND GUEST RESPONSE
  // ============================================================
  const handleSendResponse = async (
    feedbackId
  ) => {
    const resp = responseText[feedbackId];

    if (!resp) return;

    try {
      const response = await fetch(
        `/api/feedback/${feedbackId}/respond`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            response: resp
          })
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            'Failed to publish response.'
        );
      }

      setResponseText({
        ...responseText,
        [feedbackId]: ''
      });

      await fetchManagerData();

      alert(
        'Manager response published to guest folio!'
      );
    } catch (err) {
      alert(err.message);
    }
  };

  // ============================================================
  // BOOKING FILTER
  // ============================================================
  const filteredBookings =
    bookings.filter(b => {
      if (
        statusFilter !== 'All' &&
        b.status !== statusFilter
      ) {
        return false;
      }

      if (searchTerm) {
        const s =
          searchTerm.toLowerCase();

        return (
          b.bookingId
            ?.toLowerCase()
            .includes(s) ||
          b.guest?.name
            ?.toLowerCase()
            .includes(s) ||
          b.room?.roomNumber
            ?.toString()
            .includes(s)
        );
      }

      return true;
    });

  // ============================================================
  // MAINTENANCE STAFF ONLY
  // ============================================================
  const maintenanceStaff =
    assignmentStaff.filter(
      staff =>
        staff.role === 'Maintenance'
    );

  // ============================================================
  // TASK HANDLERS
  // ============================================================
  const resetTaskForm = () => {
    setTaskForm({
      title: '',
      description: '',
      category: 'General',
      priority: 'Normal',
      assignedTo: '',
      room: '',
      dueDate: '',
      notes: ''
    });
    setEditingTask(null);
    setShowCreateTask(false);
  };

  const handleCreateTask = async () => {
    if (!taskForm.title.trim()) {
      alert('Task title is required.');
      return;
    }

    try {
      const body = {
        title: taskForm.title,
        description: taskForm.description,
        category: taskForm.category,
        priority: taskForm.priority,
        notes: taskForm.notes
      };
      if (taskForm.assignedTo) body.assignedTo = taskForm.assignedTo;
      if (taskForm.room) body.room = taskForm.room;
      if (taskForm.dueDate) body.dueDate = taskForm.dueDate;

      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create task.');

      resetTaskForm();
      await fetchManagerData();
      alert('Task created and assigned successfully!');
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;

    try {
      const body = {
        title: taskForm.title,
        description: taskForm.description,
        category: taskForm.category,
        priority: taskForm.priority,
        assignedTo: taskForm.assignedTo || null,
        room: taskForm.room || null,
        dueDate: taskForm.dueDate || null,
        notes: taskForm.notes
      };

      const res = await fetch(`/api/tasks/${editingTask}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update task.');

      resetTaskForm();
      await fetchManagerData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Delete failed.');

      await fetchManagerData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTaskStatusChange = async (taskId, status) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Status update failed.');

      await fetchManagerData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTaskReassign = async (taskId, assignedTo) => {
    try {
      const res = await fetch(`/api/tasks/${taskId}/assign`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ assignedTo: assignedTo || null })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Reassignment failed.');

      await fetchManagerData();
    } catch (err) {
      alert(err.message);
    }
  };

  const openEditTask = (task) => {
    setEditingTask(task._id);
    setTaskForm({
      title: task.title || '',
      description: task.description || '',
      category: task.category || 'General',
      priority: task.priority || 'Normal',
      assignedTo: task.assignedTo?._id || '',
      room: task.room?._id || '',
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
      notes: task.notes || ''
    });
    setShowCreateTask(true);
  };

  const filteredTasks = taskList.filter(t => {
    if (taskCategoryFilter !== 'All' && t.category !== taskCategoryFilter) return false;
    if (taskStatusFilter !== 'All' && t.status !== taskStatusFilter) return false;
    return true;
  });

  return (
    <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto selection:bg-[#7FA6B8] selection:text-stone-950">

      {/* ======================================================
          HEADER
      ====================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stone-800 pb-6">

        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-luxury-muted-blue font-mono">
            <Shield className="w-4 h-4" />

            General Management & Operations Hub
          </div>

          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-stone-100 mt-1">
            Executive Performance & Guest Oversight
          </h1>

          <p className="text-xs text-stone-400 mt-1">
            Live occupancy metrics, revenue performance,
            reservation schedule, and guest sentiment analysis.
          </p>
        </div>

        {/* TAB SWITCHER */}
        <div className="flex flex-wrap items-center gap-1.5 bg-white p-1.5 rounded-2xl border border-stone-800 text-xs">
          {[
            {
              id: 'overview',
              label: 'Overview',
              icon: TrendingUp
            },
            {
              id: 'reservations',
              label: 'Live Bookings',
              icon: Calendar
            },
            {
              id: 'rooms',
              label: 'Room Matrix',
              icon: BedDouble
            },
            {
              id: 'housekeeping',
              label: 'Housekeeping Reports',
              icon: Sparkles
            },
            {
              id: 'maintenance',
              label: 'Maintenance',
              icon: Wrench
            },
            {
              id: 'tasks',
              label: 'Task Assignment',
              icon: ClipboardList
            },
            {
              id: 'feedback',
              label: 'Guest Reviews',
              icon: Star
            }
          ].map(t => {
            const Icon = t.icon;

            const isSel =
              parentActiveTab === 'dashboard' ||
              !parentActiveTab
                ? internalTab === t.id
                : activeTab === t.id;

            return (
              <button
                key={t.id}
                onClick={() =>
                  setInternalTab(t.id)
                }
                className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
                  isSel
                    ? 'bg-amber-400 text-stone-950 shadow-md'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />

                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ======================================================
          KPI CARDS
      ====================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* OCCUPANCY */}
        <div className="bg-white border border-stone-800 p-5 rounded-3xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
              Occupancy Rate
            </span>

            <div className="p-2 bg-[#7FA6B8]/15 rounded-xl text-[#7FA6B8]">
              <PieChart className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-extrabold text-[#7FA6B8]">
              {analytics?.occupancyRate || 0}%
            </span>

            <span className="text-xs text-stone-400">
              Capacity
            </span>
          </div>

          <p className="text-[11px] text-stone-500 font-mono">
            {analytics?.rooms?.occupied || 0}
            {' '}Occupied /{' '}
            {analytics?.rooms?.total || 0}
            {' '}Total Rooms
          </p>
        </div>

        {/* REVENUE */}
        <div className="bg-white border border-stone-800 p-5 rounded-3xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
              Gross Settled Revenue
            </span>

            <div className="p-2 bg-luxury-muted-blue/15 rounded-xl text-luxury-muted-blue">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-extrabold text-luxury-muted-blue">
              $
              {(
                analytics?.revenue?.totalPaid ||
                0
              ).toLocaleString()}
            </span>
          </div>

          <p className="text-[11px] text-stone-500 font-mono">
            +
            {(
              analytics?.revenue?.totalPending ||
              0
            ).toLocaleString()}
            {' '}Pending Folios
          </p>
        </div>

        {/* BOOKINGS */}
        <div className="bg-white border border-stone-800 p-5 rounded-3xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
              Active Reservations
            </span>

            <div className="p-2 bg-blue-500/15 rounded-xl text-blue-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-extrabold text-blue-400">
              {analytics?.bookings?.total || 0}
            </span>

            <span className="text-xs text-stone-400">
              Bookings
            </span>
          </div>

          <p className="text-[11px] text-stone-500 font-mono">
            {analytics?.bookings?.checkedIn || 0}
            {' '}Currently In-House
          </p>
        </div>

        {/* SATISFACTION */}
        <div className="bg-white border border-stone-800 p-5 rounded-3xl space-y-2 relative overflow-hidden">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-stone-500 font-bold uppercase tracking-wider">
              Guest Satisfaction
            </span>

            <div className="p-2 bg-gold-500/15 rounded-xl text-gold-400">
              <Star className="w-4 h-4" />
            </div>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-serif font-extrabold text-gold-400">
              {analytics?.guestSatisfaction || 5.0}
            </span>

            <span className="text-xs text-stone-400">
              / 5.0 Rating
            </span>
          </div>

          <p className="text-[11px] text-stone-500 font-mono">
            Across {feedbackList.length}
            {' '}Verified Reviews
          </p>
        </div>
      </div>

      {/* ======================================================
          OVERVIEW / ROOMS
      ====================================================== */}
      {(activeTab === 'overview' ||
        activeTab === 'rooms') && (
        <div className="space-y-6">

          <div className="bg-white border border-stone-800 rounded-3xl p-6 space-y-4">

            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
                <BedDouble className="w-5 h-5 text-[#7FA6B8]" />

                Operational Status Breakdown
              </h3>

              <span className="text-xs text-stone-400 font-mono">
                {rooms.length} Rooms Total
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">

              <div className="bg-[#F7FBFD] p-4 rounded-2xl border border-luxury-muted-blue/30 space-y-1 text-center">
                <span className="text-[10px] text-luxury-muted-blue uppercase font-bold tracking-wider">
                  Available
                </span>

                <span className="text-2xl font-serif font-bold text-luxury-deep-slate block">
                  {analytics?.rooms?.available || 0}
                </span>
              </div>

              <div className="bg-[#F7FBFD] p-4 rounded-2xl border border-rose-500/30 space-y-1 text-center">
                <span className="text-[10px] text-rose-400 uppercase font-bold tracking-wider">
                  Occupied
                </span>

                <span className="text-2xl font-serif font-bold text-rose-300 block">
                  {analytics?.rooms?.occupied || 0}
                </span>
              </div>

              <div className="bg-[#F7FBFD] p-4 rounded-2xl border border-blue-500/30 space-y-1 text-center">
                <span className="text-[10px] text-blue-400 uppercase font-bold tracking-wider">
                  Reserved
                </span>

                <span className="text-2xl font-serif font-bold text-blue-300 block">
                  {analytics?.rooms?.reserved || 0}
                </span>
              </div>

              <div className="bg-[#F7FBFD] p-4 rounded-2xl border border-amber-500/30 space-y-1 text-center">
                <span className="text-[10px] text-[#7FA6B8] uppercase font-bold tracking-wider">
                  Cleaning
                </span>

                <span className="text-2xl font-serif font-bold text-amber-300 block">
                  {analytics?.rooms?.cleaning || 0}
                </span>
              </div>

              <div className="bg-[#F7FBFD] p-4 rounded-2xl border border-purple-500/30 space-y-1 text-center">
                <span className="text-[10px] text-purple-400 uppercase font-bold tracking-wider">
                  Maintenance
                </span>

                <span className="text-2xl font-serif font-bold text-purple-300 block">
                  {analytics?.rooms?.maintenance || 0}
                </span>
              </div>
            </div>

            {/* ROOM MATRIX */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 pt-3">

              {rooms.map(r => (
                <div
                  key={r._id}
                  className="bg-[#F7FBFD] border border-stone-800 p-3 rounded-2xl text-center space-y-1"
                >
                  <span className="font-mono font-bold text-stone-100 text-sm block">
                    #{r.roomNumber}
                  </span>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full border block truncate ${
                      r.status === 'Available'
                        ? 'bg-luxury-light-frost/15 text-luxury-deep-slate border-luxury-muted-blue/30'
                        : r.status === 'Occupied'
                          ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                          : r.status === 'Cleaning'
                            ? 'bg-[#7FA6B8]/15 text-amber-300 border-amber-500/30'
                            : r.status === 'Reserved'
                              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              : 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                    }`}
                  >
                    {r.status}
                  </span>

                  <span className="text-[9px] text-stone-500 font-mono">
                    ${r.pricePerNight}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          LIVE BOOKINGS
      ====================================================== */}
      {(activeTab === 'reservations' ||
        activeTab === 'overview') && (
        <div className="bg-white border border-stone-800 rounded-3xl p-6 space-y-5">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

            <div>
              <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#7FA6B8]" />

                Master Reservation Register
              </h3>

              <p className="text-xs text-stone-400">
                All active guest bookings, arrival schedules,
                and stay durations.
              </p>
            </div>

            <div className="flex items-center gap-3">

              <select
                value={statusFilter}
                onChange={e =>
                  setStatusFilter(e.target.value)
                }
                className="bg-[#F7FBFD] border border-stone-800 text-stone-300 text-xs rounded-2xl px-3 py-2"
              >
                <option value="All">
                  All Statuses
                </option>

                <option value="Confirmed">
                  Confirmed
                </option>

                <option value="Checked-In">
                  Checked-In
                </option>

                <option value="Checked-Out">
                  Checked-Out
                </option>

                <option value="Cancelled">
                  Cancelled
                </option>
              </select>

              <div className="relative">
                <Search className="w-4 h-4 text-stone-500 absolute left-3 top-2.5" />

                <input
                  type="text"
                  placeholder="Search reservation..."
                  value={searchTerm}
                  onChange={e =>
                    setSearchTerm(e.target.value)
                  }
                  className="bg-[#F7FBFD] border border-stone-800 rounded-2xl pl-9 pr-3 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead className="bg-[#F7FBFD] text-stone-400 uppercase font-semibold border-b border-stone-800">
                <tr>
                  <th className="p-3.5">
                    Booking ID
                  </th>

                  <th className="p-3.5">
                    Guest Name
                  </th>

                  <th className="p-3.5">
                    Room
                  </th>

                  <th className="p-3.5">
                    Stay Dates
                  </th>

                  <th className="p-3.5">
                    Total Bill
                  </th>

                  <th className="p-3.5">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-stone-800/60">

                {filteredBookings.map(b => (
                  <tr
                    key={b._id}
                    className="hover:bg-[#D6E6EF]/30 transition"
                  >
                    <td className="p-3.5 font-mono font-bold text-[#7FA6B8]">
                      #{b.bookingId}
                    </td>

                    <td className="p-3.5 font-semibold text-stone-100">
                      <div className="flex items-center gap-2">

                        <span>
                          {b.guest?.name}
                        </span>

                        {b.guest?.guestType ===
                        'VIP' ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-gradient-to-r from-[#D4AF37] to-amber-300 text-[#001219] font-mono shadow-sm">
                            VIP
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-medium bg-[#D6E6EF] text-stone-400 font-mono border border-stone-700">
                            NORMAL
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="p-3.5 text-stone-300">
                      Room {b.room?.roomNumber}

                      <span className="text-stone-500">
                        {' '}
                        ({b.room?.roomType?.name})
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-stone-400">
                      {new Date(
                        b.checkInDate
                      ).toLocaleDateString()}

                      {' → '}

                      {new Date(
                        b.checkOutDate
                      ).toLocaleDateString()}
                    </td>

                    <td className="p-3.5 font-mono font-bold text-stone-200">
                      ${b.totalAmount}
                    </td>

                    <td className="p-3.5">

                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          b.status ===
                          'Checked-In'
                            ? 'bg-luxury-light-frost/15 text-luxury-deep-slate border-luxury-muted-blue/30'
                            : b.status ===
                              'Confirmed'
                              ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                              : b.status ===
                                'Checked-Out'
                                ? 'bg-[#D6E6EF] text-stone-400 border-stone-700'
                                : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {b.status}
                      </span>

                    </td>
                  </tr>
                ))}

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================
          HOUSEKEEPING REPORTS
      ====================================================== */}
      {activeTab === 'housekeeping' && (
        <div className="bg-white border border-stone-800 rounded-3xl p-6 space-y-5">

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

            <div>
              <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#7FA6B8]" />

                Housekeeping Reports & Incident Monitoring
              </h3>

              <p className="text-xs text-stone-400">
                Real-time room condition reports,
                turn-down tracking, and damage alerts
                from housekeeping staff.
              </p>
            </div>

            <div className="flex items-center gap-2">

              <span className="text-xs text-stone-400">
                Status:
              </span>

              <select
                value={reportStatusFilter}
                onChange={e =>
                  setReportStatusFilter(
                    e.target.value
                  )
                }
                className="bg-[#F7FBFD] border border-stone-800 text-stone-300 text-xs rounded-2xl px-3 py-2"
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

              <thead className="bg-[#F7FBFD] text-stone-400 uppercase font-semibold border-b border-stone-800">

                <tr>
                  <th className="p-3.5">
                    Room
                  </th>

                  <th className="p-3.5">
                    Report Type
                  </th>

                  <th className="p-3.5">
                    Housekeeper Notes
                  </th>

                  <th className="p-3.5">
                    Reported By
                  </th>

                  <th className="p-3.5">
                    Logged At
                  </th>

                  <th className="p-3.5">
                    Status
                  </th>

                  <th className="p-3.5">
                    Assigned To
                  </th>

                  <th className="p-3.5 text-right">
                    Action
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y divide-stone-800/60">

                {housekeepingReports.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="p-8 text-center text-stone-500 italic"
                    >
                      No housekeeping reports
                      recorded in MongoDB.
                    </td>
                  </tr>
                ) : (
                  housekeepingReports
                    .filter(
                      r =>
                        reportStatusFilter ===
                          'All' ||
                        r.status ===
                          reportStatusFilter
                    )
                    .map(r => (
                      <tr
                        key={r._id}
                        className="hover:bg-[#D6E6EF]/30 transition"
                      >

                        <td className="p-3.5 font-bold text-stone-100">
                          Room{' '}
                          {r.roomId
                            ?.roomNumber || '—'}

                          <span className="text-[10px] text-stone-500 block font-normal">
                            {r.roomId
                              ?.roomType?.name}
                          </span>
                        </td>

                        <td className="p-3.5">
                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              r.reportType ===
                                'Damaged' ||
                              r.reportType ===
                                'Maintenance Issue'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : r.reportType ===
                                  'Needs Cleaning'
                                  ? 'bg-[#7FA6B8]/15 text-amber-300 border-amber-500/30'
                                  : 'bg-luxury-light-frost/15 text-luxury-deep-slate border-luxury-muted-blue/30'
                            }`}
                          >
                            {r.reportType}
                          </span>
                        </td>

                        <td className="p-3.5 text-stone-300 max-w-xs">
                          {r.notes}
                        </td>

                        <td className="p-3.5 text-stone-400">
                          {r.reportedBy?.name ||
                            'Housekeeping'}
                        </td>

                        <td className="p-3.5 text-stone-500 font-mono">
                          {new Date(
                            r.createdAt
                          ).toLocaleString()}
                        </td>

                        <td className="p-3.5">

                          <span
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                              r.status ===
                              'Resolved'
                                ? 'bg-luxury-light-frost/15 text-luxury-deep-slate border-luxury-muted-blue/30'
                                : r.status ===
                                  'In Progress'
                                  ? 'bg-[#7FA6B8]/15 text-amber-300 border-amber-500/30'
                                  : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            }`}
                          >
                            {r.status}
                          </span>

                        </td>

                        <td className="p-3.5">

                          <select
                            value={
                              r.assignedTo?._id ||
                              ''
                            }
                            onChange={event =>
                              handleAssignHousekeepingReport(
                                r._id,
                                event.target.value
                              )
                            }
                            className="bg-[#F7FBFD] border border-stone-800 text-stone-300 text-[11px] rounded-xl px-2 py-1.5 min-w-[150px]"
                          >

                            <option value="">
                              Unassigned
                            </option>

                            {assignmentStaff.map(
                              staff => (
                                <option
                                  key={
                                    staff._id
                                  }
                                  value={
                                    staff._id
                                  }
                                >
                                  {staff.name} (
                                  {staff.role})
                                </option>
                              )
                            )}

                          </select>

                        </td>

                        <td className="p-3.5 text-right">

                          {r.status !==
                          'Resolved' ? (
                            <button
                              onClick={() =>
                                handleResolveHousekeepingReport(
                                  r._id
                                )
                              }
                              className="px-3 py-1.5 bg-luxury-muted-blue hover:bg-luxury-light-frost text-stone-950 font-bold rounded-xl text-xs transition"
                            >
                              Resolve
                            </button>
                          ) : (
                            <span className="text-[11px] text-stone-400 italic">
                              Resolved:{' '}
                              {r.resolution}
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

      {/* ======================================================
          MAINTENANCE REQUESTS
      ====================================================== */}
      {activeTab === 'maintenance' && (
        <div className="bg-white border border-stone-800 rounded-3xl p-6 space-y-5">

          <div>
            <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#7FA6B8]" />

              Engineering & Maintenance Log
            </h3>

            <p className="text-xs text-stone-400">
              Track reported facility issues, assign
              work orders to Maintenance staff, and
              monitor repair progress.
            </p>
          </div>

          {/* Maintenance staff diagnostic info */}
          {maintenanceStaff.length === 0 && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 text-xs text-amber-300">
              <strong>No active Maintenance staff found.</strong>

              <span className="block mt-1">
                Make sure Ali's user account has role
                <code className="mx-1 px-1.5 py-0.5 bg-stone-900 rounded">
                  Maintenance
                </code>
                and is active.
              </span>
            </div>
          )}

          <div className="overflow-x-auto">

            <table className="w-full text-left text-xs">

              <thead className="bg-[#F7FBFD] text-stone-400 uppercase font-semibold border-b border-stone-800">

                <tr>
                  <th className="p-3.5">
                    Suite Unit
                  </th>

                  <th className="p-3.5">
                    Defect Description
                  </th>

                  <th className="p-3.5">
                    Priority
                  </th>

                  <th className="p-3.5">
                    Reported By
                  </th>

                  <th className="p-3.5">
                    Assigned To
                  </th>

                  <th className="p-3.5">
                    Status
                  </th>
                </tr>

              </thead>

              <tbody className="divide-y divide-stone-800/60">

                {maintenanceList.length ===
                0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="p-8 text-center text-stone-500 italic"
                    >
                      No maintenance requests
                      recorded.
                    </td>
                  </tr>
                ) : (
                  maintenanceList.map(m => (
                    <tr
                      key={m._id}
                      className="hover:bg-[#D6E6EF]/30 transition"
                    >

                      {/* ROOM */}
                      <td className="p-3.5 font-bold text-stone-100">
                        Room{' '}
                        {m.room?.roomNumber ||
                          '—'}
                      </td>

                      {/* DESCRIPTION */}
                      <td className="p-3.5 text-stone-300 max-w-xs">
                        {m.problemDescription}
                      </td>

                      {/* PRIORITY */}
                      <td className="p-3.5">

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            m.priority ===
                              'Emergency' ||
                            m.priority === 'High'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : m.priority ===
                                'Medium'
                                ? 'bg-[#7FA6B8]/15 text-amber-300 border-amber-500/30'
                                : 'bg-stone-500/15 text-stone-300 border-stone-700'
                          }`}
                        >
                          {m.priority}
                        </span>

                      </td>

                      {/* REPORTED BY */}
                      <td className="p-3.5 text-stone-400">
                        {m.reportedBy?.name ||
                          'Staff'}
                      </td>

                      {/* ==================================================
                          ASSIGN TO MAINTENANCE STAFF
                      ================================================== */}
                      <td className="p-3.5">

                        <select
                          value={
                            m.assignedTo?._id ||
                            ''
                          }
                          onChange={e =>
                            handleAssignMaintenance(
                              m._id,
                              e.target.value
                            )
                          }
                          className="bg-[#F7FBFD] border border-stone-800 text-stone-300 text-[11px] rounded-xl px-2 py-1.5 min-w-[160px]"
                        >

                          <option value="">
                            Unassigned
                          </option>

                          {maintenanceStaff.map(
                            staff => (
                              <option
                                key={
                                  staff._id
                                }
                                value={
                                  staff._id
                                }
                              >
                                {staff.name}
                              </option>
                            )
                          )}

                        </select>

                      </td>

                      {/* STATUS */}
                      <td className="p-3.5">

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            m.status ===
                            'Completed'
                              ? 'bg-luxury-light-frost/15 text-luxury-deep-slate border-luxury-muted-blue/30'
                              : m.status ===
                                'In Progress'
                                ? 'bg-[#7FA6B8]/15 text-amber-300 border-amber-500/30'
                                : 'bg-stone-500/15 text-stone-300 border-stone-700'
                          }`}
                        >
                          {m.status}
                        </span>

                      </td>

                    </tr>
                  ))
                )}

              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================
          TASK ASSIGNMENT
      ====================================================== */}
      {activeTab === 'tasks' && (
        <div className="space-y-6">

          {/* CREATE / EDIT TASK FORM */}
          <div className="bg-white border border-stone-800 rounded-3xl p-6 space-y-5">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#7FA6B8]" />
                  Staff Task Assignment
                </h3>
                <p className="text-xs text-stone-400">
                  Create, assign, and track tasks for all hotel departments.
                </p>
              </div>

              <button
                onClick={() => {
                  if (showCreateTask) {
                    resetTaskForm();
                  } else {
                    setShowCreateTask(true);
                    setEditingTask(null);
                    setTaskForm({
                      title: '', description: '', category: 'General',
                      priority: 'Normal', assignedTo: '', room: '', dueDate: '', notes: ''
                    });
                  }
                }}
                className={`px-4 py-2 font-bold rounded-2xl text-xs flex items-center gap-1.5 transition shadow-md ${
                  showCreateTask
                    ? 'bg-stone-700 text-stone-300 hover:bg-stone-600'
                    : 'bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950'
                }`}
              >
                {showCreateTask ? (
                  <><span>✕</span> Cancel</>
                ) : (
                  <><Plus className="w-3.5 h-3.5" /> New Task</>
                )}
              </button>
            </div>

            {showCreateTask && (
              <div className="bg-[#F7FBFD] border border-stone-800 rounded-2xl p-5 space-y-4">

                <h4 className="font-serif font-bold text-stone-200 text-sm">
                  {editingTask ? '✏️ Edit Task' : '➕ Create New Task'}
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                  {/* Title */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block mb-1">
                      Task Title *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Deep clean Presidential Suite"
                      value={taskForm.title}
                      onChange={e => setTaskForm({ ...taskForm, title: e.target.value })}
                      className="w-full bg-white border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Description */}
                  <div className="sm:col-span-2">
                    <label className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block mb-1">
                      Description
                    </label>
                    <textarea
                      placeholder="Detailed task instructions..."
                      value={taskForm.description}
                      onChange={e => setTaskForm({ ...taskForm, description: e.target.value })}
                      rows={2}
                      className="w-full bg-white border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500 resize-none"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block mb-1">
                      Category
                    </label>
                    <select
                      value={taskForm.category}
                      onChange={e => setTaskForm({ ...taskForm, category: e.target.value })}
                      className="w-full bg-white border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300"
                    >
                      <option value="General">General</option>
                      <option value="Housekeeping">Housekeeping</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="Front Desk">Front Desk</option>
                    </select>
                  </div>

                  {/* Priority */}
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block mb-1">
                      Priority
                    </label>
                    <select
                      value={taskForm.priority}
                      onChange={e => setTaskForm({ ...taskForm, priority: e.target.value })}
                      className="w-full bg-white border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300"
                    >
                      <option value="Low">Low</option>
                      <option value="Normal">Normal</option>
                      <option value="High">High</option>
                      <option value="Urgent">Urgent</option>
                    </select>
                  </div>

                  {/* Assign To */}
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block mb-1">
                      Assign To
                    </label>
                    <select
                      value={taskForm.assignedTo}
                      onChange={e => setTaskForm({ ...taskForm, assignedTo: e.target.value })}
                      className="w-full bg-white border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300"
                    >
                      <option value="">— Select Staff —</option>
                      {assignmentStaff.map(staff => (
                        <option key={staff._id} value={staff._id}>
                          {staff.name} ({staff.role})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Room (optional) */}
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block mb-1">
                      Room (optional)
                    </label>
                    <select
                      value={taskForm.room}
                      onChange={e => setTaskForm({ ...taskForm, room: e.target.value })}
                      className="w-full bg-white border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300"
                    >
                      <option value="">— No Room —</option>
                      {rooms.map(r => (
                        <option key={r._id} value={r._id}>
                          Room #{r.roomNumber} — {r.roomType?.name || 'Standard'}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Due Date */}
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block mb-1">
                      Due Date
                    </label>
                    <input
                      type="date"
                      value={taskForm.dueDate}
                      onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                      className="w-full bg-white border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="text-[10px] text-stone-400 uppercase font-bold tracking-wider block mb-1">
                      Notes
                    </label>
                    <input
                      type="text"
                      placeholder="Additional notes..."
                      value={taskForm.notes}
                      onChange={e => setTaskForm({ ...taskForm, notes: e.target.value })}
                      className="w-full bg-white border border-stone-800 rounded-xl px-3 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={resetTaskForm}
                    className="px-4 py-2 bg-stone-800 text-stone-300 font-bold rounded-xl text-xs hover:bg-stone-700 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={editingTask ? handleUpdateTask : handleCreateTask}
                    className="px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-xl text-xs shadow-md transition hover:from-amber-400 hover:to-amber-500"
                  >
                    {editingTask ? 'Update Task' : 'Create & Assign Task'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* TASK LIST TABLE */}
          <div className="bg-white border border-stone-800 rounded-3xl p-6 space-y-5">

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-serif font-bold text-sm text-stone-200">
                  All Assigned Tasks ({filteredTasks.length})
                </h3>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={taskCategoryFilter}
                  onChange={e => setTaskCategoryFilter(e.target.value)}
                  className="bg-[#F7FBFD] border border-stone-800 text-stone-300 text-xs rounded-2xl px-3 py-2"
                >
                  <option value="All">All Categories</option>
                  <option value="General">General</option>
                  <option value="Housekeeping">Housekeeping</option>
                  <option value="Maintenance">Maintenance</option>
                  <option value="Front Desk">Front Desk</option>
                </select>

                <select
                  value={taskStatusFilter}
                  onChange={e => setTaskStatusFilter(e.target.value)}
                  className="bg-[#F7FBFD] border border-stone-800 text-stone-300 text-xs rounded-2xl px-3 py-2"
                >
                  <option value="All">All Statuses</option>
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">

                <thead className="bg-[#F7FBFD] text-stone-400 uppercase font-semibold border-b border-stone-800">
                  <tr>
                    <th className="p-3.5">Task</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Priority</th>
                    <th className="p-3.5">Assigned To</th>
                    <th className="p-3.5">Room</th>
                    <th className="p-3.5">Due Date</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-stone-800/60">
                  {filteredTasks.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-stone-500 italic">
                        No tasks found. Click "New Task" to create and assign one.
                      </td>
                    </tr>
                  ) : (
                    filteredTasks.map(t => (
                      <tr key={t._id} className="hover:bg-[#D6E6EF]/30 transition">

                        {/* TASK TITLE + DESCRIPTION */}
                        <td className="p-3.5 max-w-[200px]">
                          <span className="font-bold text-stone-100 block">{t.title}</span>
                          {t.description && (
                            <span className="text-[10px] text-stone-500 block truncate">
                              {t.description}
                            </span>
                          )}
                        </td>

                        {/* CATEGORY */}
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            t.category === 'Housekeeping'
                              ? 'bg-[#7FA6B8]/15 text-[#7FA6B8] border-[#7FA6B8]/30'
                              : t.category === 'Maintenance'
                                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30'
                                : t.category === 'Front Desk'
                                  ? 'bg-blue-500/15 text-blue-300 border-blue-500/30'
                                  : 'bg-stone-500/15 text-stone-300 border-stone-700'
                          }`}>
                            {t.category}
                          </span>
                        </td>

                        {/* PRIORITY */}
                        <td className="p-3.5">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            t.priority === 'Urgent' || t.priority === 'High'
                              ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                              : t.priority === 'Normal'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-stone-500/15 text-stone-300 border-stone-700'
                          }`}>
                            {t.priority}
                          </span>
                        </td>

                        {/* ASSIGNED TO - with reassign dropdown */}
                        <td className="p-3.5">
                          <select
                            value={t.assignedTo?._id || ''}
                            onChange={e => handleTaskReassign(t._id, e.target.value)}
                            className="bg-[#F7FBFD] border border-stone-800 text-stone-300 text-[11px] rounded-xl px-2 py-1.5 min-w-[140px]"
                          >
                            <option value="">Unassigned</option>
                            {assignmentStaff.map(staff => (
                              <option key={staff._id} value={staff._id}>
                                {staff.name} ({staff.role})
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* ROOM */}
                        <td className="p-3.5 text-stone-400 font-mono">
                          {t.room ? `#${t.room.roomNumber}` : '—'}
                        </td>

                        {/* DUE DATE */}
                        <td className="p-3.5 text-stone-400 font-mono">
                          {t.dueDate
                            ? new Date(t.dueDate).toLocaleDateString()
                            : '—'}
                        </td>

                        {/* STATUS */}
                        <td className="p-3.5">
                          <select
                            value={t.status}
                            onChange={e => handleTaskStatusChange(t._id, e.target.value)}
                            className={`text-[11px] font-bold px-2 py-1 rounded-xl border ${
                              t.status === 'Completed'
                                ? 'bg-luxury-light-frost/15 text-luxury-deep-slate border-luxury-muted-blue/30'
                                : t.status === 'In Progress'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : t.status === 'Cancelled'
                                    ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                    : 'bg-stone-500/15 text-stone-300 border-stone-700'
                            }`}
                          >
                            <option value="Pending">Pending</option>
                            <option value="In Progress">In Progress</option>
                            <option value="Completed">Completed</option>
                            <option value="Cancelled">Cancelled</option>
                          </select>
                        </td>

                        {/* ACTIONS */}
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => openEditTask(t)}
                              className="p-1.5 bg-blue-500/15 text-blue-300 rounded-lg hover:bg-blue-500/25 transition"
                              title="Edit task"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteTask(t._id)}
                              className="p-1.5 bg-rose-500/15 text-rose-300 rounded-lg hover:bg-rose-500/25 transition"
                              title="Delete task"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================
          GUEST REVIEWS
      ====================================================== */}
      {(activeTab === 'feedback' ||
        activeTab === 'overview') && (
        <div className="bg-white border border-stone-800 rounded-3xl p-6 space-y-5">

          <div>
            <h3 className="font-serif font-bold text-lg text-stone-100 flex items-center gap-2">
              <Star className="w-5 h-5 text-[#7FA6B8]" />

              Guest Ratings & Executive Response Center
            </h3>

            <p className="text-xs text-stone-400">
              Review guest feedback and publish
              personalized management responses.
            </p>
          </div>

          <div className="space-y-4">

            {feedbackList.map(f => (
              <div
                key={f._id}
                className="bg-[#F7FBFD] border border-stone-800 p-5 rounded-3xl space-y-3 text-xs"
              >

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">

                  <div className="flex items-center gap-2">

                    <div className="w-8 h-8 rounded-xl bg-[#D6E6EF] flex items-center justify-center font-serif font-bold text-[#7FA6B8]">
                      {f.guest?.name?.charAt(0) ||
                        'G'}
                    </div>

                    <div>
                      <span className="font-serif font-bold text-stone-200 text-sm block">
                        {f.guest?.name}
                      </span>

                      <span className="text-[10px] text-stone-500 font-mono">
                        {new Date(
                          f.createdAt
                        ).toLocaleDateString()}
                      </span>
                    </div>

                  </div>

                  <div className="flex items-center gap-1">

                    {[...Array(
                      f.rating || 5
                    )].map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-amber-400 text-[#7FA6B8]"
                      />
                    ))}

                  </div>

                </div>

                <p className="text-stone-300 leading-relaxed bg-white/60 p-3 rounded-2xl border border-stone-800">
                  "{f.comments}"
                </p>

                {f.response ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-2xl text-[11px] text-emerald-200">

                    <span className="font-bold text-emerald-400 block mb-0.5">
                      Management Published Reply:
                    </span>

                    <p>
                      {f.response}
                    </p>

                  </div>
                ) : (
                  <div className="flex gap-2 pt-1">

                    <input
                      type="text"
                      placeholder="Type executive response to guest..."
                      value={
                        responseText[f._id] ||
                        ''
                      }
                      onChange={e =>
                        setResponseText({
                          ...responseText,
                          [f._id]:
                            e.target.value
                        })
                      }
                      className="flex-1 bg-white border border-stone-800 rounded-2xl px-4 py-2 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                    />

                    <button
                      onClick={() =>
                        handleSendResponse(
                          f._id
                        )
                      }
                      className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 text-stone-950 font-bold rounded-2xl text-xs flex items-center gap-1 shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />

                      Reply
                    </button>

                  </div>
                )}

              </div>
            ))}

          </div>
        </div>
      )}
    </div>
  );
}
