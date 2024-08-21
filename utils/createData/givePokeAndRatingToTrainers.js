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
    const moveAcc = Number(acc) || 0;
    const effectAcc = Number(effect_acc) || 0;
    const effectPercent = Number(effect_percent) || 0;

    console.log('effectAcc:', effectAcc, 'effectPercent:', effectPercent)
    let moveImpact = moveDmg * (pokemonStats?.str || 0) / 100;

    if (effect === 'health up') {
        moveImpact += (moveDmg * (effectPercent / 100)) * (effectAcc / 100);
    } else if (effect === 'skip') {
        moveImpact += (moveImpact * (effectAcc / 100));
    }

    moveImpact = moveImpact * (moveAcc / 100);

    console.log(`Move Impact for ${move.name}:`, moveImpact);

    return moveImpact;
};

// Assign random Pokémon to a trainer and calculate their strength
const assignPokemonAndCalculateStrength = async () => {
    try {
        // Find trainers with an empty backSprite key and populate the 'team' field with full Pokémon data
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
            // Assign 4 random Pokémon to the trainer
            trainer.team = [];
            const randomPokemon = [];
            while (randomPokemon.length < 4) {
                const randomIndex = Math.floor(Math.random() * allPokemon.length);
                const selectedPokemon = allPokemon[randomIndex];
                if (!randomPokemon.includes(selectedPokemon.name)) {
                    randomPokemon.push(selectedPokemon.name);
                    trainer.team.push(selectedPokemon); // Push the full Pokémon object
                }
            }

            // Calculate the trainer's strength
            let totalStrength = 0;
            for (const pokemon of trainer.team) {
                let pokemonStrength = (pokemon.stats?.str || 0) + (pokemon.stats?.hp || 0) + (pokemon.stats?.def || 0);

                for (const move of pokemon.moves) {
                    const moveImpact = calculateMoveImpact(move, pokemon.stats);
                    pokemonStrength += moveImpact;
                }

                console.log(`Total Strength for ${pokemon.name}:`, pokemonStrength);
                totalStrength += pokemonStrength;
            }

            // Adjusting the rating calculation if necessary
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
