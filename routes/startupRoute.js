// server/routes/startups.js
const express = require('express');
const {
  getStartups,
  getStartup,
  createStartup,
  updateStartup,
  deleteStartup
} = require('../controllers/StartupController');

const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();


router.post('/create', protect, authorize('founder', 'admin'), createStartup);
router.get('/getstartups', getStartups);

router.get('/getstartup/:id', getStartup);
router.put('/updatestartup/:id', protect, authorize('founder', 'admin'), updateStartup);
router.delete('/deletestartup/:id', protect, authorize('founder', 'admin'), deleteStartup);


module.exports = router;