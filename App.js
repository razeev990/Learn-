import React, {
  useState,
} from 'react';

import HomeScreen from './src/screens/HomeScreen';

import {
  createInitialGameState,
  startGame,
} from './src/services/gameStateService';


export default function App() {
  const [
    gameState,
    setGameState,
  ] = useState(
    createInitialGameState(2)
  );


  const handleStartGame = () => {
    const updatedGameState =
      startGame(gameState);

    setGameState(updatedGameState);

    console.log(
      'Game Started:',
      updatedGameState
    );
  };


  return (
    <HomeScreen
      onStartGame={
        handleStartGame
      }
    />
  );
}
