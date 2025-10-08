import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

class APIService {
  constructor() {
    this.axios = axios.create({
      baseURL: API_URL,
    });
  }

  setAuthToken(token) {
    if (token) {
      this.axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.axios.defaults.headers.common['Authorization'];
    }
  }

  // Authentication
  async register(data) {
    const response = await this.axios.post('/auth/register', data);
    return response.data;
  }

  async login(data) {
    const response = await this.axios.post('/auth/login', data);
    return response.data;
  }

  async guestLogin() {
    const response = await this.axios.post('/auth/guest');
    return response.data;
  }

  // User management
  async getProfile() {
    const response = await this.axios.get('/user/profile');
    return response.data;
  }

  async saveDeck(name, cards) {
    const response = await this.axios.post('/user/deck', { name, cards });
    return response.data;
  }

  async activateDeck(deckName) {
    const response = await this.axios.post('/user/deck/activate', { deckName });
    return response.data;
  }

  async upgradeCard(cardId) {
    const response = await this.axios.post('/user/cards/upgrade', { cardId });
    return response.data;
  }

  async getLeaderboard() {
    const response = await this.axios.get('/user/leaderboard');
    return response.data;
  }
}

export const apiService = new APIService();