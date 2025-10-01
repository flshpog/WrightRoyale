import React, { useState, useEffect, useRef } from 'react';
import { Swords, Users, Trophy, Settings, Play, Plus, X, Crown, Zap } from 'lucide-react';

// This is a demonstration UI. The full codebase structure is provided below.
// In production, this would be split across multiple files and folders.

const ClashRoyaleDemo = () => {
  const [currentScreen, setCurrentScreen] = useState('menu');
  const [selectedDeck, setSelectedDeck] = useState([]);
  const [availableCards, setAvailableCards] = useState([
    { id: 1, name: 'Knight', elixir: 3, type: 'troop', level: 5, rarity: 'common' },
    { id: 2, name: 'Archers', elixir: 3, type: 'troop', level: 4, rarity: 'common' },
    { id: 3, name: 'Giant', elixir: 5, type: 'troop', level: 3, rarity: 'rare' },
    { id: 4, name: 'Fireball', elixir: 4, type: 'spell', level: 4, rarity: 'rare' },
    { id: 5, name: 'Mini P.E.K.K.A', elixir: 4, type: 'troop', level: 3, rarity: 'rare' },
    { id: 6, name: 'Musketeer', elixir: 4, type: 'troop', level: 4, rarity: 'rare' },
    { id: 7, name: 'Baby Dragon', elixir: 4, type: 'troop', level: 2, rarity: 'epic' },
    { id: 8, name: 'Prince', elixir: 5, type: 'troop', level: 2, rarity: 'epic' },
    { id: 9, name: 'Skeleton Army', elixir: 3, type: 'troop', level: 3, rarity: 'epic' },
    { id: 10, name: 'Hog Rider', elixir: 4, type: 'troop', level: 3, rarity: 'rare' },
    { id: 11, name: 'Cannon', elixir: 3, type: 'building', level: 5, rarity: 'common' },
    { id: 12, name: 'Goblin Barrel', elixir: 3, type: 'spell', level: 3, rarity: 'epic' },
  ]);
  const [roomCode, setRoomCode] = useState('');
  const [elixir, setElixir] = useState(5);
  const [hand, setHand] = useState([]);
  const [playerTowers, setPlayerTowers] = useState({ left: 100, right: 100, king: 100 });
  const [opponentTowers, setOpponentTowers] = useState({ left: 100, right: 100, king: 100 });

  useEffect(() => {
    if (currentScreen === 'battle' && hand.length === 0) {
      // Initialize hand with first 4 cards from deck
      setHand(selectedDeck.slice(0, 4));
      
      // Simulate elixir regeneration
      const interval = setInterval(() => {
        setElixir(prev => Math.min(prev + 1, 10));
      }, 2800);
      
      return () => clearInterval(interval);
    }
  }, [currentScreen, selectedDeck, hand.length]);

  const getRarityColor = (rarity) => {
    const colors = {
      common: 'bg-gray-500',
      rare: 'bg-orange-500',
      epic: 'bg-purple-500',
      legendary: 'bg-yellow-500'
    };
    return colors[rarity] || 'bg-gray-500';
  };

  const addToDeck = (card) => {
    if (selectedDeck.length < 8 && !selectedDeck.find(c => c.id === card.id)) {
      setSelectedDeck([...selectedDeck, card]);
    }
  };

  const removeFromDeck = (cardId) => {
    setSelectedDeck(selectedDeck.filter(c => c.id !== cardId));
  };

  const averageElixir = selectedDeck.length > 0 
    ? (selectedDeck.reduce((sum, card) => sum + card.elixir, 0) / selectedDeck.length).toFixed(1)
    : 0;

  const renderMainMenu = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-12">
        <Crown className="w-24 h-24 text-yellow-400 mx-auto mb-4" />
        <h1 className="text-6xl font-bold text-white mb-2">Clash Arena</h1>
        <p className="text-blue-200 text-xl">Multiplayer Battle Game</p>
      </div>
      
      <div className="space-y-4 w-full max-w-md">
        <button
          onClick={() => setCurrentScreen('host')}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all transform hover:scale-105"
        >
          <Play className="w-6 h-6" />
          Host Battle
        </button>
        
        <button
          onClick={() => setCurrentScreen('join')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all transform hover:scale-105"
        >
          <Users className="w-6 h-6" />
          Join Battle
        </button>
        
        <button
          onClick={() => setCurrentScreen('deck')}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all transform hover:scale-105"
        >
          <Swords className="w-6 h-6" />
          Deck Builder
        </button>
        
        <button
          onClick={() => setCurrentScreen('profile')}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all transform hover:scale-105"
        >
          <Trophy className="w-6 h-6" />
          Profile & Stats
        </button>
      </div>
    </div>
  );

  const renderDeckBuilder = () => (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-purple-800 to-purple-900 p-4">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-4xl font-bold text-white">Deck Builder</h2>
          <button
            onClick={() => setCurrentScreen('menu')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Back
          </button>
        </div>

        <div className="bg-purple-800 rounded-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-2xl font-bold text-white">Your Deck ({selectedDeck.length}/8)</h3>
            <div className="text-white text-xl">
              <Zap className="inline w-6 h-6 text-yellow-400 mr-2" />
              Avg: {averageElixir}
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4 min-h-[120px]">
            {selectedDeck.map(card => (
              <div key={card.id} className="bg-purple-700 rounded-lg p-3 relative group">
                <button
                  onClick={() => removeFromDeck(card.id)}
                  className="absolute -top-2 -right-2 bg-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
                <div className={`${getRarityColor(card.rarity)} rounded-lg p-4 mb-2`}>
                  <div className="text-white text-center text-sm font-bold">{card.name}</div>
                </div>
                <div className="flex justify-between items-center text-white text-sm">
                  <span>Lvl {card.level}</span>
                  <span className="flex items-center">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    {card.elixir}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-purple-800 rounded-lg p-6">
          <h3 className="text-2xl font-bold text-white mb-4">Available Cards</h3>
          <div className="grid grid-cols-4 gap-4">
            {availableCards.map(card => (
              <button
                key={card.id}
                onClick={() => addToDeck(card)}
                disabled={selectedDeck.length >= 8 || selectedDeck.find(c => c.id === card.id)}
                className={`bg-purple-700 rounded-lg p-3 hover:bg-purple-600 transition-colors ${
                  selectedDeck.find(c => c.id === card.id) ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <div className={`${getRarityColor(card.rarity)} rounded-lg p-4 mb-2`}>
                  <div className="text-white text-center text-sm font-bold">{card.name}</div>
                </div>
                <div className="flex justify-between items-center text-white text-sm">
                  <span>Lvl {card.level}</span>
                  <span className="flex items-center">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    {card.elixir}
                  </span>
                </div>
                <div className="text-xs text-purple-300 mt-1 capitalize">{card.type}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderHostLobby = () => (
    <div className="min-h-screen bg-gradient-to-b from-green-900 via-green-800 to-green-900 flex flex-col items-center justify-center p-4">
      <div className="bg-green-800 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Host Battle</h2>
        <div className="bg-green-700 rounded-lg p-6 mb-6">
          <p className="text-white mb-4 text-center">Your Room Code:</p>
          <div className="bg-white rounded-lg p-4 text-center">
            <span className="text-4xl font-bold text-green-900">AB12CD</span>
          </div>
        </div>
        <p className="text-green-200 text-center mb-6">Waiting for opponent to join...</p>
        <div className="space-y-3">
          <button
            onClick={() => {
              if (selectedDeck.length === 8) {
                setCurrentScreen('battle');
              } else {
                alert('Please build a deck of 8 cards first!');
                setCurrentScreen('deck');
              }
            }}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Start Battle (Demo)
          </button>
          <button
            onClick={() => setCurrentScreen('menu')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  const renderJoinLobby = () => (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 flex flex-col items-center justify-center p-4">
      <div className="bg-blue-800 rounded-lg p-8 max-w-md w-full">
        <h2 className="text-3xl font-bold text-white mb-6 text-center">Join Battle</h2>
        <div className="mb-6">
          <label className="block text-white mb-2">Enter Room Code:</label>
          <input
            type="text"
            value={roomCode}
            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
            placeholder="AB12CD"
            className="w-full px-4 py-3 rounded-lg text-2xl text-center font-bold uppercase"
            maxLength={6}
          />
        </div>
        <div className="space-y-3">
          <button
            onClick={() => {
              if (roomCode.length === 6 && selectedDeck.length === 8) {
                setCurrentScreen('battle');
              } else if (selectedDeck.length !== 8) {
                alert('Please build a deck of 8 cards first!');
                setCurrentScreen('deck');
              } else {
                alert('Please enter a valid room code!');
              }
            }}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Join Battle
          </button>
          <button
            onClick={() => setCurrentScreen('menu')}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg"
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );

  const renderBattle = () => (
    <div className="min-h-screen bg-gradient-to-b from-green-700 via-amber-600 to-red-700 relative overflow-hidden">
      {/* Opponent towers */}
      <div className="absolute top-4 left-0 right-0 flex justify-between px-8">
        <div className="bg-red-800 rounded-lg p-2 text-white text-sm">
          <div className="w-16 h-16 bg-red-600 rounded mb-1 flex items-center justify-center">
            <Crown className="w-8 h-8" />
          </div>
          <div className="text-center">{opponentTowers.left}%</div>
        </div>
        <div className="bg-red-900 rounded-lg p-2 text-white text-sm">
          <div className="w-20 h-20 bg-red-700 rounded mb-1 flex items-center justify-center">
            <Crown className="w-10 h-10" />
          </div>
          <div className="text-center font-bold">{opponentTowers.king}%</div>
        </div>
        <div className="bg-red-800 rounded-lg p-2 text-white text-sm">
          <div className="w-16 h-16 bg-red-600 rounded mb-1 flex items-center justify-center">
            <Crown className="w-8 h-8" />
          </div>
          <div className="text-center">{opponentTowers.right}%</div>
        </div>
      </div>

      {/* Battle arena */}
      <div className="h-screen flex items-center justify-center">
        <div className="text-white text-2xl font-bold bg-black bg-opacity-50 rounded-lg p-4">
          Battle Arena - Deploy Cards Below
        </div>
      </div>

      {/* Player towers */}
      <div className="absolute bottom-36 left-0 right-0 flex justify-between px-8">
        <div className="bg-blue-800 rounded-lg p-2 text-white text-sm">
          <div className="text-center mb-1">{playerTowers.left}%</div>
          <div className="w-16 h-16 bg-blue-600 rounded flex items-center justify-center">
            <Crown className="w-8 h-8" />
          </div>
        </div>
        <div className="bg-blue-900 rounded-lg p-2 text-white text-sm">
          <div className="text-center font-bold mb-1">{playerTowers.king}%</div>
          <div className="w-20 h-20 bg-blue-700 rounded flex items-center justify-center">
            <Crown className="w-10 h-10" />
          </div>
        </div>
        <div className="bg-blue-800 rounded-lg p-2 text-white text-sm">
          <div className="text-center mb-1">{playerTowers.right}%</div>
          <div className="w-16 h-16 bg-blue-600 rounded flex items-center justify-center">
            <Crown className="w-8 h-8" />
          </div>
        </div>
      </div>

      {/* Elixir and cards */}
      <div className="absolute bottom-0 left-0 right-0 bg-gray-900 bg-opacity-95 p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2 text-white">
            <Zap className="w-6 h-6 text-purple-400" />
            <span className="text-2xl font-bold">{elixir}/10</span>
          </div>
          <button
            onClick={() => setCurrentScreen('menu')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg text-sm"
          >
            Exit
          </button>
        </div>
        <div className="flex gap-3 justify-center">
          {hand.map((card, idx) => (
            <button
              key={idx}
              disabled={elixir < card.elixir}
              className={`${getRarityColor(card.rarity)} rounded-lg p-3 w-24 ${
                elixir < card.elixir ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'
              } transition-transform`}
            >
              <div className="text-white text-sm font-bold text-center mb-2">{card.name}</div>
              <div className="flex justify-center items-center text-white">
                <Zap className="w-4 h-4 text-yellow-400 mr-1" />
                {card.elixir}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const renderProfile = () => (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 via-orange-800 to-orange-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-4xl font-bold text-white">Profile & Stats</h2>
          <button
            onClick={() => setCurrentScreen('menu')}
            className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Back
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-orange-800 rounded-lg p-6">
            <h3 className="text-2xl font-bold text-white mb-4">Player Info</h3>
            <div className="space-y-3 text-white">
              <div className="flex justify-between">
                <span>Username:</span>
                <span className="font-bold">Player123</span>
              </div>
              <div className="flex justify-between">
                <span>Level:</span>
                <span className="font-bold">8</span>
              </div>
              <div className="flex justify-between">
                <span>Trophies:</span>
                <span className="font-bold text-yellow-400">2450</span>
              </div>
            </div>
          </div>

          <div className="bg-orange-800 rounded-lg p-6">
            <h3 className="text-2xl font-bold text-white mb-4">Battle Stats</h3>
            <div className="space-y-3 text-white">
              <div className="flex justify-between">
                <span>Wins:</span>
                <span className="font-bold text-green-400">145</span>
              </div>
              <div className="flex justify-between">
                <span>Losses:</span>
                <span className="font-bold text-red-400">98</span>
              </div>
              <div className="flex justify-between">
                <span>Win Rate:</span>
                <span className="font-bold">59.7%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="font-sans">
      {currentScreen === 'menu' && renderMainMenu()}
      {currentScreen === 'deck' && renderDeckBuilder()}
      {currentScreen === 'host' && renderHostLobby()}
      {currentScreen === 'join' && renderJoinLobby()}
      {currentScreen === 'battle' && renderBattle()}
      {currentScreen === 'profile' && renderProfile()}
    </div>
  );
};

export default ClashRoyaleDemo;