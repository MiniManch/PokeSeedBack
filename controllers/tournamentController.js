// controllers/tournamentController.js
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const PokeTrainer = require('../models/PokeTrainer');

// Create a new tournament
exports.createTournament = async (req, res) => {
  try {
    const { userId, selectedTrainerId } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const trainer = await PokeTrainer.findById(selectedTrainerId);
    if (!trainer) {
      return res.status(404).json({ message: 'Trainer not found' });
    }

    // Tournament structure with 15 matches
    const matches = [
      // 8 Eighth Finals
      { matchNumber: 1, roundType: 'Eighth Final' },
      { matchNumber: 2, roundType: 'Eighth Final' },
      { matchNumber: 3, roundType: 'Eighth Final' },
      { matchNumber: 4, roundType: 'Eighth Final' },
      { matchNumber: 5, roundType: 'Eighth Final' },
      { matchNumber: 6, roundType: 'Eighth Final' },
      { matchNumber: 7, roundType: 'Eighth Final' },
      { matchNumber: 8, roundType: 'Eighth Final' },
      // 4 Quarter Finals
      { matchNumber: 9, roundType: 'Quarter Final' },
      { matchNumber: 10, roundType: 'Quarter Final' },
      { matchNumber: 11, roundType: 'Quarter Final' },
      { matchNumber: 12, roundType: 'Quarter Final' },
      // 2 Semi Finals
      { matchNumber: 13, roundType: 'Semi Final' },
      { matchNumber: 14, roundType: 'Semi Final' },
      // 1 Final
      { matchNumber: 15, roundType: 'Final' }
    ];

    const newTournament = new Tournament({
      name: `Tournament ${Date.now()}`,
      matches: matches.map(match => ({
        ...match,
        userPlayingAs: user._id,
        isHumanPlayerInvolved: true
      }))
    });

    await newTournament.save();
    res.status(201).json(newTournament);
  } catch (error) {
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
