require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const pokemonRoutes = require('./routes/pokemon');
const typesRoutes = require('./routes/Types');
const trainersRoutes = require('./routes/Trainers');
const tournamentRoutes = require('./routes/tournaments');
const userRoutes = require('./routes/Users');

// const updateTrainersWithPokemons = require('./utils/givePokemonToTrainers'); // Adjust path if needed


const app = express();
app.use(cors());
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => {
    console.log('Connected to MongoDB');
    // updateTrainersWithPokemons(); // Run the script after connecting to MongoDB
    // SetupRatings();
})
.catch(err => console.log('Failed to connect to MongoDB', err));

// Middleware
app.use(express.json());

// Routes
app.use('/api/pokemon', pokemonRoutes);
app.use('/api/types', typesRoutes);
app.use('/api/trainers', trainersRoutes);
app.use('/api/users', userRoutes);
app.use('/api/tournaments', tournamentRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
