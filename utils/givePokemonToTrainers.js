
require('dotenv').config();
const mongoose = require('mongoose');
const Pokemon = require('../models/Pokemon'); // Adjust path if necessary
const PokemonTrainer = require('../models/PokeTrainers'); // Adjust path if necessary

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.error('Failed to connect to MongoDB', err));

const getRandomPokemons = async (count) => {
    try {
        const randomPokemons = await Pokemon.aggregate([
            { $sample: { size: count } }
        ]);
        return randomPokemons;
    } catch (error) {
        console.error('Error fetching random Pokémon:', error.message);
        return [];
    }
};

const updateTrainersWithPokemons = async () => {
    try {
        const trainersWithoutBackSprite = await PokemonTrainer.find({ backSprite: '' });
        
        for (const trainer of trainersWithoutBackSprite) {
            const randomPokemons = await getRandomPokemons(4);
            trainer.team = randomPokemons.map(pokemon => ({
                name: pokemon.name,
                frontSprite: pokemon.frontSprite,
                backSprite: pokemon.backSprite // Assuming you may want to include backSprite if needed
            }));
            
            await trainer.save();
            console.log(`Updated trainer ${trainer.name} with random Pokémon`);
        }
        
    } catch (error) {
        console.error('Error updating trainers:', error.message);
    } finally {
        mongoose.disconnect();
    }
};

updateTrainersWithPokemons();
