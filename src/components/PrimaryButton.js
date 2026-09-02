import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
} from 'react-native';

import {
  playCutSound,
} from '../services/SoundService';

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
}) {
  const handlePress = () => {
    if (disabled) {
      return;
    }

    playCutSound();

    if (onPress) {
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        pressed &&
          !disabled &&
          styles.pressedButton,
        disabled &&
          styles.disabledButton,
      ]}
    >
      <Text style={styles.buttonText}>
        {title}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: 58,

    justifyContent: 'center',
    alignItems: 'center',

    paddingHorizontal: 20,

    backgroundColor: '#2563EB',

    borderRadius: 16,

    borderWidth: 2,
    borderColor: '#FFFFFF',

    elevation: 8,
  },

  pressedButton: {
    transform: [
      {
        scale: 0.96,
      },
    ],

    opacity: 0.85,
  },

  disabledButton: {
    opacity: 0.5,
  },

  buttonText: {
    fontSize: 19,
    fontWeight: 'bold',

    color: '#FFFFFF',

    textAlign: 'center',

    letterSpacing: 0.5,
  },
});
