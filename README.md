# Battleship Game

A multiplayer battleship game with country selection feature, built with React and Socket.IO.

## Features

- Real-time multiplayer gameplay
- Country selection with flags
- Ship placement
- Turn-based battle system
- Live game state updates

## Tech Stack

- Frontend:
  - React
  - TypeScript
  - Styled Components
  - Socket.IO Client

- Backend:
  - Node.js
  - Express
  - Socket.IO
  - TypeScript

## Installation

1. Clone the repository:
```bash
git clone https://github.com/ahmetkilinc/battleship-game.git
cd battleship-game
```

2. Install dependencies for both client and server:
```bash
# Install client dependencies
cd client
npm install

# Install server dependencies
cd ../server
npm install
```

3. Start the development servers:

For the server:
```bash
cd server
npm start
```

For the client:
```bash
cd client
npm start
```

## How to Play

1. First player creates a game room
2. Second player joins using the room ID
3. Both players select their countries
4. Players place their ships on the board
5. Battle begins with players taking turns to attack
6. First player to sink all opponent's ships wins

## License

MIT 