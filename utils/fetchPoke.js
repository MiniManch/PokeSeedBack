const axios = require('axios');
const fs = require('fs');

const POKE_API_BASE_URL = 'https://pokeapi.co/api/v2';
const POKE_MOVES_FILE = './data/updated_moves.json'; // Adjust the path as necessary
const TYPES = [
  'normal', 'fighting', 'flying', 'poison', 'ground', 'rock', 'bug', 'ghost',
  'steel', 'fire', 'water', 'grass', 'electric', 'psychic', 'ice', 'dragon',
  'dark', 'fairy'
];

async function fetchPokemonByType(type) {
  const response = await axios.get(`${POKE_API_BASE_URL}/type/${type}`);
  return response.data.pokemon;
}

async function fetchPokemonDetails(url) {
  const response = await axios.get(url);
  return response.data;
}

async function fetchPokemonMoves() {
  const data = fs.readFileSync(POKE_MOVES_FILE);
  return JSON.parse(data);
}

function getFinalEvolution(pokemonSpecies) {
  let currentEvolution = pokemonSpecies;
  while (currentEvolution.evolves_to.length) {
    currentEvolution = currentEvolution.evolves_to[0];
  }
  return currentEvolution.species.name;
}

async function filterAndFetchPokemon(type, finalPokemonList, typePokemonMap) {
  const pokemonList = await fetchPokemonByType(type);

  for (const pokemon of pokemonList) {
    const details = await fetchPokemonDetails(pokemon.pokemon.url);
    
    const isNormalType = details.types[0].type.name === 'normal';
    if (details.types.length > 1 && isNormalType) {
      type = details.types[1].type.name; // Use the second type if primary type is Normal
    } else if (isNormalType) {
      continue;
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

      finalPokemonList.push(pokemonData);
      console.log(pokemonData.name)
      typePokemonMap[type].add(details.name);
    }
  }
}

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

async function generatePokemonJSON() {
  const movesData = await fetchPokemonMoves();
  const finalPokemonList = [];
  const typePokemonMap = {}; // Map to keep track of Pokémon by type

  for (const type of TYPES) {
    await filterAndFetchPokemon(type, finalPokemonList, typePokemonMap);
  }

  assignMovesToPokemon(finalPokemonList, movesData);

  fs.writeFileSync('./finalPokemon.json', JSON.stringify(finalPokemonList, null, 2));
  console.log('finalPokemon.json created successfully!');
}

generatePokemonJSON();
