import React, { useState } from 'react';
import styled from 'styled-components';
import { Player, Country } from '../types/game';
import CountrySelector from './CountrySelector';

interface WaitingRoomProps {
  roomId?: string;
  players?: Player[];
  onJoinRoom?: (roomId: string) => void;
  onCreateRoom?: () => void;
  onStartGame?: (roomId: string) => void;
  onSelectCountry?: (country: Country) => void;
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 20px;
`;

const Input = styled.input`
  padding: 8px 16px;
  border: 1px solid #3498db;
  border-radius: 4px;
  font-size: 16px;
  width: 200px;
  margin-right: 10px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 16px;

  &:hover {
    background-color: #27ae60;
  }
`;

const PlayerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 20px;
  width: 100%;
  max-width: 400px;
`;

const PlayerItem = styled.div`
  display: flex;
  align-items: center;
  padding: 12px;
  background-color: #3498db;
  color: white;
  border-radius: 4px;
  gap: 12px;
`;

const PlayerFlag = styled.img`
  width: 30px;
  height: 20px;
  object-fit: cover;
  border-radius: 2px;
`;

const PlayerInfo = styled.div`
  flex: 1;
`;

const StartGameButton = styled(Button)`
  background-color: #e74c3c;
  margin-top: 20px;

  &:hover {
    background-color: #c0392b;
  }
`;

const WaitingRoom: React.FC<WaitingRoomProps> = ({ 
  roomId, 
  players, 
  onJoinRoom, 
  onCreateRoom,
  onStartGame,
  onSelectCountry
}) => {
  const [joinRoomId, setJoinRoomId] = useState('');

  const handleJoinRoom = () => {
    if (onJoinRoom && joinRoomId) {
      onJoinRoom(joinRoomId);
    }
  };

  const handleCountrySelect = (country: Country) => {
    if (onSelectCountry) {
      onSelectCountry(country);
    }
  };

  if (roomId) {
    const currentPlayerId = players?.find(p => !p.country)?.id;
    const showCountrySelector = players && players.length > 0 && currentPlayerId;
    const allPlayersHaveCountries = players?.every(p => p.country);
    const bothPlayersJoined = players?.length === 2;

    return (
      <Container>
        <h2>Room: {roomId}</h2>
        <PlayerList>
          {players?.map((player, index) => (
            <PlayerItem key={player.id}>
              {player.country && (
                <PlayerFlag 
                  src={player.country.flag} 
                  alt={`${player.country.name} flag`} 
                />
              )}
              <PlayerInfo>
                {player.country ? `${player.country.name} Fleet` : `Player ${index + 1} (Selecting Country...)`}
              </PlayerInfo>
            </PlayerItem>
          ))}
        </PlayerList>
        {showCountrySelector && (
          <>
            <h3>Select Your Country</h3>
            <CountrySelector onSelect={handleCountrySelect} />
          </>
        )}
        {bothPlayersJoined && allPlayersHaveCountries && onStartGame && (
          <StartGameButton onClick={() => onStartGame(roomId)}>
            Start Game
          </StartGameButton>
        )}
      </Container>
    );
  }

  return (
    <Container>
      <h2>Welcome to Battleship</h2>
      <Button onClick={onCreateRoom}>Create New Game</Button>
      <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
        <Input
          type="text"
          placeholder="Enter Room ID"
          value={joinRoomId}
          onChange={(e) => setJoinRoomId(e.target.value)}
        />
        <Button onClick={handleJoinRoom}>Join Game</Button>
      </div>
    </Container>
  );
};

export default WaitingRoom; 