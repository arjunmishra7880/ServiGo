const express = require('express');
const router = express.Router();
const { createReview } = require('../controllers/reviewController');
const { authenticateToken } = require('../middlewares/auth');

router.post('/', authenticateToken, createReview);

module.exports = router;