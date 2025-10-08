import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket && this.connected) return;

    this.socket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      transports: ['websocket'],
      autoConnect: true,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.connected = true;
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  // Room management
  createRoom(userId, username, deck) {
    return new Promise((resolve, reject) => {
      this.socket.emit('createRoom', { userId, username, deck });
      
      this.socket.once('roomCreated', (data) => resolve(data));
      this.socket.once('error', (error) => reject(error));
    });
  }

  joinRoom(roomCode, userId, username, deck) {
    return new Promise((resolve, reject) => {
      this.socket.emit('joinRoom', { roomCode, userId, username, deck });
      
      this.socket.once('roomUpdated', (data) => resolve(data));
      this.socket.once('error', (error) => reject(error));
    });
  }

  startGame(roomCode) {
    this.socket.emit('startGame', { roomCode });
  }

  deployCard(roomCode, cardId, position, level) {
    this.socket.emit('deployCard', { roomCode, cardId, position, level });
  }

  // Event listeners
  onRoomUpdated(callback) {
    this.socket.on('roomUpdated', callback);
  }

  onGameStarted(callback) {
    this.socket.on('gameStarted', callback);
  }

  onGameStateUpdate(callback) {
    this.socket.on('gameStateUpdate', callback);
  }

  onGameFinished(callback) {
    this.socket.on('gameFinished', callback);
  }

  onPlayerDisconnected(callback) {
    this.socket.on('playerDisconnected', callback);
  }

  // Clean up listeners
  removeAllListeners() {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }
}

export const socketService = new SocketService();