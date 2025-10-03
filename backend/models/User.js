// User model
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  level: {
    type: Number,
    default: 1,
  },
  experience: {
    type: Number,
    default: 0,
  },
  trophies: {
    type: Number,
    default: 0,
  },
  gold: {
    type: Number,
    default: 1000,
  },
  wins: {
    type: Number,
    default: 0,
  },
  losses: {
    type: Number,
    default: 0,
  },
  cards: [{
    cardId: String,
    level: {
      type: Number,
      default: 1,
      min: 1,
      max: 11,
    },
    count: {
      type: Number,
      default: 0,
    },
  }],
  decks: [{
    name: String,
    cards: [String], // Array of 8 card IDs
    isActive: Boolean,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Method to initialize default cards
userSchema.methods.initializeCards = function() {
  const CARDS = require('../../shared/cards/cardData');
  const defaultCards = ['knight', 'archers', 'giant', 'fireball', 'cannon', 'musketeer', 'hogRider', 'arrows'];
  
  this.cards = defaultCards.map(cardId => ({
    cardId,
    level: 1,
    count: 0,
  }));
  
  this.decks = [{
    name: 'Default Deck',
    cards: defaultCards,
    isActive: true,
  }];
};

module.exports = mongoose.model('User', userSchema);