import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Zap, Plus, X, Save, Check } from 'lucide-react';
import { apiService } from '../services/apiService';
import CARDS from '../../../shared/cards/cardData';

const DeckBuilder = ({ user }) => {
  const navigate = useNavigate();
  const [selectedDeck, setSelectedDeck] = useState([]);
  const [deckName, setDeckName] = useState('My Deck');
  const [userCards, setUserCards] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [filter, setFilter] = useState('all'); // all, troop, spell, building
  const [rarityFilter, setRarityFilter] = useState('all');

  useEffect(() => {
    loadUserCards();
  }, []);

  const loadUserCards = async () => {
    try {
      const profile = await apiService.getProfile();
      setUserCards(profile.cards || []);
      
      // Load active deck if exists
      const activeDeck = profile.decks?.find(d => d.isActive);
      if (activeDeck) {
        setSelectedDeck(activeDeck.cards);
        setDeckName(activeDeck.name);
      }
    } catch (error) {
      console.error('Failed to load cards:', error);
    }
  };

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'from-gray-600 to-gray-700',
      rare: 'from-orange-600 to-orange-700',
      epic: 'from-purple-600 to-purple-700',
      legendary: 'from-yellow-600 to-yellow-700'
    };
    return colors[rarity] || 'from-gray-600 to-gray-700';
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'troop': return '⚔️';
      case 'spell': return '✨';
      case 'building': return '🏰';
      default: return '❓';
    }
  };

  const addToDeck = (cardId) => {
    if (selectedDeck.length < 8 && !selectedDeck.includes(cardId)) {
      setSelectedDeck([...selectedDeck, cardId]);
      setSaveSuccess(false);
    }
  };

  const removeFromDeck = (cardId) => {
    setSelectedDeck(selectedDeck.filter(id => id !== cardId));
    setSaveSuccess(false);
  };

  const saveDeck = async () => {
    if (selectedDeck.length !== 8) {
      alert('Deck must contain exactly 8 cards!');
      return;
    }

    setSaving(true);
    try {
      await apiService.saveDeck(deckName, selectedDeck);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save deck:', error);
      alert('Failed to save deck. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const averageElixir = selectedDeck.length > 0 
    ? (selectedDeck.reduce((sum, cardId) => sum + CARDS[cardId].elixir, 0) / selectedDeck.length).toFixed(1)
    : 0;

  const getCardLevel = (cardId) => {
    const userCard = userCards.find(c => c.cardId === cardId);
    return userCard?.level || 1;
  };

  const filteredCards = Object.values(CARDS).filter(card => {
    const typeMatch = filter === 'all' || card.type === filter;
    const rarityMatch = rarityFilter === 'all' || card.rarity === rarityFilter;
    return typeMatch && rarityMatch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate('/')}
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h2 className="text-4xl font-bold text-white">Deck Builder</h2>
          <div className="w-24"></div>
        </div>

        {/* Deck Name Input */}
        <div className="bg-purple-800 rounded-lg p-4 mb-6">
          <input
            type="text"
            value={deckName}
            onChange={(e) => setDeckName(e.target.value)}
            className="w-full px-4 py-2 rounded-lg bg-purple-700 text-white text-xl font-bold text-center border-2 border-purple-600 focus:border-purple-400 focus:outline-none"
            placeholder="Enter deck name..."
          />
        </div>

        {/* Current Deck */}
        <div className="bg-purple-800 rounded-lg p-6 mb-6 shadow-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <h3 className="text-2xl font-bold text-white">
                Your Deck ({selectedDeck.length}/8)
              </h3>
              {selectedDeck.length === 8 && (
                <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                  Complete ✓
                </span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <div className="text-white text-xl bg-purple-700 px-4 py-2 rounded-lg">
                <Zap className="inline w-6 h-6 text-yellow-400 mr-2" />
                Avg: {averageElixir}
              </div>
              <button
                onClick={saveDeck}
                disabled={selectedDeck.length !== 8 || saving}
                className={`font-bold py-2 px-6 rounded-lg flex items-center gap-2 transition-all ${
                  saveSuccess 
                    ? 'bg-green-600 text-white' 
                    : selectedDeck.length === 8 && !saving
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {saveSuccess ? (
                  <>
                    <Check className="w-5 h-5" />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    {saving ? 'Saving...' : 'Save Deck'}
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 min-h-[180px]">
            {selectedDeck.map((cardId, index) => {
              const card = CARDS[cardId];
              const level = getCardLevel(cardId);
              return (
                <div key={index} className="relative group">
                  <button
                    onClick={() => removeFromDeck(cardId)}
                    className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                  <div className={`bg-gradient-to-br ${getRarityColor(card.rarity)} rounded-lg p-4 shadow-lg transform transition-transform group-hover:scale-105`}>
                    <div className="text-center mb-3">
                      <div className="text-3xl mb-2">{getTypeIcon(card.type)}</div>
                      <div className="text-white font-bold text-sm">{card.name}</div>
                    </div>
                    <div className="flex justify-between items-center text-white text-sm">
                      <span className="bg-black bg-opacity-30 px-2 py-1 rounded">Lvl {level}</span>
                      <span className="flex items-center bg-purple-900 bg-opacity-50 px-2 py-1 rounded">
                        <Zap className="w-4 h-4 text-yellow-400 mr-1" />
                        {card.elixir}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
            {[...Array(8 - selectedDeck.length)].map((_, index) => (
              <div
                key={`empty-${index}`}
                className="bg-purple-700 bg-opacity-50 rounded-lg p-4 border-2 border-dashed border-purple-500 flex items-center justify-center"
              >
                <Plus className="w-8 h-8 text-purple-400" />
              </div>
            ))}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-purple-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-white font-bold">Filter:</span>
            <div className="flex gap-2">
              {['all', 'troop', 'spell', 'building'].map(type => (
                <button
                  key={type}
                  onClick={() => setFilter(type)}
                  className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                    filter === type
                      ? 'bg-blue-600 text-white'
                      : 'bg-purple-700 text-gray-300 hover:bg-purple-600'
                  }`}
                >
                  {type === 'all' ? 'All' : type.charAt(0).toUpperCase() + type.slice(1) + 's'}
                </button>
              ))}
            </div>
            <div className="h-6 w-px bg-purple-600"></div>
            <div className="flex gap-2">
              {['all', 'common', 'rare', 'epic', 'legendary'].map(rarity => (
                <button
                  key={rarity}
                  onClick={() => setRarityFilter(rarity)}
                  className={`px-4 py-2 rounded-lg font-bold transition-colors ${
                    rarityFilter === rarity
                      ? 'bg-blue-600 text-white'
                      : 'bg-purple-700 text-gray-300 hover:bg-purple-600'
                  }`}
                >
                  {rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Available Cards */}
        <div className="bg-purple-800 rounded-lg p-6 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-4">Available Cards</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {filteredCards.map(card => {
              const isSelected = selectedDeck.includes(card.id);
              const level = getCardLevel(card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => addToDeck(card.id)}
                  disabled={selectedDeck.length >= 8 || isSelected}
                  className={`rounded-lg p-3 transition-all transform ${
                    isSelected
                      ? 'opacity-40 cursor-not-allowed scale-95'
                      : selectedDeck.length >= 8
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:scale-105 hover:shadow-xl cursor-pointer'
                  } bg-gradient-to-br ${getRarityColor(card.rarity)}`}
                >
                  <div className="text-center mb-2">
                    <div className="text-3xl mb-2">{getTypeIcon(card.type)}</div>
                    <div className="text-white font-bold text-xs mb-1">{card.name}</div>
                  </div>
                  <div className="flex justify-between items-center text-white text-xs">
                    <span className="bg-black bg-opacity-30 px-2 py-0.5 rounded">Lvl {level}</span>
                    <span className="flex items-center bg-purple-900 bg-opacity-50 px-2 py-0.5 rounded">
                      <Zap className="w-3 h-3 text-yellow-400 mr-1" />
                      {card.elixir}
                    </span>
                  </div>
                  {isSelected && (
                    <div className="mt-2 text-center">
                      <span className="bg-green-600 text-white px-2 py-1 rounded text-xs font-bold">
                        In Deck ✓
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeckBuilder;