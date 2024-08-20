const axios = require('axios');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const POKE_API_BASE_URL = 'https://pokeapi.co/api/v2';
const POKE_MOVES_FILE = './data/updated_moves.json'; // Adjust the path as necessary
const TYPES = [
  'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost',
  'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon',
  'dark', 'fairy'
];

const Pokemon = require('../../models/Pokemon');

// Connect to MongoDB
mongoose.connect(process.env.MONG_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch((err) => console.error('MongoDB connection error:', err));

// Fetch Pokémon by type from PokeAPI
async function fetchPokemonByType(type) {
    const response = await axios.get(`${POKE_API_BASE_URL}/type/${type}`);
    return response.data.pokemon;
}

// Fetch Pokémon details from PokeAPI
async function fetchPokemonDetails(url) {
    const response = await axios.get(url);
    return response.data;
}

// Fetch Pokémon moves from the JSON file
async function fetchPokemonMoves() {
    const data = fs.readFileSync(POKE_MOVES_FILE);
    return JSON.parse(data);
}

// Get the final evolution name
function getFinalEvolution(pokemonSpecies) {
    let currentEvolution = pokemonSpecies;
    while (currentEvolution.evolves_to.length) {
        currentEvolution = currentEvolution.evolves_to[0];
    }
    return currentEvolution.species.name;
}

// Filter and fetch Pokémon data
async function filterAndFetchPokemon(type, finalPokemonList, typePokemonMap) {
    const pokemonList = await fetchPokemonByType(type);

    for (const item of pokemonList) {
        const details = await fetchPokemonDetails(item.pokemon.url);
        
        const isNormalType = details.types[0].type.name === 'normal';
        if (details.types.length > 1 && isNormalType) {
            type = details.types[1].type.name; // Use the second type if primary type is Normal
        }

        const species = await axios.get(details.species.url);
        const evolutionChain = await axios.get(species.data.evolution_chain.url);
        const finalEvolution = getFinalEvolution(evolutionChain.data.chain);

        if (finalEvolution !== details.name) continue; // Ensure it's the final evolution

        if (!typePokemonMap[type]) {
            typePokemonMap[type] = new Set();
        }

        if (typePokemonMap[type].size >= 20) {
            continue; // Skip if we already have 20 Pokémon for this type
        }

        if (!typePokemonMap[type].has(details.name)) {
            const pokemonData = {
                name: details.name,
                type: type,
                frontSprite: details.sprites.front_default,
                backSprite: details.sprites.back_default,
                cry: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${details.id}.ogg`,
                moves: [] // Will be filled later
            };

            if (pokemonData.backSprite) {
                finalPokemonList.push(pokemonData);
                typePokemonMap[type].add(details.name);
            }
        }
    }
}

// Assign moves to Pokémon
function assignMovesToPokemon(pokemonList, movesData) {
    pokemonList.forEach(pokemon => {
        const typeMoves = movesData.filter(move => move.type === pokemon.type);
        const normalMoves = movesData.filter(move => move.type === 'normal');
        
        let selectedMoves = typeMoves.slice(0, 4);
        if (selectedMoves.length < 4) {
            selectedMoves = selectedMoves.concat(normalMoves.slice(0, 4 - selectedMoves.length));
        }
        
        pokemon.moves = selectedMoves.map(move => ({
            name: move.name,
            url: move.url,
            type: move.type,
            dmg: move.dmg,
            acc: move.acc,
            sp: move.sp,
            effect: move.effect || '',
            effect_acc: move.effect_acc || 0,
            effect_percent: move.effect_percent || 0
        }));
    });
}

// Generate Pokémon JSON file and save to MongoDB
const generatePokemonJSON = async () => {
    const movesData = await fetchPokemonMoves();
    const finalPokemonList = [];
    const typePokemonMap = {}; // Map to keep track of Pokémon by type

    for (const type of TYPES) {
        await filterAndFetchPokemon(type, finalPokemonList, typePokemonMap);
    }

    assignMovesToPokemon(finalPokemonList, movesData);

    fs.writeFileSync('./finalPokemon.json', JSON.stringify(finalPokemonList, null, 2));
    console.log('finalPokemon.json created successfully!');

    // Save Pokémon to MongoDB
    try {
        await Pokemon.deleteMany(); // Clear existing Pokémon
        await Pokemon.insertMany(finalPokemonList);
        console.log('Pokémon data saved to MongoDB successfully!');
    } catch (error) {
        console.error('Error saving Pokémon data to MongoDB:', error.message);
    }
};

// Generate random stats and update Pokémon documents
const generateRandomStats = () => ({
    str: Math.floor(Math.random() * (150 - 60 + 1)) + 60,
    hp: Math.floor(Math.random() * (450 - 250 + 1)) + 250,
    def: Math.floor(Math.random() * (150 - 60 + 1)) + 60,
});

const updatePokemonStats = async () => {
    try {
        // Find all Pokémon in the database
        const pokemons = await Pokemon.find();

        if (pokemons.length === 0) {
            console.log('No Pokémon found in the database.');
            return;
        }

        console.log(`Found ${pokemons.length} Pokémon`);

        for (const pokemon of pokemons) {
            // Generate random stats
            const stats = generateRandomStats();

            // Update Pokémon document with new stats
            pokemon.stats = stats;
            await pokemon.save();
            console.log(`Updated ${pokemon.name} with stats:`, stats);
        }

    } catch (error) {
        console.error('Error updating Pokémon stats:', error.message);
    } finally {
        mongoose.disconnect();
        console.log('MongoDB disconnected');
    }
};

// Main function to execute all tasks
const main = async () => {
    await generatePokemonJSON();
    await updatePokemonStats();
};

main();
