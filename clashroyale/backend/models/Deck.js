// Deck model (embedded in User, but can be separate if needed)
const mongoose = require('mongoose');

const deckSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  cards: [{
    type: String,
    required: true,
  }],
  isActive: {
    type: Boolean,
    default: false,
  },
  wins: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Validate deck has exactly 8 cards
deckSchema.pre('save', function(next) {
  if (this.cards.length !== 8) {
    return next(new Error('Deck must contain exactly 8 cards'));
  }
  next();
});

module.exports = mongoose.model('Deck', deckSchema);