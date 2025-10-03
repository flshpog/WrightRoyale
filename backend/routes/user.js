// User routes
const express = require('express');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Get user profile
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update deck
router.post('/deck', authMiddleware, async (req, res) => {
  try {
    const { name, cards } = req.body;

    // Validate
    if (!cards || cards.length !== 8) {
      return res.status(400).json({ error: 'Deck must contain exactly 8 cards' });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Add or update deck
    const existingDeck = user.decks.find(d => d.name === name);
    if (existingDeck) {
      existingDeck.cards = cards;
    } else {
      user.decks.push({ name, cards, isActive: user.decks.length === 0 });
    }

    await user.save();
    res.json({ message: 'Deck saved successfully', decks: user.decks });
  } catch (error) {
    console.error('Deck save error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Set active deck
router.post('/deck/activate', authMiddleware, async (req, res) => {
  try {
    const { deckName } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Deactivate all decks
    user.decks.forEach(deck => {
      deck.isActive = deck.name === deckName;
    });

    await user.save();
    res.json({ message: 'Active deck updated', decks: user.decks });
  } catch (error) {
    console.error('Deck activation error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Upgrade card
router.post('/cards/upgrade', authMiddleware, async (req, res) => {
  try {
    const { cardId } = req.body;

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const card = user.cards.find(c => c.cardId === cardId);
    if (!card) {
      return res.status(404).json({ error: 'Card not found' });
    }

    if (card.level >= 11) {
      return res.status(400).json({ error: 'Card is already at max level' });
    }

    // Simple upgrade cost calculation
    const upgradeCost = card.level * 100;
    if (user.gold < upgradeCost) {
      return res.status(400).json({ error: 'Not enough gold' });
    }

    card.level += 1;
    user.gold -= upgradeCost;

    await user.save();
    res.json({ 
      message: 'Card upgraded successfully', 
      card,
      gold: user.gold,
    });
  } catch (error) {
    console.error('Card upgrade error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const topPlayers = await User.find()
      .sort({ trophies: -1 })
      .limit(100)
      .select('username level trophies wins losses');
    
    res.json(topPlayers);
  } catch (error) {
    console.error('Leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;