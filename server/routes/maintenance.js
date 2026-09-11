const express = require('express');
const router = express.Router();

const MaintenanceRequest = require('../models/MaintenanceRequest');
const Room = require('../models/Room');
const User = require('../models/User');
const { authenticate, authorize } = require('../middleware/auth');

// ============================================================
// GET ALL MAINTENANCE REQUESTS
// ============================================================
router.get(
  '/',
  authenticate,
  authorize('Admin', 'Manager', 'Housekeeping', 'Receptionist', 'Maintenance'),
  async (req, res) => {
    try {
      const filter = {};

      // Optional status filter
      if (req.query.status) {
        filter.status = req.query.status;
      }

      /*
       * IMPORTANT:
       * Maintenance staff should see:
       * - requests assigned to them
       * - OR unassigned maintenance requests
       *
       * This means a request reported by Manager/Housekeeping
       * will appear on Ali's dashboard even before it is assigned.
       */
      if (req.user.role === 'Maintenance') {
        filter.$or = [
          { assignedTo: req.user._id },
          { assignedTo: { $exists: false } },
          { assignedTo: null }
        ];
      }

      const requests = await MaintenanceRequest.find(filter)
        .populate({
          path: 'room',
          populate: {
            path: 'roomType'
          }
        })
        .populate('reportedBy', 'name role')
        .populate('assignedTo', 'name role')
        .sort({
          priority: -1,
          createdAt: -1
        });

      res.json(requests);
    } catch (err) {
      console.error('GET /api/maintenance error:', err);
      res.status(500).json({
        message: err.message
      });
    }
  }
);


// ============================================================
// CREATE / REPORT MAINTENANCE ISSUE
// ============================================================
router.post(
  '/',
  authenticate,
  authorize(
    'Admin',
    'Manager',
    'Receptionist',
    'Housekeeping',
    'Maintenance'
  ),
  async (req, res) => {
    try {
      const {
        roomId,
        problemDescription,
        priority
      } = req.body;

      if (!roomId || !problemDescription) {
        return res.status(400).json({
          message: 'roomId and problemDescription are required.'
        });
      }

      const room = await Room.findById(roomId);

      if (!room) {
        return res.status(404).json({
          message: 'Room not found.'
        });
      }

      /*
       * DO NOT assign the request to Manager/Housekeeping.
       *
       * The request belongs in the Maintenance queue.
       *
       * We leave assignedTo empty initially so that available
       * Maintenance staff can see it.
       */
      const request = await MaintenanceRequest.create({
        room: roomId,
        reportedBy: req.user._id,
        problemDescription: problemDescription.trim(),
        priority: priority || 'Medium',
        status: 'Pending'
      });

      // Put room into maintenance state
      room.status = 'Under Maintenance';
      await room.save();

      const populated = await MaintenanceRequest.findById(request._id)
        .populate({
          path: 'room',
          populate: {
            path: 'roomType'
          }
        })
        .populate('reportedBy', 'name role')
        .populate('assignedTo', 'name role');

      res.status(201).json(populated);
    } catch (err) {
      console.error('POST /api/maintenance error:', err);
      res.status(500).json({
        message: err.message
      });
    }
  }
);


// ============================================================
// UPDATE MAINTENANCE REQUEST
// ============================================================
router.patch(
  '/:id/update',
  authenticate,
  authorize('Admin', 'Manager', 'Maintenance'),
  async (req, res) => {
    try {
      const {
        status,
        repairNotes,
        assignedTo
      } = req.body;

      const validStatuses = [
        'Pending',
        'In Progress',
        'Completed'
      ];

      if (status && !validStatuses.includes(status)) {
        return res.status(400).json({
          message: 'Invalid maintenance request status.'
        });
      }

      const request = await MaintenanceRequest.findById(req.params.id);

      if (!request) {
        return res.status(404).json({
          message: 'Maintenance request not found.'
        });
      }


      // ========================================================
      // MAINTENANCE STAFF PERMISSION
      // ========================================================
      if (req.user.role === 'Maintenance') {
        /*
         * Ali can work on:
         * - a ticket already assigned to Ali
         * - OR an unassigned ticket
         *
         * If it is unassigned, automatically assign it to Ali.
         */
        const isAssignedToSomeoneElse =
          request.assignedTo &&
          request.assignedTo.toString() !== req.user._id.toString();

        if (isAssignedToSomeoneElse) {
          return res.status(403).json({
            message: 'This maintenance request is assigned to another staff member.'
          });
        }

        // Automatically claim the ticket for Ali
        if (!request.assignedTo) {
          request.assignedTo = req.user._id;
        }
      }


      // ========================================================
      // ASSIGN REQUEST
      // ========================================================
      if (assignedTo) {
        const assignee = await User.findById(assignedTo)
          .select('name role isActive');

        if (!assignee) {
          return res.status(404).json({
            message: 'Assigned user not found.'
          });
        }

        if (!assignee.isActive) {
          return res.status(400).json({
            message: 'Cannot assign maintenance request to an inactive user.'
          });
        }

        /*
         * IMPORTANT:
         * The previous code had the wrong role list.
         *
         * It excluded Maintenance.
         *
         * A maintenance request must be assignable to
         * Maintenance staff.
         */
        if (
          ![
            'Admin',
            'Manager',
            'Receptionist',
            'Housekeeping',
            'Maintenance'
          ].includes(assignee.role)
        ) {
          return res.status(400).json({
            message: 'Maintenance requests can only be assigned to active staff.'
          });
        }

        request.assignedTo = assignee._id;
      }


      // ========================================================
      // UPDATE STATUS
      // ========================================================
      if (status) {
        request.status = status;
      }

      if (repairNotes !== undefined) {
        request.repairNotes = repairNotes;
      }


      // ========================================================
      // COMPLETED
      // ========================================================
      if (status === 'Completed') {
        request.completedAt = new Date();

        const room = await Room.findById(request.room);

        if (room) {
          room.status = 'Available';
          await room.save();
        }
      }


      // ========================================================
      // IN PROGRESS
      // ========================================================
      if (status === 'In Progress') {
        /*
         * If Ali starts an unassigned ticket, it is now
         * automatically assigned to Ali.
         */
        if (
          req.user.role === 'Maintenance' &&
          !request.assignedTo
        ) {
          request.assignedTo = req.user._id;
        }
      }


      await request.save();

      const updatedRequest = await MaintenanceRequest.findById(
        request._id
      )
        .populate({
          path: 'room',
          populate: {
            path: 'roomType'
          }
        })
        .populate('reportedBy', 'name role')
        .populate('assignedTo', 'name role');

      res.json({
        message: 'Maintenance request updated successfully.',
        request: updatedRequest
      });

    } catch (err) {
      console.error('PATCH /api/maintenance/:id/update error:', err);

      res.status(500).json({
        message: err.message
      });
    }
  }
);


module.exports = router;
