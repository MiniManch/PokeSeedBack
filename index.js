require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const pokemonRoutes = require('./routes/pokemon');

const app = express();
const port = process.env.PORT || 3000;

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB'))
.catch(err => console.log('Failed to connect to MongoDB', err));

// Middleware
app.use(express.json());

// Routes
app.use('/api/pokemon', pokemonRoutes);

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
