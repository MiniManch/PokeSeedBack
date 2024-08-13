const Pokemon = require('../models/pokemon');

// Get all Pokémon
const getAllPokemon = async (req, res) => {
    try {
        const pokemon = await Pokemon.find();
        res.json(pokemon);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// Get Pokémon by name
const getPokemonByName = async (req, res) => {
    console.log('Request received for:', req.params.name); // Log request parameter
    try {
        const pokemon = await Pokemon.findOne({ name: req.params.name.toLowerCase() });
        if (pokemon) {
            res.json(pokemon);
        } else {
            res.status(404).json({ message: 'Pokémon not found' });
        }
    } catch (err) {
        console.error('Error:', err.message); // Log error details
        res.status(500).json({ message: err.message });
    }
};

// Get Pokémon by type
const getPokemonByType = async (req, res) => {
    try {
        const pokemon = await Pokemon.find({ type: req.params.type.toLowerCase() });
        res.json(pokemon);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

module.exports = {
    getAllPokemon,
    getPokemonByName,
    getPokemonByType
};
