const fs = require('fs');

// Load the PokeMoves.json file
const POKE_MOVES_FILE = './moves_with_stats.json'; // Adjust the path as necessary
let pokeMovesData = JSON.parse(fs.readFileSync(POKE_MOVES_FILE));

// Function to generate a random integer between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Update each move in the file
pokeMovesData = pokeMovesData.map(move => {
  if (move.melt_damage_percent) {
    move.effect_percent = move.melt_damage_percent; // Change to effect_percent
    delete move.melt_damage_percent;
  } else {
    move.effect_percent = getRandomInt(10, 80); // Generate random effect_percent
  }
  
  return move;
});

// Save the updated data back to moves_with_stats.json
fs.writeFileSync(POKE_MOVES_FILE, JSON.stringify(pokeMovesData, null, 2));
console.log('moves_with_stats.json updated successfully!');
