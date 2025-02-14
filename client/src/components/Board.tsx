import React from 'react';
import styled from 'styled-components';
import { Cell } from '../types/game';

interface BoardProps {
  board: Cell[][];
  isOpponentBoard: boolean;
  onCellClick: (x: number, y: number) => void;
}

const BoardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 40px);
  gap: 2px;
  background-color: #1e3d59;
  padding: 10px;
  border-radius: 8px;
`;

const getCellColor = (cell: Cell, isOpponentBoard: boolean) => {
  switch (cell.status) {
    case 'ship':
      return isOpponentBoard ? '#3498db' : '#2ecc71';
    case 'hit':
      return '#e74c3c';
    case 'miss':
      return '#95a5a6';
    default:
      return '#3498db';
  }
};

const BoardCell = styled.div<{ status: string; isOpponentBoard: boolean }>`
  width: 40px;
  height: 40px;
  background-color: ${({ status, isOpponentBoard }) => getCellColor({ status } as Cell, isOpponentBoard)};
  border: 1px solid #17263b;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;

  &:hover {
    opacity: 0.8;
  }
`;

const Board: React.FC<BoardProps> = ({ board, isOpponentBoard, onCellClick }) => {
  return (
    <BoardContainer>
      {board.map((row, y) =>
        row.map((cell, x) => (
          <BoardCell
            key={`${x}-${y}`}
            status={cell.status}
            isOpponentBoard={isOpponentBoard}
            onClick={() => onCellClick(x, y)}
          >
            {cell.status === 'hit' && '✗'}
            {cell.status === 'miss' && '○'}
          </BoardCell>
        ))
      )}
    </BoardContainer>
  );
};

export default Board; 