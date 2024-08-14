const mongoose = require('mongoose');

const PokemonSchema = new mongoose.Schema({
    name: String,
    frontSprite: String,
    backSprite: String
});

const TrainerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    team: [PokemonSchema], // Array of Pokémon objects
    rating: { type: String, default: '' },
    wins: { type: Number, default: 0 },
    champion: { type: String, default: false },
    losses: { type: Number, default: 0 },
    frontSprite: { type: String, default: '' },
    backSprite: { type: String, default: '' }
});

const Trainer = mongoose.model('PokeTrainers', TrainerSchema, 'PokeTrainers');

module.exports = Trainer;
