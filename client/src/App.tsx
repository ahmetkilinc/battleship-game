import React from 'react';
import Game from './components/Game';
import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    font-family: 'Arial', sans-serif;
  }

  body {
    background-color: #f0f8ff;
  }
`;

const App: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <Game />
    </>
  );
};

export default App; 