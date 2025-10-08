import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Copy, Check, Users, Loader } from 'lucide-react';
import { socketService } from '../services/socketService';
import { apiService } from '../services/apiService';

const Lobby = ({ user }) => {
  const navigate = useNavigate();
  const { mode } = useParams(); // 'host' or 'join'
  const [roomCode, setRoomCode] = useState('');
  const [generatedRoomCode, setGeneratedRoomCode] = useState('');
  const [inputRoomCode, setInputRoomCode] = useState('');
  const [room, setRoom] = useState(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeDeck, setActiveDeck] = useState(null);

  useEffect(() => {
    loadActiveDeck();
    socketService.connect();

    // Set up socket listeners
    socketService.onRoomUpdated((data) => {
      setRoom(data.room);
      if (data.room.status === 'ready' && mode === 'host') {
        // Both players ready, can start game
      }
    });

    socketService.onGameStarted((data) => {
      navigate(`/battle/${roomCode || generatedRoomCode}`);
    });

    socketService.onPlayerDisconnected(() => {
      alert('Opponent disconnected');
      navigate('/');
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  const loadActiveDeck = async () => {
    try {
      const profile = await apiService.getProfile();
      const active = profile.decks?.find(d => d.isActive);
      if (!active || active.cards.length !== 8) {
        alert('Please create and select an active deck first!');
        navigate('/deck');
        return;
      }
      setActiveDeck(active);
    } catch (error) {
      console.error('Failed to load deck:', error);
      alert('Failed to load your deck. Please try again.');
      navigate('/');
    }
  };

  const createRoom = async () => {
    if (!activeDeck) {
      alert('Please select a deck first!');
      navigate('/deck');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await socketService.createRoom(user.id, user.username, activeDeck.cards);
      setGeneratedRoomCode(result.roomCode);
      setRoom(result.room);
    } catch (err) {
      setError('Failed to create room. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async () => {
    if (!inputRoomCode || inputRoomCode.length !== 6) {
      setError('Please enter a valid 6-character room code');
      return;
    }

    if (!activeDeck) {
      alert('Please select a deck first!');
      navigate('/deck');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await socketService.joinRoom(
        inputRoomCode.toUpperCase(),
        user.id,
        user.username,
        activeDeck.cards
      );
      setRoomCode(inputRoomCode.toUpperCase());
      setRoom(result.room);
    } catch (err) {
      setError(err.message || 'Failed to join room. Room may not exist or is full.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const startGame = () => {
    if (room && room.isFull()) {
      socketService.startGame(generatedRoomCode);
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(generatedRoomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (mode === 'host' && !generatedRoomCode && !loading) {
      createRoom();
    }
  }, [mode, activeDeck]);

  if (!activeDeck) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading deck...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-purple-900 to-blue-900 flex flex-col items-center justify-center p-4">
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
      >
        <ArrowLeft className="w-5 h-5" />
        Back
      </button>

      <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full shadow-2xl">
        {mode === 'host' ? (
          <>
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Host Battle</h2>
            
            {loading && !generatedRoomCode ? (
              <div className="text-center py-8">
                <Loader className="w-12 h-12 text-blue-400 animate-spin mx-auto mb-4" />
                <p className="text-gray-300">Creating room...</p>
              </div>
            ) : generatedRoomCode ? (
              <>
                <div className="bg-gray-700 rounded-lg p-6 mb-6">
                  <p className="text-white mb-4 text-center font-bold">Share this room code:</p>
                  <div className="bg-white rounded-lg p-4 flex items-center justify-between">
                    <span className="text-4xl font-bold text-gray-900">{generatedRoomCode}</span>
                    <button
                      onClick={copyRoomCode}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors ml-4"
                    >
                      {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
                    </button>
                  </div>
                </div>

                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <div className="flex items-center justify-center gap-3 text-white">
                    <Users className="w-6 h-6 text-blue-400" />
                    <span className="font-bold">
                      {room?.guestId ? 'Opponent Joined!' : 'Waiting for opponent...'}
                    </span>
                  </div>
                  {room?.guestId && (
                    <p className="text-center text-green-400 mt-2">
                      {room.guestUsername} has joined
                    </p>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    onClick={startGame}
                    disabled={!room?.isFull()}
                    className={`w-full font-bold py-3 px-6 rounded-lg transition-colors ${
                      room?.isFull()
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {room?.isFull() ? 'Start Battle!' : 'Waiting for Player 2...'}
                  </button>
                  
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
              </>
            ) : null}
          </>
        ) : (
          <>
            <h2 className="text-3xl font-bold text-white mb-6 text-center">Join Battle</h2>
            
            {error && (
              <div className="bg-red-600 text-white p-3 rounded-lg mb-4 text-center">
                {error}
              </div>
            )}

            {!room ? (
              <>
                <div className="mb-6">
                  <label className="block text-white mb-2 font-bold">Enter Room Code:</label>
                  <input
                    type="text"
                    value={inputRoomCode}
                    onChange={(e) => setInputRoomCode(e.target.value.toUpperCase())}
                    placeholder="AB12CD"
                    maxLength={6}
                    className="w-full px-4 py-3 rounded-lg text-2xl text-center font-bold uppercase bg-gray-700 text-white border-2 border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-3">
                  <button
                    onClick={joinRoom}
                    disabled={loading || inputRoomCode.length !== 6}
                    className={`w-full font-bold py-3 px-6 rounded-lg transition-colors ${
                      loading || inputRoomCode.length !== 6
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader className="w-5 h-5 animate-spin" />
                        Joining...
                      </span>
                    ) : (
                      'Join Battle'
                    )}
                  </button>
                  
                  <button
                    onClick={() => navigate('/')}
                    className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg"
                  >
                    Back
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="bg-green-600 text-white p-4 rounded-lg mb-6 text-center font-bold">
                  Successfully joined room!
                </div>
                <div className="bg-gray-700 rounded-lg p-4 mb-6">
                  <p className="text-white text-center">
                    <span className="font-bold">{room.hostUsername}</span> is hosting
                  </p>
                </div>
                <div className="text-center text-gray-300">
                  <Loader className="w-8 h-8 animate-spin mx-auto mb-3" />
                  <p>Waiting for host to start the battle...</p>
                </div>
              </>
            )}
          </>
        )}

        {/* Deck Info */}
        {activeDeck && (
          <div className="mt-6 pt-6 border-t border-gray-700">
            <p className="text-gray-400 text-sm text-center mb-2">Your Active Deck:</p>
            <p className="text-white font-bold text-center">{activeDeck.name}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;