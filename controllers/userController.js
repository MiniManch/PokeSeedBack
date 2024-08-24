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

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(200).json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Error logging in', error });
    console.log(error);
  }
};

// Update user information (flexible route)
exports.updateUser = async (req, res) => {
  try {
    const { username } = req.params; // Assuming userId is passed as a URL parameter
    const updates = req.body; // Updates to apply
    const token = req.header('Authorization')?.replace('Bearer ', '');

    // Check token validity
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      res.status(401).json({ message: 'Invalid or expired token', error });
    }

    // Handle password update if present
    if (updates.password) {
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(updates.password, salt);
    }

    const updatedUser = await User.findOneAndUpdate(username, updates, { new: true });

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.status(200).json({ message: 'User updated successfully', user: updatedUser });
  } catch (error) {
    res.status(500).json({ message: 'Error updating user', error });
  }
};

exports.getUserData = async (req, res) => {
  const { username } = req.params; // This should correctly fetch the username from the URL
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token || !username) {
      return res.status(401).json({ message: 'No token or username provided' });
  }

  try {
      const user = await User.findOne({ username });
      if (!user) {
          return res.status(400).json({ message: 'Invalid username' });
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      res.status(200).json({ message: 'Valid retrieval', user: user });
  } catch (error) {
      res.status(401).json({ message: 'Invalid or expired token', error });
  }
};

// Check if the login token is valid
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
