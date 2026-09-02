import React, {
  useState,
} from 'react';

import {
  SafeAreaView,
  StatusBar,
} from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';

export default function App() {
  const [
    currentScreen,
    setCurrentScreen,
  ] = useState('home');

  const [
    selectedGameMode,
    setSelectedGameMode,
  ] = useState('computer');

  const startGame = (
    gameMode
  ) => {
    setSelectedGameMode(
      gameMode
    );

    setCurrentScreen(
      'game'
    );
  };

  const goHome = () => {
    setCurrentScreen(
      'home'
    );
  };

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: '#020617',
      }}
    >
      <StatusBar
        barStyle="light-content"
      />

      {currentScreen ===
      'home' ? (
        <HomeScreen
          onStartGame={
            startGame
          }
        />
      ) : (
        <GameScreen
          gameMode={
            selectedGameMode
          }
          onBack={
            goHome
          }
        />
      )}
    </SafeAreaView>
  );
}
