import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import MainMenu from './components/MainMenu';
import DeckBuilder from './components/DeckBuilder';
import BattleArena from './components/BattleArena';
import Lobby from './components/Lobby';
import Profile from './components/Profile';
import Login from './components/Login';
import { socketService } from './services/socketService';
import { apiService } from './services/apiService';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth token
    const token = localStorage.getItem('authToken');
    if (token) {
      apiService.setAuthToken(token);
      loadUserProfile();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUserProfile = async () => {
    try {
      const userData = await apiService.getProfile();
      setUser(userData);
    } catch (error) {
      console.error('Failed to load profile:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (userData, token) => {
    localStorage.setItem('authToken', token);
    apiService.setAuthToken(token);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    apiService.setAuthToken(null);
    socketService.disconnect();
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-900 to-purple-900 flex items-center justify-center">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} 
        />
        <Route 
          path="/" 
          element={user ? <MainMenu user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/deck" 
          element={user ? <DeckBuilder user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/lobby/:mode" 
          element={user ? <Lobby user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/battle/:roomCode" 
          element={user ? <BattleArena user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/profile" 
          element={user ? <Profile user={user} /> : <Navigate to="/login" />} 
        />
      </Routes>
    </Router>
  );
}

export default App;