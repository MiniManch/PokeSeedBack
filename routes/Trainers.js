const express = require('express');
const router = express.Router();
const trainersController = require('../controllers/trainersController');

// Route to get all trainers
router.get('/', trainersController.getAllTrainers);

// Route to get a trainer by name
router.get('/:name', trainersController.getTrainerByName);

module.exports = router;
