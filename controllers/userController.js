// controllers/userController.js
const User = require('../models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Register a new user
exports.registerUser = async (req, res) => {
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const newUser = new User({ username, password });
    await newUser.save();

    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error registering user', error });
  }
};

// Login a user
exports.loginUser = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(username)

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.status(200).json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
    console.log(error)
  }
};

// Update user stats after a match
exports.updateUserStats = async (userId, isWin, isChampion = false) => {
  try {
    const user = await User.findById(userId);

    if (isWin) {
      user.wins += 1;
    } else {
      user.losses += 1;
    }

    if (isChampion) {
      user.champion += 1;
    }

    await user.save();
  } catch (error) {
    console.error('Error updating user stats:', error);
  }
};

exports.checkLogin = (req, res) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.status(200).json({ message: 'Login is valid', userId: decoded.userId });
  } catch (error) {
    res.status(401).json({ message: 'Invalid or expired token', error });
  }
};
