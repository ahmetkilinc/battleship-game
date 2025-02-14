import React from 'react';
import styled from 'styled-components';
import { GameState } from '../types/game';
import Board from './Board';

interface BattlePhaseProps {
  gameState: GameState;
  onCellClick: (x: number, y: number, isOpponentBoard: boolean) => void;
}

const BattleContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 40px;
`;

const BoardsContainer = styled.div`
  display: flex;
  gap: 60px;
  align-items: flex-start;
`;

const BoardSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const ScoreDisplay = styled.div`
  font-size: 18px;
  color: #2c3e50;
  margin-bottom: 10px;
`;

const TurnIndicator = styled.div<{ isCurrentTurn: boolean }>`
  padding: 8px 16px;
  background-color: ${({ isCurrentTurn }) => isCurrentTurn ? '#2ecc71' : '#e74c3c'};
  color: white;
  border-radius: 4px;
  margin-bottom: 20px;
`;

const BattlePhase: React.FC<BattlePhaseProps> = ({ gameState, onCellClick }) => {
  const isCurrentTurn = gameState.room?.currentTurn === gameState.currentPlayer?.id;

  return (
    <BattleContainer>
      <TurnIndicator isCurrentTurn={!!isCurrentTurn}>
        {isCurrentTurn ? 'Your Turn' : "Opponent's Turn"}
      </TurnIndicator>

      <BoardsContainer>
        <BoardSection>
          <h2>Your Board</h2>
          <ScoreDisplay>
            Score: {gameState.currentPlayer?.score || 0}
          </ScoreDisplay>
          <Board
            board={gameState.currentPlayer?.board || []}
            isOpponentBoard={false}
            onCellClick={() => {}} // Disable clicks on own board
          />
        </BoardSection>

        <BoardSection>
          <h2>Opponent's Board</h2>
          <ScoreDisplay>
            Score: {gameState.opponent?.score || 0}
          </ScoreDisplay>
          <Board
            board={gameState.opponent?.board || []}
            isOpponentBoard={true}
            onCellClick={(x, y) => onCellClick(x, y, true)}
          />
        </BoardSection>
      </BoardsContainer>
    </BattleContainer>
  );
};

export default BattlePhase; 