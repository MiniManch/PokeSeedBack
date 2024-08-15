const express = require('express');
const router = express.Router();
const typesController = require('../controllers/typesController');

router.get('/', typesController.getAllTypes);

router.get('/:name', typesController.getTypeByName);

module.exports = router;
