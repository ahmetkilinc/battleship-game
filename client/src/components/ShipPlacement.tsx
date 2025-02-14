import React, { useState } from 'react';
import styled from 'styled-components';
import { Cell, Ship } from '../types/game';

interface ShipPlacementProps {
  ships: Ship[];
  onComplete: (board: Cell[][]) => void;
  disabled?: boolean;
}

const PlacementContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 40px);
  gap: 2px;
  background-color: #1e3d59;
  padding: 10px;
  border-radius: 8px;
`;

const BoardCell = styled.div<{ isShip: boolean; isHovered: boolean }>`
  width: 40px;
  height: 40px;
  background-color: ${({ isShip, isHovered }) =>
    isShip ? '#2ecc71' : isHovered ? '#3498db80' : '#3498db'};
  border: 1px solid #17263b;
  cursor: pointer;
  transition: background-color 0.2s;
`;

const Controls = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const Button = styled.button`
  padding: 8px 16px;
  background-color: #2ecc71;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  &:hover {
    background-color: #27ae60;
  }
  &:disabled {
    background-color: #95a5a6;
    cursor: not-allowed;
  }
`;

const ShipList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ShipItem = styled.div<{ isSelected: boolean; isPlaced: boolean }>`
  padding: 8px;
  background-color: ${({ isSelected, isPlaced }) =>
    isPlaced ? '#95a5a6' : isSelected ? '#3498db' : '#2ecc71'};
  color: white;
  border-radius: 4px;
  cursor: ${({ isPlaced }) => (isPlaced ? 'not-allowed' : 'pointer')};
  opacity: ${({ isPlaced }) => (isPlaced ? 0.7 : 1)};
`;

const ShipPlacement: React.FC<ShipPlacementProps> = ({ ships, onComplete, disabled = false }) => {
  const [board, setBoard] = useState<Cell[][]>(
    Array(10).fill(null).map((_, y) =>
      Array(10).fill(null).map((_, x) => ({
        x,
        y,
        status: 'empty'
      }))
    )
  );
  const [selectedShip, setSelectedShip] = useState<number | null>(null);
  const [isVertical, setIsVertical] = useState(false);
  const [hoveredCells, setHoveredCells] = useState<{ x: number; y: number }[]>([]);

  const canPlaceShip = (x: number, y: number, length: number, vertical: boolean) => {
    if (vertical) {
      if (y + length > 10) return false;
      for (let i = 0; i < length; i++) {
        if (board[y + i][x].status === 'ship') return false;
      }
    } else {
      if (x + length > 10) return false;
      for (let i = 0; i < length; i++) {
        if (board[y][x + i].status === 'ship') return false;
      }
    }
    return true;
  };

  const handleCellHover = (x: number, y: number) => {
    if (selectedShip === null) return;

    const ship = ships[selectedShip];
    const hovered: { x: number; y: number }[] = [];

    if (canPlaceShip(x, y, ship.length, isVertical)) {
      for (let i = 0; i < ship.length; i++) {
        hovered.push({
          x: isVertical ? x : x + i,
          y: isVertical ? y + i : y
        });
      }
    }

    setHoveredCells(hovered);
  };

  const handleCellClick = (x: number, y: number) => {
    if (selectedShip === null) return;

    const ship = ships[selectedShip];
    if (!canPlaceShip(x, y, ship.length, isVertical)) return;

    const newBoard = [...board];
    for (let i = 0; i < ship.length; i++) {
      const cellX = isVertical ? x : x + i;
      const cellY = isVertical ? y + i : y;
      newBoard[cellY][cellX] = {
        ...newBoard[cellY][cellX],
        status: 'ship'
      };
    }

    setBoard(newBoard);
    ships[selectedShip].placed = true;
    setSelectedShip(null);
    setHoveredCells([]);
  };

  const handleRotate = () => {
    setIsVertical(!isVertical);
    setHoveredCells([]);
  };

  const handleComplete = () => {
    if (ships.every(ship => ship.placed)) {
      onComplete(board);
    }
  };

  return (
    <PlacementContainer>
      <h2>Place Your Ships</h2>
      <div style={{ display: 'flex', gap: '20px', opacity: disabled ? 0.7 : 1 }}>
        <div>
          <Grid>
            {board.map((row, y) =>
              row.map((cell, x) => (
                <BoardCell
                  key={`${x}-${y}`}
                  isShip={cell.status === 'ship'}
                  isHovered={!disabled && hoveredCells.some(pos => pos.x === x && pos.y === y)}
                  onMouseEnter={() => !disabled && handleCellHover(x, y)}
                  onMouseLeave={() => !disabled && setHoveredCells([])}
                  onClick={() => !disabled && handleCellClick(x, y)}
                />
              ))
            )}
          </Grid>
          <Controls>
            <Button onClick={handleRotate} disabled={selectedShip === null || disabled}>
              Rotate Ship
            </Button>
            <Button
              onClick={handleComplete}
              disabled={!ships.every(ship => ship.placed) || disabled}
            >
              Complete Placement
            </Button>
          </Controls>
        </div>
        <ShipList>
          {ships.map((ship, index) => (
            <ShipItem
              key={index}
              isSelected={selectedShip === index}
              isPlaced={ship.placed}
              onClick={() => !disabled && !ship.placed && setSelectedShip(index)}
            >
              Ship Length: {ship.length}
            </ShipItem>
          ))}
        </ShipList>
      </div>
    </PlacementContainer>
  );
};

export default ShipPlacement; 