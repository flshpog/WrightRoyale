import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Crown, Zap, X, AlertCircle } from 'lucide-react';
import { socketService } from '../services/socketService';
import CARDS from '../../../shared/cards/cardData';

const BattleArena = ({ user }) => {
  const navigate = useNavigate();
  const { roomCode } = useParams();
  const canvasRef = useRef(null);
  
  const [gameState, setGameState] = useState(null);
  const [playerNumber, setPlayerNumber] = useState(null);
  const [selectedCard, setSelectedCard] = useState(null);
  const [elixir, setElixir] = useState(5);
  const [hand, setHand] = useState([]);
  const [gameFinished, setGameFinished] = useState(false);
  const [gameResult, setGameResult] = useState(null);
  const [deployMode, setDeployMode] = useState(false);

  useEffect(() => {
    // Set up socket listeners
    socketService.onGameStateUpdate((data) => {
      setGameState(data.gameState);
      updatePlayerState(data.gameState);
    });

    socketService.onGameFinished((result) => {
      setGameFinished(true);
      setGameResult(result);
    });

    socketService.onPlayerDisconnected(() => {
      alert('Opponent disconnected. Returning to menu.');
      navigate('/');
    });

    return () => {
      socketService.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    if (gameState && canvasRef.current) {
      drawBattlefield();
    }
  }, [gameState, selectedCard]);

  const updatePlayerState = (state) => {
    // Determine which player we are
    const pNum = state.players[1].id === user.id ? 1 : 2;
    setPlayerNumber(pNum);
    
    const player = state.players[pNum];
    setElixir(player.elixir);
    setHand(player.hand);
  };

  const drawBattlefield = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Clear canvas
    ctx.fillStyle = '#4a5568';
    ctx.fillRect(0, 0, width, height);

    // Draw bridge
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(0, height / 2 - 30, width, 60);

    // Draw river
    ctx.fillStyle = '#4299e1';
    ctx.fillRect(0, height / 2 - 15, width, 30);

    // Draw grid (optional - helps with placement)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Draw towers
    if (gameState && gameState.towers) {
      drawTowers(ctx, gameState.towers);
    }

    // Draw troops
    if (gameState && gameState.troops) {
      gameState.troops.forEach(troop => drawTroop(ctx, troop));
    }

    // Draw buildings
    if (gameState && gameState.buildings) {
      gameState.buildings.forEach(building => drawBuilding(ctx, building));
    }

    // Draw spells
    if (gameState && gameState.spells) {
      gameState.spells.forEach(spell => drawSpell(ctx, spell));
    }

    // Draw placement indicator
    if (deployMode && selectedCard) {
      drawPlacementZone(ctx);
    }
  };

  const drawTowers = (ctx, towers) => {
    for (const playerId in towers) {
      towers[playerId].forEach(tower => {
        if (tower.hp <= 0) return;

        const color = playerId == playerNumber ? '#3b82f6' : '#ef4444';
        
        ctx.fillStyle = color;
        ctx.fillRect(tower.position.x - 20, tower.position.y - 30, 40, 40);
        
        // Crown
        ctx.fillStyle = '#fbbf24';
        ctx.fillRect(tower.position.x - 15, tower.position.y - 35, 30, 10);
        
        // HP bar
        const hpPercent = tower.hp / tower.maxHp;
        ctx.fillStyle = 'rgba(0,