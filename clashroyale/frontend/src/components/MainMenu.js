import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Swords, Trophy, LogOut, Crown } from 'lucide-react';

const MainMenu = ({ user, onLogout }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 flex flex-col items-center justify-center p-4">
      <div className="absolute top-4 right-4">
        <button
          onClick={onLogout}
          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>

      <div className="text-center mb-12">
        <Crown className="w-24 h-24 text-yellow-400 mx-auto mb-4 animate-pulse" />
        <h1 className="text-6xl font-bold text-white mb-2">Clash Arena</h1>
        <p className="text-blue-200 text-xl">Welcome, {user.username}!</p>
        <div className="mt-4 flex items-center justify-center gap-6 text-white">
          <div>
            <Trophy className="w-6 h-6 inline mr-2 text-yellow-400" />
            <span className="font-bold">{user.trophies || 0}</span>
          </div>
          <div>
            <span className="text-green-400 font-bold">Level {user.level || 1}</span>
          </div>
        </div>
      </div>
      
      <div className="space-y-4 w-full max-w-md">
        <button
          onClick={() => navigate('/lobby/host')}
          className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg"
        >
          <Play className="w-6 h-6" />
          Host Battle
        </button>
        
        <button
          onClick={() => navigate('/lobby/join')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg"
        >
          <Users className="w-6 h-6" />
          Join Battle
        </button>
        
        <button
          onClick={() => navigate('/deck')}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg"
        >
          <Swords className="w-6 h-6" />
          Deck Builder
        </button>
        
        <button
          onClick={() => navigate('/profile')}
          className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 px-6 rounded-lg flex items-center justify-center gap-3 transition-all transform hover:scale-105 shadow-lg"
        >
          <Trophy className="w-6 h-6" />
          Profile & Stats
        </button>
      </div>
    </div>
  );
};

export default MainMenu;