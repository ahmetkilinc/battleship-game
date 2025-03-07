import React from 'react';
import styled from 'styled-components';
import { Cell, Country } from '../types/game';

interface BoardProps {
  board: Cell[][];
  isOpponentBoard: boolean;
  onCellClick: (x: number, y: number) => void;
  country?: Country;
}

const BoardContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(10, 40px);
  gap: 2px;
  background-color: #1e3d59;
  padding: 10px;
  border-radius: 8px;
  position: relative;
`;

const BoardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
`;

const CountryFlag = styled.img`
  width: 30px;
  height: 20px;
  object-fit: cover;
  border-radius: 2px;
`;

// Function to generate a lighter and darker shade of a color
const getCountryColors = (country?: Country) => {
  // Default colors if no country is selected
  if (!country) return { main: '#3498db', light: '#5dade2', dark: '#2980b9' };
  
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
  
  return colorMap[country.code] || { main: '#3498db', light: '#5dade2', dark: '#2980b9' };
};

const getCellColor = (cell: Cell, isOpponentBoard: boolean, country?: Country) => {
  const colors = getCountryColors(country);
  
  switch (cell.status) {
    case 'ship':
      return isOpponentBoard ? '#3498db' : colors.main;
    case 'hit':
      return '#e74c3c';
    case 'miss':
      return '#95a5a6';
    default:
      return '#3498db';
  }
};

const BoardCell = styled.div<{ 
  status: string; 
  isOpponentBoard: boolean; 
  country?: Country;
}>`
  width: 40px;
  height: 40px;
  background-color: ${({ status, isOpponentBoard, country }) => 
    getCellColor({ status } as Cell, isOpponentBoard, country)};
  border: 1px solid #17263b;
  cursor: pointer;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  position: relative;

  &:hover {
    opacity: 0.8;
  }

  &::after {
    content: '';
    display: ${({ status, isOpponentBoard }) => 
      status === 'ship' && !isOpponentBoard ? 'block' : 'none'};
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

const Board: React.FC<BoardProps> = ({ board, isOpponentBoard, onCellClick, country }) => {
  return (
    <>
      {country && (
        <BoardHeader>
          <CountryFlag src={country.flag} alt={`${country.name} flag`} />
          <span>{country.name} Fleet</span>
        </BoardHeader>
      )}
      <BoardContainer>
        {board.map((row, y) =>
          row.map((cell, x) => (
            <BoardCell
              key={`${x}-${y}`}
              status={cell.status}
              isOpponentBoard={isOpponentBoard}
              country={country}
              onClick={() => onCellClick(x, y)}
            >
              {cell.status === 'hit' && '✗'}
              {cell.status === 'miss' && '○'}
            </BoardCell>
          ))
        )}
      </BoardContainer>
    </>
  );
};

export default Board; 