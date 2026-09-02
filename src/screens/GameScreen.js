import React, {
  useState,
} from 'react';

import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import DiceFace from '../components/DiceFace';
import PrimaryButton from '../components/PrimaryButton';

import {
  rollDice,
} from '../utils/diceUtils';

import {
  playDiceSound,
} from '../services/SoundService';

export default function GameScreen({
  gameMode,
  onBack,
}) {
  const [
    diceValue,
    setDiceValue,
  ] = useState(1);

  const handleRollDice = () => {
    const newDiceValue =
      rollDice();

    setDiceValue(
      newDiceValue
    );

    playDiceSound();
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
      />

      <View
        style={styles.header}
      >
        <Text
          style={styles.title}
        >
          Ludo Supreme
        </Text>

        <Text
          style={styles.mode}
        >
          {gameMode === 'computer'
            ? 'Vs Computer'
            : 'Pass & Play'}
        </Text>
      </View>

      <View
        style={styles.gameArea}
      >
        <Text
          style={styles.placeholder}
        >
          Game Board Coming Soon
        </Text>

        <Text
          style={styles.info}
        >
          Roll the dice to start playing
        </Text>

        <View
          style={styles.diceContainer}
        >
          <DiceFace
            value={diceValue}
            size={90}
          />
        </View>

        <PrimaryButton
          title="Roll Dice"
          onPress={
            handleRollDice
          }
        />
      </View>

      <View
        style={styles.bottom}
      >
        <PrimaryButton
          title="Back to Menu"
          onPress={onBack}
        />
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

    header: {
      padding: 20,
      alignItems: 'center',
    },

    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: '#FFFFFF',
    },

    mode: {
      marginTop: 6,
      fontSize: 16,
      color: '#94A3B8',
    },

    gameArea: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      padding: 24,
    },

    placeholder: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#FFFFFF',
      textAlign: 'center',
    },

    info: {
      marginTop: 10,
      marginBottom: 30,
      fontSize: 16,
      color: '#94A3B8',
      textAlign: 'center',
    },

    diceContainer: {
      marginBottom: 30,
    },

    bottom: {
      padding: 20,
    },
  });
