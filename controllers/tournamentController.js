// controllers/tournamentController.js
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const PokeTrainer = require('../models/PokeTrainers');

const getNextRoundType= (currentRoundType) => {
  const roundsOrder = ['Eighth Final', 'Quarter Final', 'Semi Final', 'Final'];
  const currentIndex = roundsOrder.indexOf(currentRoundType);
  return currentIndex >= 0 && currentIndex < roundsOrder.length - 1 ? roundsOrder[currentIndex + 1] : null;
}

const simulateRound = async (tournament, roundType) => {
  const currentRoundMatches = tournament.matches.filter(m => m.roundType === roundType && !m.winner);

  for (const match of currentRoundMatches) {
    // Simulate winner based on rating with randomness
    const [trainer1, trainer2] = await Promise.all([
      PokeTrainer.findOne({ name: match.players[0] }),
      PokeTrainer.findOne({ name: match.players[1] }),
    ]);

    const trainer1Score = Math.random() * (trainer1.rating || 1);
    const trainer2Score = Math.random() * (trainer2.rating || 1);

    const winner = trainer1Score > trainer2Score ? trainer1 : trainer2;
    const loser = winner === trainer1 ? trainer2 : trainer1;

    // Update the match with simulated result
    match.winner = winner._id;
    match.loser = loser._id;
  }

  // Get all matches of the next round
  const nextRound = getNextRoundType(roundType);
  const nextRoundMatches = tournament.matches.filter(m => m.roundType === nextRound && !m.winner);

  // Get all winners from the current round
  const previousRoundWinners = currentRoundMatches.map(match => match.winner);

  // Shuffle winners and randomly assign matches for the next round
  const shuffledWinners = previousRoundWinners.sort(() => Math.random() - 0.5);
  for (let i = 0; i < shuffledWinners.length; i += 2) {
    if (shuffledWinners[i + 1] && nextRoundMatches[i / 2]) {
      nextRoundMatches[i / 2].players = [
        await PokeTrainer.findById(shuffledWinners[i]).name,
        await PokeTrainer.findById(shuffledWinners[i + 1]).name,
      ];
    }
  }

  // Save the updated tournament after the round simulation
  await tournament.save();
};

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
          matches[i].userPlayingAs = userTrainer._id;
          matches[i].isHumanPlayerInvolved = true;
          matches[i].userId = user._id;
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

exports.addMatchResult = async (req, res) => {
  try {
    const { tournamentId, matchNumber, winnerName, loserName } = req.body;

    const tournament = await Tournament.findById(tournamentId);
    if (!tournament) return res.status(404).json({ message: 'Tournament not found' });

    const match = tournament.matches.find(m => m._id.toString() === matchNumber);
    if (!match) return res.status(404).json({ message: 'Match not found' });

    const winnerTrainer = await PokeTrainer.findOne({ name: winnerName });
    const loserTrainer = await PokeTrainer.findOne({ name: loserName });
    if (!winnerTrainer || !loserTrainer) {
      return res.status(404).json({ message: 'Winner or loser trainer not found' });
    }

    match.winner = winnerTrainer._id;
    match.loser = loserTrainer._id;

    if (match.isHumanPlayerInvolved) {
      const user = await User.findById(match.userId);
      if (winnerTrainer._id.equals(user.trainer)) {
        await User.updateUserStats(user._id, true);
      } else {
        await User.updateUserStats(user._id, false);
      }
    }

    // Simulate the rest of the round
    await simulateRound(tournament, match.roundType);

    res.status(200).json({ message: 'Match result added and round simulated successfully', match });
  } catch (error) {
    console.error('Error adding match result:', error);
    res.status(500).json({ message: 'Error adding match result', error });
  }
};