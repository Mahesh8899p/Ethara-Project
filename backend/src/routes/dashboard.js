const express = require('express');
const auth = require('../middleware/auth');
const { getDashboard } = require('../controllers/dashboardController');

const router = express.Router();

router.get('/', auth, getDashboard);

module.exports = router;
