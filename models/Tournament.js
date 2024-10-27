const mongoose = require('mongoose');

const MatchSchema = new mongoose.Schema({
  matchNumber: { type: Number, required: true },
  roundType: { type: String, required: true },
  players: [{ type: String, required: true }], // Change to String
  winner: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
  loser: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
  userPlayingAs: { type: mongoose.Schema.Types.ObjectId, ref: 'Trainer' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isHumanPlayerInvolved: { type: Boolean, default: false }
});

const TournamentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  matches: [MatchSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Tournament', TournamentSchema,'Tournament');
