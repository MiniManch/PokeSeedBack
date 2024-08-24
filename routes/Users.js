const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.registerUser);

router.post('/login', userController.loginUser);

router.get('/check-login', userController.checkLogin);

router.get('/:username', userController.getUserData);

router.patch('/update', userController.updateUser);

module.exports = router;
