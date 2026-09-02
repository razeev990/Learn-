import React from 'react';
import {
  StyleSheet,
  Text,
  View,
} from 'react-native';

import PrimaryButton from '../components/PrimaryButton';

export default function HomeScreen({
  onStartGame,
}) {
  const handleVsComputer = () => {
    console.log('Vs Computer selected');

    if (onStartGame) {
      onStartGame('computer');
    }
  };

  const handleOnline = () => {
    console.log('Online selected');
  };

  const handleTeamUp = () => {
    console.log('Team Up selected');
  };

  const handlePassPlay = () => {
    console.log('Pass & Play selected');

    if (onStartGame) {
      onStartGame('pass-play');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.menuContainer}>

        <Text style={styles.title}>
          LUDO SUPREME
        </Text>

        <PrimaryButton
          title="Vs Computer"
          onPress={handleVsComputer}
        />

        <View style={styles.space} />

        <PrimaryButton
          title="Online"
          onPress={handleOnline}
        />

        <View style={styles.space} />

        <PrimaryButton
          title="Team Up"
          onPress={handleTeamUp}
        />

        <View style={styles.space} />

        <PrimaryButton
          title="Pass & Play"
          onPress={handlePassPlay}
        />

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },

  menuContainer: {
    width: '80%',
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontSize: 30,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
    textAlign: 'center',
  },

  space: {
    height: 15,
  },
});
