require('dotenv').config();
const mongoose = require('mongoose');
const Pokemon = require('../models/Pokemon');
const PokemonTrainer = require('../models/PokeTrainers');

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const calculateMoveImpact = (move, pokemonStats) => {
    const { dmg, acc, effect, effect_acc, effect_percent } = move;
    
    // Ensure all values are numbers and not undefined or null
    const moveDmg = Number(dmg) || 0;
    const moveAcc = Number(acc) || 0;
    const effectAcc = Number(effect_acc) || 0;
    const effectPercent = Number(effect_percent) || 0;

    let moveImpact = moveDmg * pokemonStats.str / 100;

    // Handle different effects
    if (effect === 'health up') {
        moveImpact += (moveDmg * effectPercent / 100) * (effectAcc / 100);
    } else if (effect === 'skip') {
        moveImpact += (moveImpact * (effectAcc / 100));
    }

    return moveImpact * (moveAcc / 100);
};

const calculateTrainerStrength = async () => {
    try {
        const trainers = await PokemonTrainer.find({ team: { $ne: [] } });

        for (const trainer of trainers) {
            let totalStrength = 0;

            for (const pokemon of trainer.team) {
                const pokemonData = await Pokemon.findOne({ name: pokemon.name });

                if (!pokemonData) continue;

                // Calculate Pokémon stats impact
                const pokemonStats = pokemonData.stats;
                let pokemonStrength = pokemonStats.str + pokemonStats.hp + pokemonStats.def;

                // Calculate move impact
                for (const move of pokemonData.moves) {
                    pokemonStrength += calculateMoveImpact(move, pokemonStats);
                }

                totalStrength += pokemonStrength;
            }

            // Normalize and set trainer rating
            trainer.rating = Math.round(totalStrength);
            await trainer.save();
            console.log(`Updated trainer ${trainer.name} with rating ${Math.round(totalStrength)}`);
        }

    } catch (error) {
        console.error('Error calculating trainer strength:', error.message);
    } finally {
        mongoose.disconnect();
    }
};

module.exports = calculateTrainerStrength;
