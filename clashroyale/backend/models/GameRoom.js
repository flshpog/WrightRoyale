// Game room model (in-memory, not stored in DB)
class GameRoom {
  constructor(roomCode, hostId, hostUsername) {
    this.roomCode = roomCode;
    this.hostId = hostId;
    this.hostUsername = hostUsername;
    this.guestId = null;
    this.guestUsername = null;
    this.status = 'waiting'; // waiting, ready, playing, finished
    this.createdAt = Date.now();
    this.gameState = null;
  }

  addGuest(guestId, guestUsername) {
    this.guestId = guestId;
    this.guestUsername = guestUsername;
    this.status = 'ready';
  }

  removePlayer(playerId) {
    if (this.hostId === playerId) {
      this.hostId = null;
    } else if (this.guestId === playerId) {
      this.guestId = null;
    }
    
    // If any player leaves, room becomes invalid
    if (!this.hostId || !this.guestId) {
      this.status = 'closed';
    }
  }

  isFull() {
    return this.hostId && this.guestId;
  }

  getPlayerNumber(playerId) {
    if (this.hostId === playerId) return 1;
    if (this.guestId === playerId) return 2;
    return null;
  }
}

module.exports = GameRoom;