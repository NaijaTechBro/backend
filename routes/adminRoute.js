// server/routes/admin.js
const express = require('express');
const {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  verifyStartup,
  getStatistics
} = require('../controllers/admin/adminController');

const { protect, authorize } = require('../middleware/authMiddleware');
const router = express.Router();

// Apply middleware to all routes
router.use(protect);
router.use(authorize('admin'));

router.route('/users')
  .get(getUsers);

router.route('/users/:id')
  .get(getUser)
  .put(updateUser)
  .delete(deleteUser);
router.put('/startups/:id/verify', verifyStartup);
router.get('/statistics', getStatistics);

module.exports = router;