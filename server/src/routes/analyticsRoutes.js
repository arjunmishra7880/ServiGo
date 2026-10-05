const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const { authenticateToken, authorizeRoles } = require('../middlewares/auth');

// GET /api/analytics/provider - Provider Analytics Dashboard data
router.get('/provider', authenticateToken, authorizeRoles('provider', 'admin'), analyticsController.getProviderAnalytics);

module.exports = router;
