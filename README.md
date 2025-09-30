# WrightRoyale
Real-time PVP strategy game.


Clash Royale Clone - Web Multiplayer Game
Project Overview
A web-based multiplayer battle arena game inspired by Clash Royale, featuring real-time PvP battles, card collection, and progression systems.
Tech Stack

Frontend: React + TailwindCSS + Three.js
Backend: Node.js + Express + Socket.IO
Database: MongoDB
Authentication: JWT tokens
Real-time: WebSocket (Socket.IO)

Project Structure
clash-royale-clone/
├── frontend/               # React client application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── scenes/        # Three.js game scenes
│   │   ├── services/      # API and socket services
│   │   ├── store/         # State management
│   │   └── utils/         # Utility functions
│   └── package.json
├── backend/                # Node.js server
│   ├── src/
│   │   ├── controllers/   # Route controllers
│   │   ├── models/        # Database models
│   │   ├── services/      # Business logic
│   │   ├── sockets/       # Socket.IO handlers
│   │   └── middleware/    # Express middleware
│   └── package.json
└── shared/                 # Shared game logic
    ├── constants/          # Game constants
    ├── cards/             # Card definitions
    └── mechanics/         # Game mechanics
Installation & Setup
Prerequisites

Node.js v16+
MongoDB (local or Atlas)
npm or yarn

Backend Setup
bashcd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
Frontend Setup
bashcd frontend
npm install
npm start
Shared Module Setup
bashcd shared
npm install
npm run build
Environment Variables
Backend (.env)
PORT=3001
MONGODB_URI=mongodb://localhost:27017/clash-royale
JWT_SECRET=your-secret-key
CLIENT_URL=http://localhost:3000
Frontend (.env)
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SOCKET_URL=http://localhost:3001
Running the Game

Start MongoDB (if local)
Start backend server: cd backend && npm run dev
Start frontend: cd frontend && npm start
Open http://localhost:3000

Game Features
Implemented

 User authentication (register/login)
 Real-time multiplayer battles
 Card deployment and elixir system
 Troop AI and pathfinding
 Tower targeting and damage
 Deck builder (8 cards)
 Card leveling system
 Win/loss tracking
 Lobby system with room codes

Card Types

Troops: Knight, Archer, Giant, etc.
Spells: Fireball, Arrows, Zap, etc.
Buildings: Cannon, Tesla, etc.

Game Mechanics

3-minute battles with 1-minute overtime
Elixir regeneration (2.8 seconds per elixir)
Lane-based deployment
Tower destruction wins

Development
Adding New Cards

Define card in shared/cards/definitions.js
Add card logic in shared/mechanics/cardBehaviors.js
Create 3D model/sprite in frontend/src/assets/models/
Update card registry in backend

Testing Multiplayer

Open two browser windows
Login with different accounts
One player creates a room
Second player joins with room code

Deployment
Backend (Heroku/Railway)
bashcd backend
git init
heroku create your-app-name
heroku addons:create mongolab
git push heroku main
Frontend (Vercel/Netlify)
bashcd frontend
npm run build
# Deploy build folder to hosting service
Architecture Decisions
Server Authority

Server maintains game state as source of truth
Client sends actions, server validates and broadcasts state
Prevents cheating and ensures synchronization

Real-time Sync

Socket.IO for bidirectional communication
State updates at 60 FPS on client, 30 FPS on server
Interpolation for smooth animations

Card Balance

Stats stored in shared module
Easy balancing through configuration files
Version control for card changes

Contributing

Fork the repository
Create feature branch
Commit changes
Push to branch
Open pull request

License
MIT License - Educational purposes only
