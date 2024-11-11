const express = require('express');
const router = express.Router();
const tournamentController = require('../controllers/tournamentController');

router.get('/', tournamentController.getTournament);
router.post('/new', tournamentController.createTournament);
router.post('/update/match', tournamentController.addMatchResult);

module.exports = router;
