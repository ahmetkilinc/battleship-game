import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import styled from 'styled-components';
import { Cell, GameState, Ship, Room, Player, GamePhase, Country, Message } from '../types/game';
import Board from './Board';
import ShipPlacement from './ShipPlacement';
import BattlePhase from './BattlePhase';
import WaitingRoom from './WaitingRoom';
import Chat from './Chat';

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #f0f8ff;
  min-height: 100vh;
  position: relative;
`;

const BoardsContainer = styled.div`
  display: flex;
  gap: 40px;
  margin-top: 20px;
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const GameInfo = styled.div`
  margin-bottom: 20px;
  text-align: center;
  font-size: 1.2rem;
  color: #333;
`;

const Button = styled.button`
  padding: 10px 20px;
  font-size: 1rem;
  background-color: #4CAF50;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  margin: 10px;
  &:hover {
    background-color: #45a049;
  }
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
  }
`;

const StatusMessage = styled.div`
  margin: 20px 0;
  padding: 10px 20px;
  background-color: #2ecc71;
  color: white;
  border-radius: 4px;
  text-align: center;

  &.warning {
    background-color: #f1c40f;
  }
`;

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
  score: 0
});

const initialShips: Ship[] = [
  { length: 5, placed: false },
  { length: 4, placed: false },
  { length: 3, placed: false },
  { length: 3, placed: false },
  { length: 2, placed: false },
];

const Game: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState>({
    room: null,
    currentPlayer: null,
    opponent: null,
  });

  const [ships] = useState<Ship[]>(initialShips);

  useEffect(() => {
    const newSocket = io("http://192.168.1.209:3001", {
      transports: ["websocket", "polling"],
    });
    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  useEffect(() => {
    if (!socket) return;

    socket.on('gameCreated', (roomId: string) => {
      if (!socket.id) return;

      const newRoom: Room = {
        id: roomId,
        phase: 'WAITING_FOR_PLAYERS',
        players: [createPlayer(socket.id, `Player ${socket.id}`)],
        currentTurn: null,
        winner: null
      };

      setGameState(prev => ({
        ...prev,
        room: newRoom,
        currentPlayer: newRoom.players[0]
      }));
    });

    socket.on('playerJoined', ({ players, phase, roomId }) => {
      console.log('Player joined event received:', { 
        players, 
        phase,
        roomId,
        currentSocketId: socket.id,
        isFirstPlayer: players[0].id === socket.id 
      });
      setGameState(prev => {
        const socketId = socket.id;
        if (!socketId) return prev;

        const isFirstPlayer = players[0].id === socketId;
        const currentPlayer = isFirstPlayer ? players[0] : players[1];
        const opponent = isFirstPlayer ? players[1] : players[0];
        
        // If we don't have a room yet (joining player), create one
        if (!prev.room) {
          const newRoom: Room = {
            id: roomId,
            phase: phase,
            players: players,
            currentTurn: null,
            winner: null
          };
          
          const newState = {
            ...prev,
            room: newRoom,
            currentPlayer,
            opponent
          };
          
          console.log('Created new state for joining player:', newState);
          return newState;
        }
        
        // Existing room case
        const newState = {
          ...prev,
          room: {
            ...prev.room,
            players,
            phase: phase || prev.room.phase,
          },
          currentPlayer,
          opponent
        };
        
        console.log('Updated game state for existing room:', newState);
        return newState;
      });
    });

    socket.on('gameStarted', (data: { players: Player[], phase: GamePhase }) => {
      console.log('Game started event received', data);
      setGameState(prev => {
        if (!prev.room || !socket.id) return prev;

        const socketId = socket.id;
        const isFirstPlayer = data.players[0].id === socketId;
        
        return {
          ...prev,
          room: {
            ...prev.room,
            players: data.players,
            phase: data.phase,
          },
          currentPlayer: isFirstPlayer ? data.players[0] : data.players[1],
          opponent: isFirstPlayer ? data.players[1] : data.players[0],
        };
      });
    });

    socket.on('playerReady', ({ playerId }) => {
      console.log('Player ready event received:', playerId);
      setGameState(prev => {
        if (!prev.room || !prev.currentPlayer || !prev.opponent) return prev;

        if (playerId === prev.currentPlayer.id) {
          return {
            ...prev,
            currentPlayer: {
              ...prev.currentPlayer,
              ready: true
            }
          };
        } else {
          return {
            ...prev,
            opponent: {
              ...prev.opponent,
              ready: true
            }
          };
        }
      });
    });

    socket.on('battleStarted', ({ currentTurn, players }) => {
      console.log('Battle started event received:', { currentTurn, players });
      setGameState(prev => {
        if (!prev.room || !socket.id) {
          console.log('No room or socket id found');
          return prev;
        }

        const isFirstPlayer = players[0].id === socket.id;
        console.log('Updating game state for battle:', {
          currentSocketId: socket.id,
          isFirstPlayer,
          currentTurn,
          isMyTurn: currentTurn === socket.id
        });

        return {
          ...prev,
          room: {
            ...prev.room,
            phase: 'BATTLE',
            currentTurn,
            players
          }
        };
      });
    });

    socket.on('moveResult', (data: { x: number; y: number; isHit: boolean; player: string }) => {
      console.log('Move result event received:', data);
      setGameState(prev => {
        if (!prev.room || !prev.currentPlayer || !prev.opponent || !socket.id) return prev;

        const newState = { ...prev };
        const isPlayerMove = socket.id === data.player;
        
        if (isPlayerMove && newState.opponent && newState.currentPlayer) {
          newState.opponent.board[data.y][data.x].status = data.isHit ? 'hit' : 'miss';
          if (data.isHit) {
            newState.currentPlayer.score += 1;
          }
        } else if (newState.currentPlayer && newState.opponent) {
          newState.currentPlayer.board[data.y][data.x].status = data.isHit ? 'hit' : 'miss';
          if (data.isHit) {
            newState.opponent.score += 1;
          }
        }

        // Update current turn
        if (newState.room && newState.currentPlayer && newState.opponent) {
          if (data.isHit) {
            // If hit, keep the same player's turn
            newState.room.currentTurn = data.player;
          } else {
            // If miss, switch to the other player's turn
            newState.room.currentTurn = data.player === newState.currentPlayer.id 
              ? newState.opponent.id 
              : newState.currentPlayer.id;
          }
          console.log('Turn updated:', {
            isHit: data.isHit,
            previousTurn: prev.room.currentTurn,
            newTurn: newState.room.currentTurn,
            myId: socket.id,
            isMyTurn: newState.room.currentTurn === socket.id
          });
        }
        
        return newState;
      });
    });

    socket.on('playerDisconnected', () => {
      if (!socket.id) return;

      setGameState(prev => {
        if (!prev.room) return prev;
        
        return {
          ...prev,
          room: {
            ...prev.room,
            phase: 'GAME_OVER',
            winner: socket.id === 'host' ? 'player' : 'host'
          },
        };
      });
    });

    socket.on('countrySelected', ({ playerId, country }: { playerId: string, country: Country }) => {
      console.log('Country selected event received:', { playerId, country });
      setGameState(prev => {
        if (!prev.room) return prev;

        const updatedPlayers = prev.room.players.map(player => 
          player.id === playerId ? { ...player, country } : player
        ) as Player[];

        const updatedRoom: Room = {
          ...prev.room,
          players: updatedPlayers
        };

        const updatedCurrentPlayer = prev.currentPlayer?.id === playerId 
          ? { ...prev.currentPlayer, country }
          : prev.currentPlayer;

        const updatedOpponent = prev.opponent?.id === playerId
          ? { ...prev.opponent, country }
          : prev.opponent;

        return {
          ...prev,
          room: updatedRoom,
          currentPlayer: updatedCurrentPlayer,
          opponent: updatedOpponent
        };
      });
    });

    socket.on('newMessage', (message: Message) => {
      console.log('New message received:', message);
      setGameState(prev => {
        if (!prev.room) return prev;
        
        const messages = prev.room.messages || [];
        return {
          ...prev,
          room: {
            ...prev.room,
            messages: [...messages, message]
          }
        };
      });
    });

    socket.on('messageHistory', (messages: Message[]) => {
      console.log('Message history received:', messages);
      setGameState(prev => {
        if (!prev.room) return prev;
        
        return {
          ...prev,
          room: {
            ...prev.room,
            messages
          }
        };
      });
    });

    return () => {
      socket.off('gameCreated');
      socket.off('playerJoined');
      socket.off('gameStarted');
      socket.off('playerReady');
      socket.off('battleStarted');
      socket.off('moveResult');
      socket.off('playerDisconnected');
      socket.off('countrySelected');
      socket.off('newMessage');
      socket.off('messageHistory');
    };
  }, [socket, gameState.room]);

  const createGame = () => {
    if (socket) {
      socket.emit('createGame');
    }
  };

  const joinGame = (roomId: string) => {
    if (!socket?.id) return;

    const socketId = socket.id;
    socket.emit('joinGame', roomId);
  };

  const handleCellClick = (x: number, y: number, isOpponentBoard: boolean) => {
    console.log('Cell clicked:', { x, y, isOpponentBoard });
    
    if (!gameState.room || !gameState.currentPlayer || !gameState.opponent) {
      console.log('Game state not ready:', { 
        hasRoom: !!gameState.room, 
        hasCurrentPlayer: !!gameState.currentPlayer, 
        hasOpponent: !!gameState.opponent 
      });
      return;
    }

    if (!isOpponentBoard) {
      console.log('Clicked on own board, ignoring');
      return;
    }

    if (gameState.room.phase !== 'BATTLE') {
      console.log('Not in battle phase:', gameState.room.phase);
      return;
    }

    if (gameState.room.currentTurn !== gameState.currentPlayer.id) {
      console.log('Not your turn:', { 
        currentTurn: gameState.room.currentTurn, 
        playerId: gameState.currentPlayer.id 
      });
      return;
    }

    console.log('Making move:', { 
      roomId: gameState.room.id, 
      x, 
      y,
      currentTurn: gameState.room.currentTurn,
      playerId: gameState.currentPlayer.id
    });

    if (socket) {
      socket.emit('makeMove', { 
        roomId: gameState.room.id, 
        x, 
        y 
      });
    } else {
      console.log('Socket not connected');
    }
  };

  const handleShipPlacementComplete = (board: Cell[][]) => {
    if (!gameState.room?.id || !socket) return;

    console.log('Sending ship placement:', board);

    socket.emit('placeShips', {
      roomId: gameState.room.id,
      board: board
    });

    setGameState(prev => {
      if (!prev.currentPlayer || !prev.opponent || !prev.room) return prev;

      return {
        ...prev,
        currentPlayer: {
          ...prev.currentPlayer,
          board,
          ready: true,
        },
        opponent: {
          ...prev.opponent,
          ready: false,
        },
      };
    });
  };

  const handleStartGame = (roomId: string) => {
    if (socket) {
      socket.emit('startGame', roomId);
    }
  };

  const handleCountrySelect = (country: Country) => {
    if (!socket || !gameState.room) return;
    
    socket.emit('selectCountry', {
      roomId: gameState.room.id,
      country
    });
  };

  const renderPhase = () => {
    if (!gameState.room) {
      return <WaitingRoom 
        onJoinRoom={joinGame}
        onCreateRoom={createGame}
      />;
    }

    switch (gameState.room.phase) {
      case 'WAITING_FOR_PLAYERS':
        return (
          <>
            <StatusMessage>
              Waiting for players to join... Room ID: {gameState.room.id}
            </StatusMessage>
            <WaitingRoom 
              roomId={gameState.room.id}
              players={gameState.room.players}
              onStartGame={handleStartGame}
              onSelectCountry={handleCountrySelect}
            />
          </>
        );

      case 'SHIP_PLACEMENT':
        const opponentReady = gameState.opponent?.ready;
        const currentPlayerReady = gameState.currentPlayer?.ready;

        return (
          <>
            {opponentReady && !currentPlayerReady && (
              <StatusMessage className="warning">
                Opponent has finished placing their ships. Waiting for you...
              </StatusMessage>
            )}
            {!opponentReady && currentPlayerReady && (
              <StatusMessage>
                Waiting for opponent to finish placing their ships...
              </StatusMessage>
            )}
            <ShipPlacement
              ships={ships}
              onComplete={handleShipPlacementComplete}
              disabled={currentPlayerReady}
              country={gameState.currentPlayer?.country}
            />
          </>
        );

      case 'BATTLE':
        return (
          <BattlePhase
            gameState={gameState}
            onCellClick={handleCellClick}
          />
        );

      case 'GAME_OVER':
        return (
          <div>
            <StatusMessage>
              Game Over! {gameState.room.winner === gameState.currentPlayer?.id 
                ? 'You won!' 
                : 'Opponent won!'}
            </StatusMessage>
            {/* TODO: Add replay button */}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <GameContainer>
      <h1>Battleship Game</h1>
      {renderPhase()}
      {gameState.room && socket && (
        <Chat 
          socket={socket} 
          room={gameState.room} 
          isCurrentPlayer={!!gameState.currentPlayer}
        />
      )}
    </GameContainer>
  );
};

export default Game; 