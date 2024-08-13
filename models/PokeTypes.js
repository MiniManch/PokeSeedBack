const mongoose = require('mongoose');

const pokeTypeSchema = new mongoose.Schema({
    name: String,
    image: String,
    color: String
});

const PokeType = mongoose.model('PokeTypes', pokeTypeSchema,'PokeTypes');

module.exports = PokeType;
