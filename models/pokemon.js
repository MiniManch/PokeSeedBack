const mongoose = require('mongoose');

const moveSchema = new mongoose.Schema({
    name: String,
    url: String,
    type: String,
    dmg: Number,
    acc: Number,
    sp: Number,
    currentSp:Number,
    effect: String,
    effect_acc: Number,
    effect_percent: Number,
    melt_turns: Number  
});

const statsSchema = new mongoose.Schema({
    str: Number,
    currentStr:Number,
    hp: Number,
    currentHp:Number,
    def: Number,
    currentDef:Number,
    spAtk:Number,
    spDef:Number,
    speed:Number
});

const pokemonSchema = new mongoose.Schema({
    name: String,
    type: String,
    frontSprite: String,
    backSprite: String,
    pokeDexImg: String,
    cry: String,
    moves: [moveSchema],
    stats: statsSchema
});

const Pokemon = mongoose.model('Pokemon', pokemonSchema, 'Pokemon');

module.exports = Pokemon;
