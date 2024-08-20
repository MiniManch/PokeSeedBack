require('dotenv').config();
const mongoose = require('mongoose');
const Pokemon = require('../models/Pokemon');

// Connect to MongoDB
mongoose.connect("mongodb+srv://manorokah4:IATeyLGTiwCBNqYZ@pokeseed.vvz2voi.mongodb.net/PokeSeed?retryWrites=true&w=majority&appName=PokeSeed", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Load Pokémon data from JSON file
const loadPokemonData = async () => {
    try {
        const data = require('./finalPokemon.json'); // Adjust the path to your JSON file

        for (const pokemon of data) {
            // Check if Pokémon already exists in the database
            const existingPokemon = await Pokemon.findOne({ name: pokemon.name });

            if (existingPokemon) {
                console.log(`Pokemon ${pokemon.name} already exists in the database.`);
                continue;
            }

            // Create a new Pokémon document
            const newPokemon = new Pokemon({
                name: pokemon.name,
                type: pokemon.type,
                sprites: {
                    front: pokemon.frontSprite,
                    back: pokemon.backSprite
                },
                cry: pokemon.cry,
                moves: pokemon.moves.map(move => ({
                    name: move.name,
                    url: move.url,
                    type: move.type,
                    dmg: move.dmg,
                    acc: move.acc,
                    sp: move.sp,
                    effect: move.effect,
                    effect_acc: move.effect_acc,
                    effect_percent: move.effect_percent
                })),
            });

            // Save the Pokémon to the database
            await newPokemon.save();
            console.log(`Pokemon ${pokemon.name} uploaded successfully.`);
        }

    } catch (error) {
        console.error('Error uploading Pokémon:', error.message);
    } finally {
        mongoose.disconnect();
        console.log('MongoDB disconnected');
    }
};

// Execute the function
loadPokemonData();
