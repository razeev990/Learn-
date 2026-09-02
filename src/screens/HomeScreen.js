import React from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import GameHeader from '../components/GameHeader';
import PrimaryButton from '../components/PrimaryButton';

export default function HomeScreen({
  onStartGame,
}) {
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar
        barStyle="light-content"
      />

      <View style={styles.content}>
        <GameHeader
          title="Ludo Supreme"
          subtitle="Welcome to the game"
        />

        <View style={styles.center}>
          <Text style={styles.welcomeText}>
            Ready to play?
          </Text>

          <Text style={styles.description}>
            Start a new Ludo game and enjoy.
          </Text>

          <PrimaryButton
            title="Start Game"
            onPress={onStartGame}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },

  content: {
    flex: 1,
  },

  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },

  welcomeText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  description: {
    marginTop: 10,
    marginBottom: 30,
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
