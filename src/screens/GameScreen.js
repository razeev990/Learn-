import React, {
  useState,
} from 'react';

import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ScrollView,
} from 'react-native';

import LudoBoard from '../components/LudoBoard';
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
    const newDiceValue = rollDice();

    setDiceValue(newDiceValue);

    playDiceSound();
  };

  const getGameModeName = () => {
    if (gameMode === 'computer') {
      return 'Vs Computer';
    }

    if (gameMode === 'pass-play') {
      return 'Pass & Play';
    }

    return 'Ludo Game';
  };

  return (
    <SafeAreaView
      style={styles.container}
    >
      <StatusBar
        barStyle="light-content"
      />

      <View style={styles.header}>
        <Text style={styles.title}>
          Ludo Supreme
        </Text>

        <Text style={styles.mode}>
          {getGameModeName()}
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={
          styles.scrollContent
        }
      >
        <View style={styles.boardContainer}>
          <LudoBoard />
        </View>

        <Text style={styles.turnText}>
          Roll the dice
        </Text>

        <View style={styles.diceContainer}>
          <DiceFace
            value={diceValue}
            size={80}
          />
        </View>

        <View style={styles.buttonContainer}>
          <PrimaryButton
            title="Roll Dice 🎲"
            onPress={handleRollDice}
          />
        </View>

        <View style={styles.backContainer}>
          <PrimaryButton
            title="Back to Menu"
            onPress={onBack}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },

  header: {
    paddingVertical: 15,
    alignItems: 'center',
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  mode: {
    marginTop: 5,
    fontSize: 15,
    color: '#94A3B8',
  },

  scrollContent: {
    alignItems: 'center',
    paddingBottom: 25,
  },

  boardContainer: {
    width: '94%',
    marginTop: 5,
  },

  turnText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  diceContainer: {
    marginTop: 15,
    marginBottom: 20,
  },

  buttonContainer: {
    width: '80%',
  },

  backContainer: {
    width: '80%',
    marginTop: 15,
  },
});
