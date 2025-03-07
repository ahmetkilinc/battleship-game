import React, { useState } from 'react';
import styled from 'styled-components';
import { Cell, Ship, Country } from '../types/game';

interface ShipPlacementProps {
  ships: Ship[];
  onComplete: (board: Cell[][]) => void;
  disabled?: boolean;
  country?: Country;
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

// Function to generate colors for countries
const getCountryColors = (country?: Country) => {
  // Default colors if no country is selected
  if (!country) return { main: '#2ecc71', light: '#4eec91', dark: '#0eac51' };
  
  // Color mapping for countries
  const colorMap: Record<string, { main: string, light: string, dark: string }> = {
    'TR': { main: '#e30a17', light: '#ff3b47', dark: '#c00812' }, // Turkey - Red
    'US': { main: '#3c3b6e', light: '#5c5b8e', dark: '#2c2b5e' }, // USA - Navy Blue
    'GB': { main: '#012169', light: '#213179', dark: '#001159' }, // UK - Dark Blue
    'DE': { main: '#dd0000', light: '#fd3030', dark: '#bd0000' }, // Germany - Red
    'FR': { main: '#002654', light: '#203674', dark: '#001644' }, // France - Blue
    'IT': { main: '#009246', light: '#20b266', dark: '#007236' }, // Italy - Green
    'ES': { main: '#aa151b', light: '#ca353b', dark: '#8a050b' }, // Spain - Red
    'JP': { main: '#bc002d', light: '#dc204d', dark: '#9c001d' }, // Japan - Red
    'CN': { main: '#de2910', light: '#fe4930', dark: '#be0900' }, // China - Red
    'RU': { main: '#0039a6', light: '#2059c6', dark: '#002986' }, // Russia - Blue
    'BR': { main: '#009c3b', light: '#20bc5b', dark: '#007c2b' }, // Brazil - Green
    'IN': { main: '#ff9933', light: '#ffb953', dark: '#df7913' }  // India - Saffron
  };
  
  return colorMap[country.code] || { main: '#2ecc71', light: '#4eec91', dark: '#0eac51' };
};

const BoardCell = styled.div<{ 
  isShip: boolean; 
  isHovered: boolean; 
  country?: Country;
}>`
  width: 40px;
  height: 40px;
  background-color: ${({ isShip, isHovered, country }) => {
    if (isShip) {
      const colors = getCountryColors(country);
      return colors.main;
    }
    return isHovered ? '#3498db80' : '#3498db';
  }};
  border: 1px solid #17263b;
  cursor: pointer;
  transition: background-color 0.2s;
  position: relative;

  &::after {
    content: '';
    display: ${({ isShip }) => isShip ? 'block' : 'none'};
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 20px;
    height: 20px;
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 50%;
  }
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

const ShipItem = styled.div<{ 
  isSelected: boolean; 
  isPlaced: boolean;
  country?: Country;
}>`
  padding: 8px;
  background-color: ${({ isSelected, isPlaced, country }) => {
    if (isPlaced) return '#95a5a6';
    if (isSelected) return '#3498db';
    
    const colors = getCountryColors(country);
    return colors.main;
  }};
  color: white;
  border-radius: 4px;
  cursor: ${({ isPlaced }) => (isPlaced ? 'not-allowed' : 'pointer')};
  opacity: ${({ isPlaced }) => (isPlaced ? 0.7 : 1)};
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ShipIcon = styled.div<{ length: number; country?: Country }>`
  height: 20px;
  width: ${({ length }) => length * 10}px;
  background-color: ${({ country }) => {
    const colors = getCountryColors(country);
    return colors.light;
  }};
  border-radius: 2px;
`;

const CountryInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 20px;
`;

const CountryFlag = styled.img`
  width: 30px;
  height: 20px;
  object-fit: cover;
  border-radius: 2px;
`;

const ShipPlacement: React.FC<ShipPlacementProps> = ({ ships, onComplete, disabled = false, country }) => {
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
      {country && (
        <CountryInfo>
          <CountryFlag src={country.flag} alt={`${country.name} flag`} />
          <span>{country.name} Fleet</span>
        </CountryInfo>
      )}
      <div style={{ display: 'flex', gap: '20px', opacity: disabled ? 0.7 : 1 }}>
        <div>
          <Grid>
            {board.map((row, y) =>
              row.map((cell, x) => (
                <BoardCell
                  key={`${x}-${y}`}
                  isShip={cell.status === 'ship'}
                  isHovered={!disabled && hoveredCells.some(pos => pos.x === x && pos.y === y)}
                  country={country}
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
              country={country}
              onClick={() => !disabled && !ship.placed && setSelectedShip(index)}
            >
              <ShipIcon length={ship.length} country={country} />
              Ship Length: {ship.length}
            </ShipItem>
          ))}
        </ShipList>
      </div>
    </PlacementContainer>
  );
};

export default ShipPlacement; 