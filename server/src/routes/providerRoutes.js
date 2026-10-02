const express = require('express');
const router = express.Router();
const { getAllProviders, getProviderById, toggleVerifyProvider } = require('../controllers/providerController');
const { authenticateToken } = require('../middlewares/auth');

router.get('/', getAllProviders);
router.get('/:id', getProviderById);
router.patch('/:id/verify', authenticateToken, toggleVerifyProvider);

module.exports = router;