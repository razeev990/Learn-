import React from 'react';

import {
  StyleSheet,
  Text,
  TouchableOpacity,
} from 'react-native';

export default function PrimaryButton({
  title,
  onPress,
  disabled = false,
}) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        disabled &&
          styles.disabledButton,
      ]}
    >
      <Text
        style={styles.text}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles =
  StyleSheet.create({
    button: {
      minHeight: 52,

      borderRadius: 14,

      justifyContent:
        'center',

      alignItems:
        'center',

      paddingHorizontal: 20,

      backgroundColor:
        '#2563EB',

      elevation: 4,
    },

    disabledButton: {
      opacity: 0.5,
    },

    text: {
      color: '#FFFFFF',

      fontSize: 17,

      fontWeight: 'bold',
    },
  });
