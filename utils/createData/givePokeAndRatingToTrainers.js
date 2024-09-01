require('dotenv').config();
const mongoose = require('mongoose');
const Pokemon = require('../../models/Pokemon');
const PokemonTrainer = require('../../models/PokeTrainers');

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
    const moveAcc = Number(acc) || 100; // Assume 100% accuracy if not specified
    const effectAcc = Number(effect_acc) || 0;
    const effectPercent = Number(effect_percent) || 0;

    let moveImpact = moveDmg * (pokemonStats?.str || 0) / 100;

    if (effect === 'health up') {
        moveImpact += (moveDmg * (effectPercent / 100)) * (effectAcc / 100);
    } else if (effect === 'skip') {
        moveImpact += (moveImpact * (effectAcc / 100));
    }

    // Apply accuracy to the move's total impact
    moveImpact *= (moveAcc / 100);

    // Ensure a minimum impact
    if (moveImpact <= 0) {
        moveImpact = moveDmg * (moveAcc / 100);
    }

    console.log(`Move Impact for ${move.name}:`, moveImpact);

    return moveImpact;
};

// Assign random Pokémon to a trainer and calculate their strength
const assignPokemonAndCalculateStrength = async () => {
    try {
        const trainers = await PokemonTrainer.find({ backSprite: "" }).populate('team');

        if (trainers.length === 0) {
            console.log('No trainers found with an empty backSprite.');
            return;
        }

        const allPokemon = await Pokemon.find();
        if (allPokemon.length < 4) {
            console.log('Not enough Pokémon in the collection to assign teams.');
            return;
        }

        console.log(`Found ${trainers.length} trainers`);

        for (const trainer of trainers) {
            trainer.team = [];
            const randomPokemon = [];
            while (randomPokemon.length < 4) {
                const randomIndex = Math.floor(Math.random() * allPokemon.length);
                const selectedPokemon = allPokemon[randomIndex];
                if (!randomPokemon.includes(selectedPokemon.name)) {
                    randomPokemon.push(selectedPokemon.name);
                    trainer.team.push(selectedPokemon);
                }
            }

            let totalStrength = 0;
            for (const pokemon of trainer.team) {
                // Calculate Pokémon strength using str, spAtk, and speed, along with other stats
                let pokemonStrength = 
                    (pokemon.stats?.str || 0) + 
                    (pokemon.stats?.spAtk || 0) + 
                    (pokemon.stats?.speed || 0) + 
                    (pokemon.stats?.hp || 0) + 
                    (pokemon.stats?.def || 0);

                    console.log(pokemonStrength)

                // Add move impacts to the Pokémon's strength
                for (const move of pokemon.moves) {
                    const moveImpact = calculateMoveImpact(move, pokemon.stats);
                    pokemonStrength += moveImpact;
                }

                console.log(`Total Strength for ${pokemon.name}:`, pokemonStrength);
                totalStrength += pokemonStrength;
            }

            trainer.rating = isNaN(totalStrength) ? 0 : Math.round(totalStrength);
            console.log(`Trainer ${trainer.name} has a total strength of ${totalStrength} and a rating of ${trainer.rating}`);
            
            await trainer.save();
            console.log(trainer.team);
        }

    } catch (error) {
        console.error('Error assigning Pokémon and calculating trainer strength:', error.message);
    } finally {
        mongoose.disconnect();
        console.log('MongoDB disconnected');
    }
};

// Execute the function
assignPokemonAndCalculateStrength();
