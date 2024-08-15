const express = require('express');
const router = express.Router();
const trainersController = require('../controllers/trainersController');

router.get('/', trainersController.getAllTrainers);

router.get('/:name', trainersController.getTrainerByName);

module.exports = router;
