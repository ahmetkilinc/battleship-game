import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { Room, Player, GameState, Cell, GamePhase, Country, Message } from './types/game';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:3000", 
      "http://192.168.1.209:3000",
      "http://192.168.1.101:3000"
    ],
    methods: ["GET", "POST"]
  }
});

app.use(cors({
  origin: [
    "http://localhost:3000", 
    "http://192.168.1.209:3000",
    "http://192.168.1.101:3000"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));
app.use(express.json());

const createEmptyBoard = (): Cell[][] => 
  Array(10).fill(null).map((_, y) =>
    Array(10).fill(null).map((_, x) => ({
      x,
      y,
      status: 'empty'
    }))
  );

const createPlayer = (id: string, name: string): Player => ({
  id,
  name,
  ready: false,
  board: createEmptyBoard(),
  score: 0,
  country: undefined
});

const gameState: GameState = {
  rooms: new Map<string, Room>()
};

const updateGamePhase = (room: Room) => {
  console.log('Updating game phase:', { 
    currentPhase: room.phase, 
    players: room.players.map(p => ({ id: p.id, ready: p.ready })),
    currentTurn: room.currentTurn
  });
  
  // Check if we should move to SHIP_PLACEMENT phase
  if (room.phase === 'WAITING_FOR_PLAYERS' && room.players.length === 2) {
    console.log('Moving to SHIP_PLACEMENT phase');
    room.phase = 'SHIP_PLACEMENT';
    io.to(room.id).emit('gameStarted');
  }
  
  // Check if we should move to BATTLE phase
  if (room.phase === 'SHIP_PLACEMENT' && room.players.every(p => p.ready)) {
    console.log('Moving to BATTLE phase');
    room.phase = 'BATTLE';
    room.currentTurn = room.players[0].id;
    console.log('Battle starting with:', {
      firstPlayer: room.players[0].id,
      secondPlayer: room.players[1].id,
      currentTurn: room.currentTurn
    });
    io.to(room.id).emit('battleStarted', { 
      currentTurn: room.currentTurn,
      players: room.players
    });
  }

  // Check if someone won
  if (room.phase === 'BATTLE') {
    const winner = room.players.find(p => p.score >= 17);
    if (winner) {
      console.log('Game over, winner:', winner.id);
      room.phase = 'GAME_OVER';
      room.winner = winner.id;
      io.to(room.id).emit('gameOver', { winner: winner.id });
    }
  }
};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('createGame', () => {
    const roomId = Math.random().toString(36).substring(2, 8);
    const newPlayer = createPlayer(socket.id, `Player ${socket.id}`);
    const newRoom: Room = {
      id: roomId,
      phase: 'WAITING_FOR_PLAYERS',
      players: [newPlayer],
      currentTurn: null,
      winner: null,
      messages: []
    };
    
    gameState.rooms.set(roomId, newRoom);
    socket.join(roomId);
    socket.emit('gameCreated', roomId);
  });

  socket.on('joinGame', (roomId: string) => {
    const room = gameState.rooms.get(roomId);
    if (room && room.players.length < 2) {
      const newPlayer = createPlayer(socket.id, `Player ${socket.id}`);
      room.players.push(newPlayer);
      socket.join(roomId);
      io.to(roomId).emit('playerJoined', { 
        players: room.players,
        phase: room.phase,
        roomId: room.id
      });
    } else {
      socket.emit('error', { message: 'Room not found or full' });
    }
  });

  socket.on('startGame', (roomId: string) => {
    const room = gameState.rooms.get(roomId);
    if (room && room.players.length === 2) {
      console.log('Starting game for room:', roomId);
      room.phase = 'SHIP_PLACEMENT';
      io.to(roomId).emit('gameStarted', {
        players: room.players,
        phase: room.phase
      });
    }
  });

  socket.on('placeShips', (data: { roomId: string, board: Cell[][] }) => {
    console.log('Received ship placement:', {
      roomId: data.roomId,
      playerId: socket.id,
      board: data.board
    });

    const room = gameState.rooms.get(data.roomId);
    if (room && room.phase === 'SHIP_PLACEMENT') {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.board = data.board;
        player.ready = true;
        
        console.log('Player ready:', {
          playerId: socket.id,
          roomPhase: room.phase,
          allPlayersReady: room.players.every(p => p.ready)
        });

        io.to(room.id).emit('playerReady', { playerId: socket.id });
        updateGamePhase(room);
      }
    }
  });

  socket.on('makeMove', (data: { roomId: string, x: number, y: number }) => {
    console.log('Move received:', { ...data, playerId: socket.id });
    
    const room = gameState.rooms.get(data.roomId);
    if (!room) {
      console.log('Room not found:', data.roomId);
      return;
    }

    if (room.phase !== 'BATTLE') {
      console.log('Not in battle phase:', room.phase);
      return;
    }

    if (room.currentTurn !== socket.id) {
      console.log('Not player\'s turn:', { 
        currentTurn: room.currentTurn, 
        playerId: socket.id 
      });
      return;
    }

    const currentPlayer = room.players.find(p => p.id === socket.id);
    const opponent = room.players.find(p => p.id !== socket.id);

    if (!currentPlayer || !opponent) {
      console.log('Players not found:', { 
        currentPlayerId: socket.id,
        players: room.players.map(p => p.id)
      });
      return;
    }

    console.log('Processing move:', {
      currentPlayer: currentPlayer.id,
      opponent: opponent.id,
      targetCell: opponent.board[data.y][data.x],
      opponentBoard: opponent.board
    });

    const targetCell = opponent.board[data.y][data.x];
    if (targetCell.status === 'ship') {
      targetCell.status = 'hit';
      currentPlayer.score += 1;
      // Keep turn if hit
      room.currentTurn = socket.id; // Keep current player's turn
      io.to(room.id).emit('moveResult', {
        x: data.x,
        y: data.y,
        isHit: true,
        player: socket.id
      });
      console.log('Hit!', { 
        x: data.x, 
        y: data.y, 
        player: socket.id, 
        newScore: currentPlayer.score,
        nextTurn: room.currentTurn
      });
    } else if (targetCell.status === 'empty') {
      targetCell.status = 'miss';
      // Switch turn if miss
      room.currentTurn = opponent.id;
      io.to(room.id).emit('moveResult', {
        x: data.x,
        y: data.y,
        isHit: false,
        player: socket.id
      });
      console.log('Miss!', { 
        x: data.x, 
        y: data.y, 
        player: socket.id,
        nextTurn: room.currentTurn 
      });
    }

    console.log('Turn status after move:', {
      roomId: room.id,
      currentTurn: room.currentTurn,
      lastPlayer: socket.id,
      phase: room.phase
    });

    updateGamePhase(room);
  });

  socket.on('selectCountry', (data: { roomId: string, country: Country }) => {
    console.log('Country selection received:', { 
      playerId: socket.id,
      country: data.country 
    });

    const room = gameState.rooms.get(data.roomId);
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        player.country = data.country;
        io.to(room.id).emit('countrySelected', {
          playerId: socket.id,
          country: data.country
        });
      }
    }
  });

  socket.on('sendMessage', (data: { roomId: string, text: string }) => {
    console.log('Message received:', { 
      playerId: socket.id,
      text: data.text 
    });

    const room = gameState.rooms.get(data.roomId);
    if (room) {
      const player = room.players.find(p => p.id === socket.id);
      if (player) {
        const message: Message = {
          id: Math.random().toString(36).substring(2, 15),
          playerId: socket.id,
          playerName: player.country ? `${player.country.name} Fleet` : player.name,
          text: data.text,
          timestamp: Date.now()
        };
        
        room.messages.push(message);
        
        // Limit messages to last 100
        if (room.messages.length > 100) {
          room.messages = room.messages.slice(-100);
        }
        
        io.to(room.id).emit('newMessage', message);
      }
    }
  });

  socket.on('getMessages', (roomId: string) => {
    const room = gameState.rooms.get(roomId);
    if (room) {
      socket.emit('messageHistory', room.messages);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    // Clean up game rooms
    for (const [roomId, room] of gameState.rooms.entries()) {
      if (room.players.some(p => p.id === socket.id)) {
        io.to(roomId).emit('playerDisconnected');
        gameState.rooms.delete(roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 