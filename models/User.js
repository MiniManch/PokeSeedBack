const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  team: [{ type: String, ref: 'Pokemon' }],
  rating: { type: Number, default: 0 },
  wins: { type: Number, default: 0 },
  losses: { type: Number, default: 0 },
  champion: { type: Number, default: 0 },
  trainer: { type: String, required: false },
  bg: { type: String, required: false },
});

UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.statics.updateUserStats = async function (userId, didWin) {
  try {
    const update = didWin ? { $inc: { wins: 1 } } : { $inc: { losses: 1 } };
    await this.findByIdAndUpdate(userId, update);
    return true;
  } catch (error) {
    throw new Error('Error updating user stats');
  }
};

module.exports = mongoose.model('User', UserSchema, 'User');
