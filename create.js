const fs = require('fs');
const axios = require('axios');

// Load the moves_with_stats JSON file
const movesWithStats = JSON.parse(fs.readFileSync('./data/moves_with_stats_updated.json', 'utf8'));

// Helper function to generate a random number between min and max
const getRandomStat = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// Helper function to randomly select items from an array
const getRandomMoves = (moves, count) => {
    const shuffled = moves.sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

// Function to fetch evolution chain data and determine if the Pokémon is the final evolution
const isFinalEvolution = async (speciesUrl) => {
    try {
        const speciesResponse = await axios.get(speciesUrl);
        const evolutionChainUrl = speciesResponse.data.evolution_chain.url;
        const evolutionResponse = await axios.get(evolutionChainUrl);

        const chain = evolutionResponse.data.chain;
        let currentEvolution = chain;

        while (currentEvolution.evolves_to.length > 0) {
            currentEvolution = currentEvolution.evolves_to[0];
        }

        // Return true if the Pokémon is the final evolution in the chain
        return speciesResponse.data.name === currentEvolution.species.name;
    } catch (error) {
        console.error(`Failed to fetch evolution chain:`, error);
        return false;
    }
};

// Function to fetch individual Pokémon data
const fetchIndividualPokemon = async (url) => {
    try {
        const response = await axios.get(url);
        const data = response.data;

        // Check for sprites and cry
        const frontSprite = data.sprites.front_default;
        const backSprite = data.sprites.back_default;
        const cry = data.cries ? data.cries.latest : null;

        // Check if the Pokémon is the final evolution
        const isFinal = await isFinalEvolution(data.species.url);

        if (frontSprite && backSprite && cry && isFinal) {
            // Determine the Pokémon's type
            const type = data.types[0].type.name === 'normal' && data.types.length > 1 ? data.types[1].type.name : data.types[0].type.name;

            // Fetch moves based on type
            const validMoves = movesWithStats.filter(move => move.type === 'normal' || move.type === type);
            const typeSpecificMoves = validMoves.filter(move => move.type === type);
            const normalMoves = validMoves.filter(move => move.type === 'normal');

            const moveCount = getRandomStat(3, 4);
            const typeMovesCount = Math.max(1, moveCount - 2);
            const selectedMoves = [
                ...getRandomMoves(typeSpecificMoves, typeMovesCount),
                ...getRandomMoves(normalMoves, moveCount - typeMovesCount)
            ];

            return {
                name: data.name,
                type: type,
                frontSprite: frontSprite,
                backSprite: backSprite,
                cry: cry,
                moves: selectedMoves,
                stats: {
                    str: getRandomStat(30, 100),
                    hp: getRandomStat(120, 300),
                    def: getRandomStat(30, 100)
                }
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error(`Failed to fetch individual Pokémon data:`, error);
        return null;
    }
};

// Function to fetch data from PokeAPI
const fetchPokemonData = async (type) => {
    const pokemonData = [];
    let offset = 0;

    while (pokemonData.length < 50) {
        const apiUrl = `https://pokeapi.co/api/v2/type/${type.toLowerCase()}/?offset=${offset}&limit=50`;
        try {
            const response = await axios.get(apiUrl);
            const pokemons = response.data.pokemon;

            for (let pkmn of pokemons) {
                const pokemon = await fetchIndividualPokemon(pkmn.pokemon.url);
                if (pokemon && pokemonData.length < 50) {
                    pokemonData.push(pokemon);
                }
                if (pokemonData.length >= 50) break;
            }

            offset += 50; // Increase offset to fetch the next batch if needed
        } catch (error) {
            console.error(`Failed to fetch data for type ${type}:`, error);
            break; // If there's an error, exit the loop
        }
    }

    return pokemonData;
};

// Main function to fetch 50 Pokémon per type and save the data
const fetchAllTypes = async () => {
    const types = ["normal", "fire", "water", "electric", "grass", "ice", "fighting", "poison", "ground", "flying", "psychic", "bug", "rock", "ghost", "dragon", "dark", "steel", "fairy"];
    const allPokemons = [];

    for (let type of types) {
        const pokemons = await fetchPokemonData(type);
        allPokemons.push(...pokemons);
        console.log(`${pokemons.length} Pokémon fetched for type ${type}`);
    }

    // Write the data to a JSON file
    fs.writeFileSync('filteredFinalEvolutionsByType.json', JSON.stringify(allPokemons, null, 2), 'utf8');
    console.log('Pokémon data by type has been successfully saved!');
};

// Execute the fetch
fetchAllTypes();
