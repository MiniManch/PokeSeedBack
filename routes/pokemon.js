const express = require('express');
const router = express.Router();
const {
    getAllPokemon,
    getPokemonByName,
    getPokemonByType
} = require('../controllers/pokemonController');

// Get all Pokémon
router.get('/', getAllPokemon);

// Get Pokémon by name
router.get('/:name', getPokemonByName);

// Get Pokémon by type
router.get('/type/:type', getPokemonByType);

module.exports = router;
