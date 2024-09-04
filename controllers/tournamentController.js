// controllers/tournamentController.js
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const PokeTrainer = require('../models/PokeTrainers');

// Create a new tournament
exports.createTournament = async (req, res) => {
  try {
    const { username } = req.body;
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const userTrainer = await PokeTrainer.findOne({ name: user.trainer });

    if (!userTrainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    // Fetch all trainers excluding the user's trainer
    const allTrainers = await PokeTrainer.find({ _id: { $ne: userTrainer._id } });
    const onlyOppTrainers = allTrainers.filter(t => t.rating !== '');

    // Check if there are enough trainers
    if (onlyOppTrainers.length < 15) {
      return res.status(400).json({ message: 'Not enough trainers to create a tournament.' });
    }

    // Add the user's trainer to the list of trainers
    const trainers = [...onlyOppTrainers, userTrainer];
    
    // Shuffle trainers and select the required number for the tournament
    const shuffledTrainers = trainers.sort(() => 0.5 - Math.random()).slice(0, 16);

    // Tournament structure with 15 matches
    const matches = [
      { matchNumber: 1, roundType: 'Eighth Final' },
      { matchNumber: 2, roundType: 'Eighth Final' },
      { matchNumber: 3, roundType: 'Eighth Final' },
      { matchNumber: 4, roundType: 'Eighth Final' },
      { matchNumber: 5, roundType: 'Eighth Final' },
      { matchNumber: 6, roundType: 'Eighth Final' },
      { matchNumber: 7, roundType: 'Eighth Final' },
      { matchNumber: 8, roundType: 'Eighth Final' },
      { matchNumber: 9, roundType: 'Quarter Final' },
      { matchNumber: 10, roundType: 'Quarter Final' },
      { matchNumber: 11, roundType: 'Quarter Final' },
      { matchNumber: 12, roundType: 'Quarter Final' },
      { matchNumber: 13, roundType: 'Semi Final' },
      { matchNumber: 14, roundType: 'Semi Final' },
      { matchNumber: 15, roundType: 'Final' }
    ];

    // Assign trainers to the matches and mark the match involving the user
    let userMatchFound = false;
    for (let i = 0; i < matches.length; i++) {
      if (shuffledTrainers[i * 2] && shuffledTrainers[i * 2 + 1]) {
        const trainer1 = shuffledTrainers[i * 2];
        const trainer2 = shuffledTrainers[i * 2 + 1];
        
        // Set the players for the match
        matches[i].players = [trainer1.name, trainer2.name];
        
        // Check if the user is in this match
        if (trainer1._id.equals(userTrainer._id) || trainer2._id.equals(userTrainer._id)) {
          matches[i].userPlayingAs = user._id;
          matches[i].isHumanPlayerInvolved = true;
          userMatchFound = true;
        }
      } else {
        break; // Not enough trainers to continue assigning
      }
    }

    // If for some reason no match was found for the user, throw an error
    if (!userMatchFound) {
      return res.status(500).json({ message: 'Could not assign the user’s trainer to a match' });
    }

    const newTournament = new Tournament({
      name: `Tournament ${Date.now()}`,
      matches: matches
    });

    await newTournament.save();
    res.status(201).json(newTournament);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Error creating tournament', error });
  }
};


// Update match results and user stats
exports.updateMatchResult = async (req, res) => {
  try {
    const { tournamentId, matchNumber, winnerId, loserId } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) {
      return res.status(404).json({ message: 'Tournament not found' });
    }

    const match = tournament.matches.find(m => m.matchNumber === matchNumber);
    if (!match) {
      return res.status(404).json({ message: 'Match not found' });
    }

    match.winner = winnerId;
    match.loser = loserId;

    // Check if the match involves a human player and update user stats
    if (match.isHumanPlayerInvolved) {
      const user = await User.findById(match.userPlayingAs);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (winnerId.equals(user._id)) {
        await User.updateUserStats(user._id, true);  // Update as a win
      } else {
        await User.updateUserStats(user._id, false); // Update as a loss
      }
    }

    await tournament.save();
    res.status(200).json({ message: 'Match result updated', match });
  } catch (error) {
    res.status(500).json({ message: 'Error updating match result', error });
  }
};
