const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/register', userController.registerUser);

router.post('/login', userController.loginUser);

router.post('/:username/team', userController.addPokemonToTeam); 

router.patch('/:username/team', userController.updatePokemonInTeam); 

router.get('/check-login', userController.checkLogin);

router.get('/:username', userController.getUserData);

router.patch('/:username/update', userController.updateUser);

router.delete('/:username/team', userController.deletePokemonFromTeam); 

module.exports = router;
