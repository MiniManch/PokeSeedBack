const mongoose = require('mongoose');

const TrainerSchema = new mongoose.Schema({
    name: { type: String, required: true },
    team: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Pokemon' }], 
    rating: { type: String, default: '' },
    wins: { type: Number, default: 0 },
    champion: { type: String, default: false },
    losses: { type: Number, default: 0 },
    frontSprite: { type: String, default: '' },
    backSprite: { type: String, default: '' },
    profileImage: { type: String, default: '' }
});

const Trainer = mongoose.model('PokeTrainers', TrainerSchema, 'PokeTrainers');

module.exports = Trainer;
