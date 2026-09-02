import React, {
  useState,
} from 'react';

import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Image,
  View,
} from 'react-native';

import HomeScreen from './src/screens/HomeScreen';
import GameScreen from './src/screens/GameScreen';

import {
  createInitialGameState,
  startGame,
} from './src/services/gameStateService';

export default function App() {
  const [
    currentScreen,
    setCurrentScreen,
  ] = useState('home');

  const [
    gameMode,
    setGameMode,
  ] = useState(null);

  const [
    gameState,
    setGameState,
  ] = useState(
    createInitialGameState(2)
  );

  const handleStartGame = (
    selectedMode
  ) => {
    const newGameState =
      startGame(
        createInitialGameState(2)
      );

    setGameState(
      newGameState
    );

    setGameMode(
      selectedMode
    );

    setCurrentScreen(
      'game'
    );
  };

  const handleBackToMenu = () => {
    setGameMode(null);

    setCurrentScreen(
      'home'
    );
  };

  if (
    currentScreen === 'game'
  ) {
    return (
      <GameScreen
        gameMode={gameMode}
        players={gameState.players}
        onBack={handleBackToMenu}
      />
    );
  }

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
      />

      <View
        style={styles.content}
      >
        <Image
          source={require(
            './assets/images/ludo-supreme-menu.png'
          )}
          style={styles.menuImage}
          resizeMode="contain"
        />

        <View
          style={styles.homeOverlay}
        >
          <HomeScreen
            onStartGame={
              handleStartGame
            }
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#020617',
    },

    content: {
      flex: 1,
    },

    menuImage: {
      width: '100%',
      height: '100%',
      position: 'absolute',
    },

    homeOverlay: {
      flex: 1,
    },
  });
