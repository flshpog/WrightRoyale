// Authentication routes
const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Validation
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ error: 'Username or email already exists' });
    }

    // Create user
    const user = new User({ username, email, password });
    user.initializeCards();
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        level: user.level,
        trophies: user.trophies,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validation
    if (!username || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Find user
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    // Update last login
    user.lastLogin = Date.now();
    await user.save();

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '7d',
    });

    res.json({
      token,
      user: {
        id: user._id,
        username: user.username,
        level: user.level,
        trophies: user.trophies,
        wins: user.wins,
        losses: user.losses,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Guest login
router.post('/guest', async (req, res) => {
  try {
    const guestUsername = `Guest_${Date.now()}`;
    
    const user = new User({
      username: guestUsername,
      email: `${guestUsername}@guest.com`,
      password: Math.random().toString(36),
    });
    
    user.initializeCards();
    await user.save();

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: '24h',
    });

    res.status(201).json({
      token,
      user: {
        id: user._id,
        username: user.username,
        level: user.level,
        trophies: user.trophies,
        isGuest: true,
      },
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;