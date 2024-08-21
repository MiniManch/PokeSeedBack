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
mongoose.connect("mongodb+srv://manorokah4:IATeyLGTiwCBNqYZ@pokeseed.vvz2voi.mongodb.net/PokeSeed?retryWrites=true&w=majority&appName=PokeSeed", {
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
async function filterAndFetchPokemon(type, finalPokemonList, typePokemonMap, seenPokemon) {
    const pokemonList = await fetchPokemonByType(type);

    // Create a separate list to collect all Normal-type Pokémon
    const normalTypePokemonList = [];

    for (const item of pokemonList) {
        const details = await fetchPokemonDetails(item.pokemon.url);

        const isNormalType = details.types.some(t => t.type.name === 'normal');

        // If the Pokémon has Normal as one of its types, add it to the normalTypePokemonList
        if (isNormalType) {
            normalTypePokemonList.push(details);
        }

        // Ensure Pokémon is categorized under the correct type
        let categorizedType = type;
        if (details.types.length > 1 && isNormalType) {
            categorizedType = details.types.find(t => t.type.name !== 'normal').type.name;
        }

        const species = await axios.get(details.species.url);
        const evolutionChain = await axios.get(species.data.evolution_chain.url);
        const finalEvolution = getFinalEvolution(evolutionChain.data.chain);

        if (finalEvolution !== details.name) continue; // Ensure it's the final evolution

        // Skip if the Pokémon has already been added
        if (seenPokemon.has(details.name)) continue;

        if (!typePokemonMap[categorizedType]) {
            typePokemonMap[categorizedType] = new Set();
        }

        if (typePokemonMap[categorizedType].size < 20) { // Ensure we have at least 20 Pokémon for this type
            if (!typePokemonMap[categorizedType].has(details.name)) {
                const pokemonData = {
                    name: details.name,
                    type: categorizedType,
                    frontSprite: details.sprites.front_default,
                    backSprite: details.sprites.back_default,
                    cry: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${details.id}.ogg`,
                    moves: [] // Will be filled later
                };

                if (pokemonData.backSprite) {
                    finalPokemonList.push(pokemonData);
                    typePokemonMap[categorizedType].add(details.name);
                    seenPokemon.add(details.name); // Mark the Pokémon as seen
                }
            }
        }

        if (typePokemonMap[categorizedType].size >= 20) break; // Stop once we have 20 Pokémon for this type
    }

    // If we're currently processing the Normal type, select 20 random Normal-type Pokémon
    if (type === 'normal') {
        const finalNormalPokemonList = await Promise.all(normalTypePokemonList.map(async pokemon => {
            const species = await axios.get(pokemon.species.url);
            const evolutionChain = await axios.get(species.data.evolution_chain.url);
            const finalEvolution = getFinalEvolution(evolutionChain.data.chain);

            if (finalEvolution === pokemon.name) {
                return pokemon;
            }
            return null;
        }));

        // Filter out any null values from the list
        const validNormalPokemonList = finalNormalPokemonList.filter(pokemon => pokemon !== null);

        // Randomly shuffle the validNormalPokemonList and pick 20 Pokémon
        const randomNormalPokemon = validNormalPokemonList
            .sort(() => 0.5 - Math.random()) // Shuffle the list
            .slice(0, 20); // Get the first 20 Pokémon

        for (const pokemon of randomNormalPokemon) {
            if (!typePokemonMap['normal']) {
                typePokemonMap['normal'] = new Set();
            }

            if (seenPokemon.has(pokemon.name)) continue;

            const pokemonData = {
                name: pokemon.name,
                type: 'normal',
                frontSprite: pokemon.sprites.front_default,
                backSprite: pokemon.sprites.back_default,
                cry: `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${pokemon.id}.ogg`,
                moves: [] // Will be filled later
            };

            if (pokemonData.backSprite && !typePokemonMap['normal'].has(pokemon.name)) {
                finalPokemonList.push(pokemonData);
                typePokemonMap['normal'].add(pokemon.name);
                seenPokemon.add(pokemon.name); // Mark the Pokémon as seen
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
    const seenPokemon = new Set(); // Set to track Pokémon that have already been processed

    for (const type of TYPES) {
        await filterAndFetchPokemon(type, finalPokemonList, typePokemonMap, seenPokemon);
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
