const express = require('express');
const router = express.Router();
const { getEvents, getEvent, createEvent, seedEvents } = require('../controllers/eventController');

// Public routes
router.get('/', getEvents);
router.get('/:id', getEvent);

// Admin routes (can add auth middleware later)
router.post('/', createEvent);
router.post('/seed', seedEvents);

module.exports = router;
