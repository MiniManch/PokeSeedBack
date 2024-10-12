const axios = require('axios');
const fs = require('fs');
const mongoose = require('mongoose');
require('dotenv').config();

const POKE_API_BASE_URL = 'https://pokeapi.co/api/v2';
const POKE_MOVES_FILE = '../../data/updated_moves.json'; // Adjust the path as necessary
const TYPES = [
  'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost',
  'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon',
  'dark', 'fairy'
];

const Pokemon = require('../../models/Pokemon');

console.log('Starting script execution...');

// Connect to MongoDB
mongoose.connect("mongodb+srv://manorokah4:IATeyLGTiwCBNqYZ@pokeseed.vvz2voi.mongodb.net/PokeSeed?retryWrites=true&w=majority&appName=PokeSeed", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1); // Exit if the database connection fails
});

// Fetch Pokémon by type from PokeAPI
async function fetchPokemonByType(type) {
    console.log(`Fetching Pokémon by type: ${type}`);
    const response = await axios.get(`${POKE_API_BASE_URL}/type/${type}`);
    console.log(`Fetched ${response.data.pokemon.length} Pokémon for type: ${type}`);
    return response.data.pokemon;
}

// Fetch Pokémon details from PokeAPI
async function fetchPokemonDetails(url) {
    console.log(`Fetching Pokémon details from URL: ${url}`);
    const response = await axios.get(url);
    return response.data;
}

// Fetch Pokémon moves from the JSON file
async function fetchPokemonMoves() {
    console.log(`Reading moves data from file: ${POKE_MOVES_FILE}`);
    const data = fs.readFileSync(POKE_MOVES_FILE);
    console.log(`Moves data read successfully`);
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
    console.log(`Filtering and fetching Pokémon data for type: ${type}`);
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
                    console.log(`Added ${details.name} to final list under type: ${categorizedType}`);
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
                console.log(`Added ${pokemon.name} to final list under type: normal`);
            }
        }
    }

    console.log(`Completed filtering and fetching for type: ${type}`);
}

// Assign moves to Pokémon
function assignMovesToPokemon(pokemonList, movesData) {
    console.log(`Assigning moves to Pokémon`);
    pokemonList.forEach(pokemon => {
        const typeMoves = movesData.filter(move => move.type === pokemon.type);
        const normalMoves = movesData.filter(move => move.type === 'normal');

        // Randomly select 1 or 2 normal moves
        const numNormalMoves = Math.floor(Math.random() * 2) + 1; // 1 or 2
        const selectedNormalMoves = [];
        for (let i = 0; i < numNormalMoves; i++) {
            const randomIndex = Math.floor(Math.random() * normalMoves.length);
            selectedNormalMoves.push(normalMoves[randomIndex]);
            normalMoves.splice(randomIndex, 1); // Remove selected move to avoid duplicates
        }

        // Select the remaining moves from the Pokémon's type
        const numTypeMoves = 4 - selectedNormalMoves.length; // Remaining moves to select
        const selectedTypeMoves = [];
        for (let i = 0; i < numTypeMoves; i++) {
            const randomIndex = Math.floor(Math.random() * typeMoves.length);
            selectedTypeMoves.push(typeMoves[randomIndex]);
            typeMoves.splice(randomIndex, 1); // Remove selected move to avoid duplicates
        }

        // Combine selected normal and type moves
        const selectedMoves = selectedNormalMoves.concat(selectedTypeMoves);

        // Assign the selected moves to the Pokémon with currentSp equal to sp
        pokemon.moves = selectedMoves.map(move => ({
            name: move.name,
            url: move.url,
            type: move.type,
            dmg: move.dmg,
            acc: move.acc,
            sp: move.sp,
            currentSp: move.sp, // Set currentSp equal to sp
            effect: move.effect || '',
            effect_acc: move.effect_acc || 0,
            effect_percent: move.effect_percent || 0,
            melt_turns: move.effect === 'melt' ? Math.floor(Math.random() * 3) + 1 : null // Random melt_turns for melt effect, null otherwise
        }));

        console.log(`Assigned moves to ${pokemon.name}`);
    });
}

// Generate Pokémon JSON file and save to MongoDB
const generatePokemonJSON = async () => {
    console.log('Generating Pokémon JSON file...');
    const movesData = await fetchPokemonMoves();
    const finalPokemonList = [];
    const typePokemonMap = {};
    const seenPokemon = new Set();

    for (const type of TYPES) {
        await filterAndFetchPokemon(type, finalPokemonList, typePokemonMap, seenPokemon);
    }

    assignMovesToPokemon(finalPokemonList, movesData);

    // Add pokeDexImg for each Pokémon in the list
    finalPokemonList.forEach(pokemon => {
        pokemon.pokeDexImg = `https://img.pokemondb.net/sprites/black-white/anim/normal/${pokemon.name}.gif`
    });

    fs.writeFileSync('./finalPokemon.json', JSON.stringify(finalPokemonList, null, 2));
    console.log('finalPokemon.json created successfully!');

    // Save Pokémon to MongoDB
    try {
        console.log('Saving Pokémon data to MongoDB...');
        await Pokemon.deleteMany(); // Clear existing Pokémon
        await Pokemon.insertMany(finalPokemonList);
        console.log('Pokémon data saved to MongoDB successfully!');
    } catch (error) {
        console.error('Error saving Pokémon data to MongoDB:', error.message);
    }
};

// Generate random stats and update Pokémon documents
const updatePokemonStats = async () => {
    console.log('Updating Pokémon stats...');
    try {
        const pokemons = await Pokemon.find();
        if (pokemons.length === 0) {
            console.log('No Pokémon found in the database.');
            return;
        }

        console.log(`Found ${pokemons.length} Pokémon`);

        for (const pokemon of pokemons) {
            pokemon.stats = {
                hp: Math.floor(Math.random() * 501) + 150,       
                str: Math.floor(Math.random() * 101) + 50,      
                def: Math.floor(Math.random() * 101) + 50,      
                spAtk: Math.floor(Math.random() * 101) + 50,     
                spDef: Math.floor(Math.random() * 101) + 50,     
                speed: Math.floor(Math.random() * 81) + 20,     
            };

            // Assign current stats
            pokemon.stats.currentHp = pokemon.stats.hp;
            pokemon.stats.currentStr = pokemon.stats.str;
            pokemon.stats.currentDef = pokemon.stats.def;

            await pokemon.save();
            console.log(`Updated ${pokemon.name} with stats:`, pokemon.stats);
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
    console.log('Starting main execution...');
    await generatePokemonJSON();
    await updatePokemonStats();
    console.log('Script execution completed.');
};

main();
