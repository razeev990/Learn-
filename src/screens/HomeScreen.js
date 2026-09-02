import React from 'react';

import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import PrimaryButton from '../components/PrimaryButton';

export default function HomeScreen({
  onStartGame,
}) {
  return (
    <ScrollView
      contentContainerStyle={
        styles.container
      }
    >
      <Text
        style={styles.title}
      >
        LUDO SUPREME
      </Text>

      <Text
        style={styles.subtitle}
      >
        Play • Compete • Win
      </Text>

      <View
        style={styles.logoContainer}
      >
        <Text
          style={styles.logo}
        >
          🎲
        </Text>
      </View>

      <View
        style={styles.buttons}
      >
        <PrimaryButton
          title="🤖 Play with Computer"
          onPress={() =>
            onStartGame(
              'computer'
            )
          }
        />

        <View
          style={styles.space}
        />

        <PrimaryButton
          title="🌐 Online"
          onPress={() =>
            onStartGame(
              'online'
            )
          }
        />

        <View
          style={styles.space}
        />

        <PrimaryButton
          title="👥 Team Mode"
          onPress={() =>
            onStartGame(
              'team'
            )
          }
        />

        <View
          style={styles.space}
        />

        <PrimaryButton
          title="📱 Pass & Play"
          onPress={() =>
            onStartGame(
              'pass-play'
            )
          }
        />
      </View>

      <Text
        style={styles.footer}
      >
        Ludo Supreme 🎮
      </Text>
    </ScrollView>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flexGrow: 1,

      backgroundColor:
        '#020617',

      alignItems:
        'center',

      justifyContent:
        'center',

      padding: 25,
    },

    title: {
      fontSize: 32,

      fontWeight:
        'bold',

      color:
        '#FFFFFF',

      letterSpacing: 2,
    },

    subtitle: {
      marginTop: 8,

      fontSize: 16,

      color:
        '#94A3B8',
    },

    logoContainer: {
      marginVertical: 40,

      width: 150,

      height: 150,

      borderRadius: 75,

      backgroundColor:
        '#1E293B',

      justifyContent:
        'center',

      alignItems:
        'center',

      elevation: 8,
    },

    logo: {
      fontSize: 80,
    },

    buttons: {
      width: '100%',
    },

    space: {
      height: 15,
    },

    footer: {
      marginTop: 35,

      color:
        '#64748B',

      fontSize: 14,
    },
  });
