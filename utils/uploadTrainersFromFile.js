require('dotenv').config();
const mongoose = require('mongoose');
const Pokemon = require('../models/Pokemon');
const PokemonTrainer = require('../models/PokeTrainers');

// Connect to MongoDB
mongoose.connect("mongodb+srv://manorokah4:IATeyLGTiwCBNqYZ@pokeseed.vvz2voi.mongodb.net/PokeSeed?retryWrites=true&w=majority&appName=PokeSeed", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Calculate the impact of a move
const calculateMoveImpact = (move, pokemonStats) => {
    const { dmg, acc, effect, effect_acc, effect_percent } = move;

    const moveDmg = Number(dmg) || 0;
    const moveAcc = Number(acc) || 0;
    const effectAcc = Number(effect_acc) || 0;
    const effectPercent = Number(effect_percent) || 0;

    let moveImpact = moveDmg * (pokemonStats.str || 0) / 100;

    if (effect === 'health up') {
        moveImpact += (moveDmg * (effectPercent / 100)) * (effectAcc / 100);
    } else if (effect === 'skip') {
        moveImpact += (moveImpact * (effectAcc / 100));
    }

    return moveImpact * (moveAcc / 100);
};

// Calculate the strength of trainers
const calculateTrainerStrength = async () => {
    try {
        const trainers = await PokemonTrainer.find({ team: { $ne: [] } });

        if (trainers.length === 0) {
            console.log('No trainers found with non-empty teams.');
            return;
        }

        console.log(`Found ${trainers.length} trainers`);

        for (const trainer of trainers) {
            let totalStrength = 0;

            for (const pokemon of trainer.team) {
                const pokemonData = await Pokemon.findOne({ name: pokemon.name });

                if (!pokemonData) {
                    console.log(`No data found for Pokémon ${pokemon.name}`);
                    continue;
                }

                const pokemonStats = pokemonData.stats;
                if (!pokemonStats) {
                    console.log(`No stats found for Pokémon ${pokemon.name}`);
                    continue;
                }

                let pokemonStrength = (pokemonStats.str || 0) + (pokemonStats.hp || 0) + (pokemonStats.def || 0);

                for (const move of pokemonData.moves) {
                    const moveImpact = calculateMoveImpact(move, pokemonStats);
                    console.log(`Move impact for ${move.name}: ${moveImpact}`);
                    pokemonStrength += moveImpact;
                }

                totalStrength += pokemonStrength;
            }

            trainer.rating = isNaN(totalStrength) ? 0 : Math.round(totalStrength);
            await trainer.save();
            console.log(`Updated trainer ${trainer.name} with rating ${trainer.rating}`);
        }

    } catch (error) {
        console.error('Error calculating trainer strength:', error.message);
    } finally {
        mongoose.disconnect();
        console.log('MongoDB disconnected');
    }
};

// Execute the function
calculateTrainerStrength();
