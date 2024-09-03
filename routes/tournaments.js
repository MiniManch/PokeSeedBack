const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');

router.post('/new', tournamentController.createTournament);

module.exports = router;
